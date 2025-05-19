import AttackStatus from "./AttackStatus"
import { Position } from "../game/Position";

export class AttackResultMessage{ 
    readonly position: Position 
    readonly indexPlayer: string
    readonly status: AttackStatus

    constructor (x: number,y: number, indexPlayer: string, status: AttackStatus) {
        this.position = new Position(x, y)
        this.indexPlayer = indexPlayer
        this.status = status
    }
}