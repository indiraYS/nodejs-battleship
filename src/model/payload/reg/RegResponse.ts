export class RegResponse{
    readonly name: string|undefined;
    readonly index: string|undefined;
    readonly error: boolean;
    readonly errorText: string|undefined;

    constructor (name: string|undefined, index:string|undefined, error: boolean = false, errorText: string|undefined = undefined) {
        this.name = name;
        this.index = index;
        this.error = error;
        this.errorText = errorText;
    }
}