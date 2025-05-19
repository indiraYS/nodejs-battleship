import {DatabaseSync} from 'node:sqlite';
import {Player} from "../model/entity/Player";
import { randomUUID } from 'node:crypto';
import { Turn } from '../model/payload/turn/Turn';
import { BattleShip } from '../model/internal/BattleShip';

class Userdatabase {
    private db = new DatabaseSync(':memory:');

    private static _instance: Userdatabase;

    private constructor() {
    }

    private init() {
        this.db.exec(`
            create table user
            (
                id  string primary key,
                name string unique,
                password  string not null
            )
        `)

        this.db.exec(`
            create table room
            (
                id string primary key,
                first_player_id  string,
                second_player_id string,
                available boolean
            )
        `)

        this.db.exec(`
            create table game
            (
                id string primary key,
                turn string,
                winner_id string
            )
        `)

        /// --- create user bot
        this.db.exec(`insert into user (id, name, password) values ('${BattleShip.BOT}', 'bot', 'b0t#123')`)
    }

    static instance() {
        if (Userdatabase._instance == undefined) {
            Userdatabase._instance = new Userdatabase()
            Userdatabase._instance.init()
        }
        return Userdatabase._instance
    }

    public login(username: string, password: string): Player | string {
        const statement = this.db.prepare(`select * from user where name = ?`)
        let user = statement.get(username)
        if (user) {
            if (<string>user.password === password) {
                return new Player(<string>user.id, <string>user.name);
            } else {
                return "invalid password"
            }
        } else {
            const creatStmt = this.db.prepare('insert into user (id, name, password) values (?, ?, ?) returning *')
            user = creatStmt.get(randomUUID(), username, password);
            return new Player(<string>user!!.id, <string>user!!.name);
        }
    }

    public findUser(userId: string) {
        const statement = this.db.prepare(`select * from user where id = ?`)
        return statement.get(userId)
    }

    public findRoom(roomId: string) {
        const statement = this.db.prepare(`select * from room where id = ?`)
        return statement.get(roomId)
    }

    public saveSecondPlayer(roomId: string, userId: string) {
        const statement = this.db.prepare(`update room set second_player_id = ? where id = ?`)
        statement.run(userId, roomId)
    }

    public singlePlayRoom(userId: string) {
        const statement = this.db.prepare(`insert into room (id, first_player_id, second_player_id) values (?, ?, (select id from user where name = 'bot'))`)
        const roomId = randomUUID()
        statement.run(roomId, userId)
        return roomId
    }

    public createRoom(userId: string) : string {
        const statement = this.db.prepare(`insert into room (id, first_player_id, available) values (?, ?, 'true')`)
        const roomId = randomUUID()
        statement.run(roomId, userId)
        return roomId
    }

    public createGame(roomId: string) {
        const roomStmt = this.db.prepare(`update room set available = false where id = ?`)
        roomStmt.run(roomId)

        const statement = this.db.prepare('insert into game (id) values (?)')
        statement.run(roomId)
    }

    public gamePlayers(gameId: string) {
        const stmt = this.db.prepare(`select first_player_id, second_player_id from room where id = ?`)
        return stmt.get(gameId)
    }

    public isBotGame(gameId: string) {
        const stmt = this.db.prepare(`select u.name from room r join user u on u.id = r.second_player_id where r.id = ?`)
        const res = stmt.get(gameId)
        if (res == undefined || res.name != 'bot') return false
        return true
    }

    public saveWinner(gameId: string, playerId: string) {
        const stmt = this.db.prepare(`update game set winner_id = ? where id = ?`)
        stmt.run(playerId, gameId)
    }

    public getWinners() {
        const stmt = this.db.prepare(`
select u.name, winners.wins as wins from user u join (select g.winner_id, count(*) as wins from game g 
where g.winner_id is not null group by g.winner_id) winners on winners.winner_id = u.id
where winners.wins > 0
`)
        return stmt.all()
    }
    public setTurn(gameId : string, playerId: string) {
        const stmt = this.db.prepare(`update game set turn = ? where id = ?`)
        stmt.run(playerId, gameId)
    }

    public changeTurn(gameId : string) {
        const stmtPlayer = this.db.prepare('select first_player_id, second_player_id from room where id = ?')
        const pl = stmtPlayer.get(gameId)
        if (pl == undefined) throw new Error('room not found')

        const current = this.getTurn(gameId)
        if (current == undefined) throw new Error('turn not found')

        const next = current == pl.first_player_id ? pl.second_player_id : pl.first_player_id
        
        const stmt = this.db.prepare(`update game set turn= ? where id = ?`)
        stmt.run(next, gameId)
    }

    public getTurn(gameId : string) : string|undefined{
        const stmt = this.db.prepare(`select turn from game where id = ?`)
        const res = stmt.get(gameId)
        if (res != undefined) return <string>res.turn
        return undefined
    }

    public rooms() {
        const stmt = this.db.prepare(`select * from room where available = 'true'`)
        return stmt.all()
    }

    public players(): Player[] {
        const stmt = this.db.prepare('select * from user')
        const entities = stmt.all()
        const response: Array<Player> = []
        entities.forEach(element => {
            response.push(new Player(<string>element.id, <string>element.name));
        });
        return response
    }
}

export function db(): Userdatabase {
    return Userdatabase.instance()
}

