export class AddUserToRoomResult {
    constructor(private _success: boolean, private _firsId: string, private _secondId: string) {}
    
    public get success() {
        return this._success;
    }
    public get first() {
        return this._firsId;
    }
     public get second() {
        return this._secondId;
    }
}