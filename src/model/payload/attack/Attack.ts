import { Attacker } from "./Attacker"
export class Attack implements Attacker{
    readonly gameId: string
    readonly x: number
    readonly y: number
    readonly indexPlayer: string

    constructor(gameId: string, x: number, y: number, index: string) {
        this.gameId = gameId
        this.x = x
        this.y = y
        this.indexPlayer = index
    }
}