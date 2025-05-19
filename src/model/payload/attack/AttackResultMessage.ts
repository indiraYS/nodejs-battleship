import AttackStatus from "./AttackStatus"
import { Position } from "../game/Position";

export class AttackResultMessage { 
    readonly position: Position 
    readonly currentPlayer: string
    readonly status: AttackStatus

    constructor (x: number,y: number, currentPlayer: string, status: AttackStatus) {
        this.position = new Position(x, y)
        this.currentPlayer = currentPlayer
        this.status = status
    }
}