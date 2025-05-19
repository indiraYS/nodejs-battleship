import { GameMessage } from "../GameMessage"

export class AttackNotificatios {
    constructor (
        private _personal: GameMessage[]|undefined, 
        private _opponentMessage: [string, GameMessage] | undefined, 
        private _both: [string, string, GameMessage] | undefined,
        private _broadcast: GameMessage[]|undefined,

    ) {}

    public get personal() : GameMessage[]|undefined 
    {
        return this._personal
    }

    public get opponentMessage() : [string, GameMessage] | undefined 
    {
        return this._opponentMessage
    }

    public get both() : [string, string, GameMessage] | undefined 
    {
        return this._both
    }

    public get broadcast() : GameMessage[]|undefined 
    {
        return this._broadcast
    }
}