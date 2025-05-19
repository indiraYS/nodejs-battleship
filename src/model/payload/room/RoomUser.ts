export class RoomUser {
    readonly name: string
    readonly index: string
    constructor (index: string, name: string) {
        this.index = index
        this.name = name
    }
}