import { Attacker } from "./Attacker"
export class RandomAttack implements Attacker {
    readonly gameId: string
    readonly indexPlayer: string
    constructor (gameId: string, indexPlayer: string) {
        this.gameId = gameId;
        this.indexPlayer = indexPlayer;
    }
}