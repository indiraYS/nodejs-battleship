import { ShipAttack } from "./ShipAttack";
import { ShipPosition } from "../payload/game/ShipPosition";
import { Position } from "../payload/game/Position";
import AttackStatus from "../payload/attack/AttackStatus";
import { randomInt } from "crypto";
import { Bot } from "./Bot";

export class BattleShip {
    private first: ShipAttack[]
    private firstId: string
    private second: ShipAttack[] | undefined = undefined
    private secondId: string | undefined = undefined

    public static BOT = 'bot'

    private bot: Bot|undefined

    constructor(id: string, ships: ShipPosition[]) {
        this.first = this.getAttack(ships)
        this.firstId = id;
    }

    public initBot() {
        this.bot = new Bot()
        this.addSecond(BattleShip.BOT, this.bot.generate())
    }

    public getFirst(): [string, ShipAttack[]] {
        return [this.firstId, this.first]
    }

    public getFirstId() {
        return this.firstId
    }

    public getSecond(): [string, ShipAttack[]] | undefined {
        return this.secondId === undefined ? undefined : [this.secondId, this.second!]
    }

    public getSecondId() {
        return this.secondId
    }

    public addSecond(id: string, ships: ShipPosition[]) {
        this.second = this.getAttack(ships)
        this.secondId = id
    }

    public attackFirst(pos: Position): [AttackStatus, boolean, ShipPosition?] {
        return this.attack(pos, this.first)
    }

    public randomAttackFirst(): [Position, AttackStatus, boolean, ShipPosition?] {
        return this.randomAttack(this.first)
    }

    public attackSecond(pos: Position): [AttackStatus, boolean, ShipPosition?] {
        return this.attack(pos, this.second!)
    }

    public randomAttackSecond(): [Position, AttackStatus, boolean, ShipPosition?] {
        return this.randomAttack(this.second!)
    }

    public botAttack(): [AttackStatus, Boolean, Position] {
        if (this.bot == undefined) throw new Error('this is not bot game')
        let pos: Position|undefined = undefined

        if (this.bot.lastsuccess.length > 0) {
            let last = this.bot.lastsuccess.pop()
            while (last !== undefined && pos ===undefined) {
                const dirs = this.bot.dirs(last.x, last.y)
                // console.log(dirs)
                for (const dir of dirs) {
                    console.log(this.bot.visited.length, dir)
                    if (!this.bot.isVisited(dir)) {
                        if (dir.x > -1 && dir.y > -1 && dir.x < 10 && dir.y < 10) {
                            pos = dir;
                            break;
                        }
                    }
                    console.log('------')
                }
                if (pos===undefined) last = this.bot.lastsuccess.pop()
            }
        } else {
            pos = new Position(randomInt(0, 9), randomInt(0, 9))
            let is_visited = this.bot.isVisited(pos)
            while (is_visited) {
                pos = new Position(randomInt(0, 9), randomInt(0, 9))
                console.log("check:", pos)
                is_visited = this.bot.isVisited(pos)
            }
            console.log("next is", pos)
        }
        if (pos == undefined) throw new Error("bot attack pos undefined")
        const [st, ruined, shipPos] = this.attackFirst(pos)
        
        if (st == AttackStatus.KILLED) {
            while(this.bot.lastsuccess.length > 0) {
                this.bot.lastsuccess.pop()
            }  // to search next random place
            this.bot.visited.push(...this.neigbours(shipPos!))
        } else if (st == AttackStatus.SHOT) {
            this.bot.lastsuccess.push(pos)
        } else {
            if (this.bot.lastsuccess.length > 0) {
                this.bot.lastsuccess.pop()
            }
        }
        this.bot.visited.push(pos)
        return [st, ruined, pos]
    }

    public neigbours(pos: ShipPosition): Position[] {
        const res: Position[] = []
        if (pos.direction) // vertical
        {
            if (pos.position.x - 1 > -1) {
                for (let i = -1; i <= pos.length; i++) {
                    if (pos.position.y + i > -1 && pos.position.y + i < 10) {
                        res.push(new Position(pos.position.x - 1, pos.position.y + i))
                    }
                }
            }

            if (pos.position.x + 1 < 10) {
                for (let i = -1; i <= pos.length; i++) {
                    if (pos.position.y + i > -1 && pos.position.y + i < 10) {
                        res.push(new Position(pos.position.x + 1, pos.position.y + i))
                    }
                }
            }

            if (pos.position.y - 1 > -1) {
                res.push(new Position(pos.position.x, pos.position.y - 1))
            }

            if (pos.position.y + pos.length < 10) {
                res.push(new Position(pos.position.x, pos.position.y + pos.length))
            }
        } else {
            // horizontal
            if (pos.position.y - 1 > -1) {
                for (let i = -1; i <= pos.length; i++) {
                    if (pos.position.x + i > -1 && pos.position.x + i < 10) {
                        res.push(new Position(pos.position.x + i, pos.position.y - 1))
                    }
                }
            }
            if (pos.position.y + 1 < 10) {
                for (let i = -1; i <= pos.length; i++) {
                    if (pos.position.x + i > -1 && pos.position.x + i < 10) {
                        res.push(new Position(pos.position.x + i, pos.position.y + 1))
                    }
                }
            }

            if (pos.position.x - 1 > -1) {
                res.push(new Position(pos.position.x - 1, pos.position.y))
            }

            if (pos.position.x + pos.length < 10) {
                res.push(new Position(pos.position.x + pos.length, pos.position.y))
            }
        }

        return res;
    }

    private randomAttack(ships: ShipAttack[]): [Position, AttackStatus, boolean, ShipPosition?] {
        let ruined = false; // if all destroyed
        let res = 0;
        let shipPos: ShipPosition|undefined

        let exist: boolean = true;
        let pos: Position

        while (exist) {
            pos = new Position(randomInt(0, 9), randomInt(0, 9))
            exist = false
            for (const ship of ships) { 
                if (ship.attack.indexOf(pos) > -1) {
                    exist = true
                    break
                }
            }
        }
        const sure: Position = pos!
        const attack = this.attack(sure, ships)
        return [sure, attack[0], attack[1], attack[2]]
    }

    private attack(pos: Position, ships: ShipAttack[]): [AttackStatus, boolean, ShipPosition?] {
        let ruined = false; // if all destroyed
        let res = 0;
        let shipPos: ShipPosition|undefined
        //console.log(`-------- pos x: ${pos.x}, y: ${pos.y} --------`)
        //console.log(ships)
        for (const ship of ships) {
            if (!ship.isDestroyed()) {
                res = ship.tryAttack(pos)
                //console.log(ship.position)
                if (res > 0) {
                    shipPos = ship.position
                    break
                }
            }
        }
        // console.log(`-------- ${res}`)

        let status: AttackStatus
        switch (res) {
            case 0:
                status = AttackStatus.MISS
                break;
            case 1:
                status = AttackStatus.SHOT
                break;
            case 2:
                status = AttackStatus.KILLED
                break;
            default:
                throw new Error(`unexpected attack result ${res}`)
        }

        if (res == 2) // check if all destroyed
        {
            ruined = true
            for (const ship of ships) {
                if (!ship.isDestroyed()) {
                    ruined = false
                    break
                }
            }
        }
        return [status, ruined, shipPos] // status current ship, i
    }

    private getAttack(ships: ShipPosition[]) {
        const attack: ShipAttack[] = []

        ships.forEach(pos => {
            attack.push(new ShipAttack(pos))
        })
        return attack
    }
}