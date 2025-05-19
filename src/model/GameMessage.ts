import MessageType from "./MessageType";
export class GameMessage {
    readonly data: string;
    readonly type: MessageType;
    readonly id: number;

    constructor(type: MessageType, data: string, id: number) {
        this.data = data;
        this.type = type;
        this.id = 0;
    }

    public static make(type: MessageType, data: any): GameMessage{
        return new GameMessage(type, JSON.stringify(data), 0)
    }
}