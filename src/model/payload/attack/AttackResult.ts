import { Position } from "../game/Position";
import AttackStatus from "./AttackStatus";

export class AttackResult {
    readonly position: Position
    readonly currentPlayer: string
    readonly status: AttackStatus
    readonly ruined: boolean
    private _neighbors: Position[]|undefined

    constructor (position: Position, player: string, st: AttackStatus, ruined: boolean) {
        this.position = position
        this.currentPlayer = player
        this.status = st
        this.ruined = ruined
    }

    public setNeightbors(neighbors: Position[]) {
        this._neighbors = neighbors
    }

    public get neighbors() {
        return this._neighbors
    }
}