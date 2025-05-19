import { ShipPosition } from "./ShipPosition";

export class AddShips {
    readonly gameId: string;
    readonly ships: ShipPosition[]
    readonly indexPlayer: string
    constructor(gameId: string, ships: ShipPosition[], indexPlayer: string) {
        this.gameId = gameId
        this.ships = ships
        this.indexPlayer = indexPlayer
    }
}