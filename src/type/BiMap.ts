export class BiMap<K, V> {
    private map: Map<K, V>
    private reversed: Map<V, K>

    constructor () {
        this.map = new Map<K, V>();
        this.reversed = new Map<V, K>();
    }

    public get(key: K) : V|undefined {
        return this.map.get(key)
    }

    public getReversed(key: V) : K|undefined {
        return this.reversed.get(key)
    }

    public add(key: K, val: V) {
        this.map.set(key, val)
        this.reversed.set(val, key)
    }
    public remove(key: K) {
        const val = this.map.get(key)
        if (val !== undefined) {
            this.map.delete(key)
            this.reversed.delete(val)
        }
    }
}