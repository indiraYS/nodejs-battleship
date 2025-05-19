import { Position } from "../game/Position";
import AttackStatus from "./AttackStatus";

export class AttackResult {
    readonly goal: Position
    readonly currentPlayer: string
    readonly status: AttackStatus
    readonly ruined: boolean
    private _neigbours: Position[]|undefined = undefined

    constructor (x: number, y: number, player: string, st: AttackStatus, ruined: boolean) {
        this.goal = new Position(x, y)
        this.currentPlayer = player
        this.status = st
        this.ruined = ruined
    }

    public get neigbours() { return this._neigbours; }

    public setNeigbours(n: Position[]) {
        this._neigbours = n
    }
}