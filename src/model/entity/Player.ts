export class Player {
    constructor (private _id: string, private _name: string) {}

    public get id() {
        return this._id;
    }

    public get name() {
        return this._name;
    }
}