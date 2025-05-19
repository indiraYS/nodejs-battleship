import ShipType from "./ShipType";
import { Position } from "./Position";

export class ShipPosition {
    readonly position: Position;
    readonly direction: boolean;
    readonly length: number;
    readonly type: ShipType

    constructor(pos: Position, dir: boolean, len: number, type: ShipType) {
        this.position = pos;
        this.direction = dir;
        this.length = len;
        this.type = type;
    }
}