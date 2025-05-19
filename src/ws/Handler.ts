import { GameMessage } from "../model/GameMessage";
import MessageType from "../model/MessageType";
import { RegRequest } from "../model/payload/reg/RegRequest";
import { db } from "../db/userdatabase"
import { RegResponse } from "../model/payload/reg/RegResponse";
import { RoomInfo } from "../model/payload/room/RoomInfo";
import { Player } from "../model/entity/Player";
import { AddUserToRoomResult } from "../model/internal/AddUserToRoomResult"
import { BattleShip } from "../model/internal/BattleShip"
import { AddShips } from "../model/payload/game/AddShips";
import { StartGame } from "../model/payload/game/StartGame";
import { Attack } from "../model/payload/attack/Attack";
import { Position } from "../model/payload/game/Position";
import { ShipPosition } from "../model/payload/game/ShipPosition"
import { RandomAttack } from "../model/payload/attack/RandomAttack";
import AttackStatus from "../model/payload/attack/AttackStatus"
import { Turn } from "../model/payload/turn/Turn";
import { AttackResult } from "../model/payload/attack/AttackResult"
import { AttackResultMessage } from "../model/payload/attack/AttackResultMessage"
import { Finish } from "../model/payload/finish/Finish"
import { AttackNotificatios } from "../model/internal/AttackNotifications"
import { Attacker } from "../model/payload/attack/Attacker";

export class Handler {
    private database = db()
    private battleShips = new Map<string, BattleShip>()
    //private bots = new Map<string, Bot>()

    public reg(payload: RegRequest): RegResponse {
        const user = this.database.login(payload.name, payload.password)
        return typeof user === "string" ? new RegResponse(payload.name, undefined, true, user) : new RegResponse(user.name, user.id)
    }

    public createRoom(userId: string): string {
        return this.database.createRoom(userId)
    }

    public updateRoom(): RoomInfo[] {
        const res: RoomInfo[] = []
        const rooms = this.database.rooms();
        const players = this.database.players();
        rooms.forEach(element => {
            let secondPlayer: Player | undefined = undefined
            let firstPlayer: Player
            const find = players.filter(x => x.id == element.first_player_id)
            if (find.length > 0) {
                firstPlayer = find[0];
            } else {
                throw Error("unexpected case, first player not found")
            }
            if (element.second_player_id !== undefined) {
                const findSecond = players.filter(x => x.id == element.second_player_id)
                if (findSecond.length > 0) {
                    secondPlayer = findSecond[0];
                }
            }

            res.push(new RoomInfo(<string>element.id, firstPlayer, secondPlayer))
        });
        return res
    }

    public addUserToRoom(userId: string, roomId: string): AddUserToRoomResult {
        const user = this.database.findUser(userId)
        if (user == undefined) {
            throw Error("unexpected case, user not found")
        }
        let room = this.database.findRoom(roomId)
        if (room == undefined) {
            throw Error("room not found")
        }
        let success = false;
        if (room.second_player_id == undefined && room.first_player_id != userId) {
            this.database.saveSecondPlayer(roomId, userId)
            success = true;
        }
        return new AddUserToRoomResult(success, <string>room.first_player_id, <string>room.second_player_id)
    }

    public singlePlayRoom(userId: string): string {
        const room =  this.database.singlePlayRoom(userId)
        this.createGame(room)
        return room
    }

    // returns first playerId
    public createGame(roomId: string): string {
        let room = this.database.findRoom(roomId)
        if (room == undefined) {
            throw Error("room not found")
        }
        if (room == undefined || room.second_player_id == undefined) throw new Error("room empty or second player not defined")
        this.database.createGame(roomId)
        return <string>room.first_player_id
    }

    public addShips(request: AddShips): boolean {
        let battle = this.battleShips.get(request.gameId)
        if (battle == undefined) {
            if (this.database.isBotGame(request.gameId)) {
                battle = new BattleShip(request.indexPlayer, request.ships);
                battle.initBot()
                this.battleShips.set(request.gameId, battle)
                return true;
            } else {
                this.battleShips.set(request.gameId, new BattleShip(request.indexPlayer, request.ships))
                return false;
            }
        }
        const first = battle.getFirst()
        if (first[0] == request.indexPlayer) {
            return false;
        }
        const second = battle.getSecond()
        if (second != undefined && second[0] == request.indexPlayer) {
            return false;
        }
        battle.addSecond(request.indexPlayer, request.ships)

        if (battle.getFirstId == battle.getSecondId) {
            throw new Error("unexpected case opponents are same")
        }
        return true
    }

    public startGame(gameId: string, indexPlayer: string): [StartGame, StartGame] {
        const battle = this.battleShips.get(gameId)
        if (battle == undefined || battle.getSecond() == undefined) {
            throw new Error("unexpected case, positions must be ready")
        }
        console.log(`first player is: ${battle.getFirstId()}`)
        this.database.setTurn(gameId, battle.getFirstId());
        const first = battle.getFirst()
        const gameFirst = new StartGame(first[0], first[1])

        const second = battle.getSecond()!
        const gameSecond = new StartGame(second[0], second[1])
        return [gameFirst, gameSecond]
    }

    public attack(attack: Attack): AttackResult {
        const battle = this.battleShips.get(attack.gameId)
        if (battle == undefined) throw new Error("battle not found")

        const [st, ruined, ship] = (battle.getFirstId() == attack.indexPlayer) ?
            battle.attackSecond(new Position(attack.x, attack.y)) :
            battle.attackFirst(new Position(attack.x, attack.y))

        if (ruined) {
            this.saveWinner(attack.gameId, attack.indexPlayer)
            this.battleShips.delete(attack.gameId)
        } else if (st == AttackStatus.MISS) {
            this.database.changeTurn(attack.gameId)
        }

        const res = new AttackResult(new Position(attack.x, attack.y), attack.indexPlayer, st, ruined);

        if (ship) {
            res.setNeightbors(battle.neigbours(ship))
        }

        return res;
        // return [st, ruined, ship]
        //return this.attackNotification(attack.gameId, attack.indexPlayer, new Position(attack.x, attack.y), st, ruined, neighbors)
    }

    private botAttack(gameId: string) {
        const battle = this.battleShips.get(gameId)
        if (battle == undefined) throw new Error("battle not found")
        const [st, ruined] = battle.botAttack()
    }

    public attackNotification(attacker: Attacker, 
        attack: AttackResult
    ):
        AttackNotificatios {
        const [first, second] = this.players(attacker.gameId)
        let opponentMessage: [string, GameMessage] | undefined
        let both: [string, string, GameMessage] | undefined
        const broadcast: GameMessage[] = []
        let personal: GameMessage[] = []
        if (!attack.ruined) {
            let turnMessage: Turn
            if (attack.status == AttackStatus.MISS) {
                turnMessage = new Turn(first === attacker.indexPlayer ? second : first)
            } else {
                turnMessage = new Turn(attacker.indexPlayer)
            }
            both = [first, second, GameMessage.make(MessageType.TURN, turnMessage)]
            personal.push(GameMessage.make(MessageType.ATTACK, new AttackResultMessage(attack.position.x, attack.position.y, attacker.indexPlayer, attack.status)))
            
            const opponentId = first === attacker.indexPlayer ? second : first
            opponentMessage = [opponentId, GameMessage.make(MessageType.ATTACK, new AttackResultMessage(attack.position.x, attack.position.y, attacker.indexPlayer, attack.status))]

            if (attack.status == AttackStatus.KILLED && attack.neighbors) {
                for (const n of attack.neighbors) {
                    personal.push(GameMessage.make(MessageType.ATTACK, new AttackResultMessage(n.x, n.y, attacker.indexPlayer, AttackStatus.MISS)))
                }
            }
        } else {
            broadcast.push(GameMessage.make(MessageType.UPDATE_WINNERS, this.getWinners()))
            both = [first, second, GameMessage.make(MessageType.FINISH, new Finish(attacker.indexPlayer))]
            personal.push(GameMessage.make(MessageType.ATTACK, new AttackResultMessage(attack.position.x, attack.position.y, attacker.indexPlayer, attack.status)))
        }
        return new AttackNotificatios(personal, opponentMessage, both, broadcast)
    }

    public randomAttack(attack: RandomAttack) {
        const battle = this.battleShips.get(attack.gameId)
        if (battle == undefined) throw new Error("battle not found")
        const [pos, st, ruined, ship] = (battle.getFirstId() == attack.indexPlayer) ? 
    battle.randomAttackSecond() : battle.randomAttackFirst()
        
        // let neighbors : Position[] | undefined = undefined
        // if (ship) neighbors = battle.neigbours(ship)

        if (ruined) {
            // console.log(`==== WINNER IS ===${attack.indexPlayer}`)
            this.saveWinner(attack.gameId, attack.indexPlayer)
            this.battleShips.delete(attack.gameId)
        } else if (st == AttackStatus.MISS) {
            this.database.changeTurn(attack.gameId)
        }

        const res = new AttackResult(pos, attack.indexPlayer, st, ruined);

        if (ship) {
            res.setNeightbors(battle.neigbours(ship))
        }

        return res;
    }

    public getNeigbours(gameId: string, ship: ShipPosition|undefined): Position[]|undefined {
        if (!ship) return undefined
        return this.battleShips.get(gameId)?.neigbours(ship)
    }

    public getTurn(gameId: string) : string {
        const res = this.database.getTurn(gameId)
        if (res == null) throw new Error('turn not found ' + gameId)
        return res
    }

    public saveWinner(gameId: string, playerId: string) {
        this.database.saveWinner(gameId, playerId)
    }

    public getWinners() {
        return this.database.getWinners()
    }

    public players(gameId: string): [string, string] {
        const players = this.database.gamePlayers(gameId)

        //const battle = this.battleShips.get(gameId)
        if (players == undefined) throw new Error("game not found")
        return [<string>players.first_player_id, <string>players.second_player_id]
    }

    public payload<T>(data: string): T {
        return JSON.parse(data)
    }
}