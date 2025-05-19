import { ShipAttack } from "../../internal/ShipAttack"
import { ShipPosition } from "./ShipPosition"

export class StartGame {
    readonly ships: ShipPosition[]
    readonly currentPlayerIndex: string
    
    constructor (index: string, ships: ShipAttack[]) {
        this.currentPlayerIndex = index
        const pos : ShipPosition[] = []
        ships.forEach(i => {
            pos.push(i.position)
        })
        this.ships = pos
    }
}