import { Position } from "../payload/game/Position";
import { ShipPosition } from "../payload/game/ShipPosition";
import ShipType from "../payload/game/ShipType";
import { randomInt } from "node:crypto";
import AttackStatus from "../payload/attack/AttackStatus";


export class Bot {
    public lastsuccess: Position[] = []
    public visited: Position[] = []

    public isVisited (p: Position) {
        let visited = false;

        for (const pp of this.visited) {
            if (p.x == pp.x && p.y == pp.y) {
                visited = true
                break
            }
        }
        return visited
    }
 
    public generate(): ShipPosition[] {
        const res: ShipPosition[] = []
        const required: Map<number, number> = new Map<number, number>()
        required.set(4, 1);
        required.set(3, 2);
        required.set(2, 3);
        required.set(1, 4);
        let left: number | undefined;
        let max = 4;


        while (required.size > 0) {
            left = required.get(max)

            if (left == undefined) {
                throw new Error('unexpected case, bot generate ships')
            }

            let pos = new Position(randomInt(0, 9), randomInt(0, 9))

            const dir = randomInt(0, 1) == 1 ? true : false;
            const type = this.getType(max);
            let ship = new ShipPosition(pos, dir, max, type)

            while (this.intersect(ship, res)) {
                pos = new Position(randomInt(0, 9), randomInt(0, 9))
                ship = new ShipPosition(pos, dir, max, type)
            }

            res.push(ship)

            if (left == 1) {
                required.delete(max)
                max-- // from big to small
            } else {
                required.set(max, left - 1)
            }
        }
        console.log("bot generated ship positions")
        return res;
    }

    public dirs(x: number, y: number): Position[] {
        const res: Position[] = []

        res.push(new Position(x + 1, y))
        res.push(new Position(x, y + 1))
        res.push(new Position(x, y - 1))
        res.push(new Position(x - 1, y))
        return res;
    }

    private intersect(pos: ShipPosition, existing: ShipPosition[]): Boolean {
        let res = false;
        const [cur_x1, cur_y1, cur_x2, cur_y2] = this.getRectangle(pos)
        for (const cur of existing) {
            let [x1, y1, x2, y2] = this.getRectangle(cur)

            // left bottom
            if (cur_x1 > x1 && cur_x1 < x2 && cur_y1 > y1 && cur_y1 < y2) {
                res = true
                break;
            }

            // right up
            if (cur_x2 > x1 && cur_x2 < x2 && cur_y2 > y1 && cur_y2 < y2) {
                res = true
                break;
            }

            // right bottom
            if (cur_x2 > x1 && cur_x2 < x2 && cur_y1 > y1 && cur_y1 < y2) {
                res = true
                break;
            }

            // left up
            if (cur_x1 > x1 && cur_x1 < x2 && cur_y2 > y2 && cur_y2 < y2) {
                res = true
                break;
            }
        }
        return res
    }

    private getRectangle(pos: ShipPosition): [number, number, number, number] {
        let x1, x2, y1, y2: number
        if (pos.direction) // vertical
        {
            x1 = pos.position.x - 1
            y1 = pos.position.y - 1

            x2 = pos.position.x + 1
            y2 = pos.position.y + pos.length
        }
        else // horizontal
        {
            x1 = pos.position.x - 1
            y1 = pos.position.y - 1

            x2 = pos.position.x + pos.length
            y2 = pos.position.y + 1
        }
        return [x1, y1, x2, y2]
    }

    private getType(num: number): ShipType {
        let res = ShipType.HUGE;
        switch (num) {
            case 4:
                res = ShipType.HUGE;
                break;
            case 3:
                res = ShipType.LARGE;
                break;
            case 2:
                res = ShipType.MEDIUM;
                break
            case 1:
                res = ShipType.SMALL
                break
            default:
                throw new Error(`undefined type ${num}`)
        }
        return res;
    }
}