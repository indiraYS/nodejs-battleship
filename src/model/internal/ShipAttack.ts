import { ShipPosition } from "../payload/game/ShipPosition";
import { Position } from "../payload/game/Position";

export class ShipAttack {
    constructor(private _postion: ShipPosition, private _attack: Position[] = []) {}

    public isDestroyed() {
        return this._attack.length == this._postion.length
    }

    public get position() {
        return this._postion;
    }

    public get attack() {
        return this._attack;
    }

    public tryAttack(pos: Position): number {
        let res: number = 0;
        //console.log(`attack [x=${pos.x}, y=${pos.y}], x=${this._postion.position.x}, y=${this._postion.position.y}, dir: ${this._postion.direction}, len: ${this._postion.length}`)
        if (this._postion.direction)  // vertical
        {
            if (this._postion.position.x == pos.x) {
                if (this._postion.position.y <= pos.y && this._postion.position.y + (this._postion.length-1) >= pos.y) {
                    //console.log('bbbb')
                    if (this._attack.indexOf(pos) == -1) {
                        this._attack.push(pos)
                        res = 1;
                    }
                }
            }
        }
        else // horizontal
        {
            if (this._postion.position.y == pos.y) {
                if (this._postion.position.x <= pos.x && this._postion.position.x + (this._postion.length-1) >= pos.x) {
                    if (this._attack.indexOf(pos) == -1) {
                        this._attack.push(pos)
                        res = 1;
                    }
                }
            }
        }
        if (res == 1 && this._attack.length == this._postion.length) {
            res = 2; // fully destroyed
        }
        return res;
    }
}