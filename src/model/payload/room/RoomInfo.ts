import { Player } from "../../entity/Player"
import { RoomUser } from "./RoomUser"
export class RoomInfo {
    readonly roomId: string
    readonly roomUsers: Array<RoomUser>

    constructor(roomId: string, firstPlayer: Player, secondPlayer: Player|undefined) {
        this.roomId = roomId
        const arr : Array<RoomUser> = []
        arr.push(new RoomUser(firstPlayer.id, firstPlayer.name))
        if (secondPlayer!=undefined) arr.push(new RoomUser(secondPlayer.id, secondPlayer.name))
        this.roomUsers = arr
    }
}