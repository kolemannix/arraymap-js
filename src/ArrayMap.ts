export type Prim = number | string;

class ArrayMap<T, K extends Prim> {
    private tsMap: Map<K, T>;

    // @Todo: Maintain these two indices for faster indexOf and getAtIndex
    // private indexesByKey: Map<K, number>;
    // private keysByIndex: K[];

    readonly identify: (t: T) => K;

    constructor(entries: IterableIterator<[K, T]>, identify: (t: T) => K) {
        this.tsMap = new Map();
        // this.indexesByKey = new Map();
        // this.keysByIndex = [];
        this.identify = identify;

        let idx = 0;
        for (const [k, t] of entries) {
            this.tsMap.set(k, t)
            idx++;
        }
    }

    static fromArray<T, K extends Prim>(items: T[], identify: (t: T) => K) {
        const entries = items.map(i => [identify(i), i] as [K, T]);
        return new ArrayMap(entries.values(), identify);
    }

    static clone<T, K extends Prim>(that: ArrayMap<T, K>): ArrayMap<T, K> {
        return new ArrayMap(that.entries(), that.identify);
    }

    static empty<T, K extends Prim>(identify: (t: T) => K): ArrayMap<T, K> {
        return ArrayMap.fromArray([], identify);
    }

    public clone(): ArrayMap<T, K> {
        return ArrayMap.clone(this);
    }

    public [Symbol.iterator](): IterableIterator<T> {
        return this.values();
    }

    public array(): T[] {
        return Array.from(this);
    }

    values(): IterableIterator<T> {
        return this.tsMap.values();
    }

    entries(): IterableIterator<[K, T]> {
        return this.tsMap.entries();
    }

    public empty(): boolean {
        return this.values().next().done || false;
    }

    public nonEmpty(): boolean {
        return !this.empty();
    }

    get length(): number {
        return this.tsMap.size;
    }

    public size(): number {
        return this.length;
    }

    /**
     * @Slow linear
     */
    public indexOfKey(key: K, fromIndex?: number): number {
        let idx = fromIndex || 0;
        for (const k of this.tsMap.keys()) {
            if (k === key) return idx;
            idx++;
        }
        return -1;
    }

    /**
     * @Slow linear
     */
    public indexOf(t: T, fromIndex?: number): number {
        const key = this.identify(t);
        return this.indexOfKey(key, fromIndex);
    }

    /**
     * @Slow linear
     */
    public getAtIndex(index: number): T | undefined {
        let idx = 0;
        for (const t of this) {
            if (idx === index) return t;
            idx++;
        }
        return undefined;
    }

    public head(): T | undefined {
        return this.tsMap.values().next().value;
    }

    // TODO: Use Function.length to accept 3rd argument efficiently
    public map<U>(fn: (value: T, index: number) => U): U[] {
        const entries = this.tsMap.entries();
        const res = [];
        let idx = 0;
        for (const t of entries) {
            res.push(fn(t[1], idx));
            idx += 1;
        }
        return res;
    }

    // TODO: Use Function.length to accept 3rd argument efficiently
    public forEach(fn: (t: T, index: number) => void): void {
        const entries = this.tsMap.entries();
        let idx = 0;
        for (const t of entries) {
            fn(t[1], idx);
            idx += 1;
        }
    }

    public filter(fn: (t: T, index: number) => boolean): ArrayMap<T, K> {
        const entries = this.tsMap.entries();
        const res: [K, T][] = [];
        let idx = 0;
        for (const t of entries) {
            if (fn(t[1], idx)) res.push(t);
            idx += 1;
        }
        return new ArrayMap<T, K>(res.values(), this.identify);
    }

    public update(key: K, newT: ((t: T) => T) | T): ArrayMap<T, K> {
        const existing = this.tsMap.get(key);
        if (existing) {
            if (typeof newT === "function") {
                const f = newT as (t: T) => T;
                this.tsMap.set(key, f(existing));
            } else {
                this.tsMap.set(key, newT);
            }
        }
        return this;
    }

    /**
     * Inserts at end for new key, updates in place for existing key
     */
    public put(t: T): ArrayMap<T, K> {
        const key = this.identify(t);
        this.tsMap.set(key, t);
        return this;
    }

    /**
     * Inserts at end, even for existing values
     */
    public push(t: T): ArrayMap<T, K> {
        const key = this.identify(t);
        this.tsMap.delete(key);
        this.tsMap.set(key, t);
        return this;
    }

    public contains(key: K): boolean {
        return this.tsMap.has(key);
    }

    public get(key: K): T | undefined {
        return this.tsMap.get(key);
    }

    public remove(key: K): boolean {
        return this.tsMap.delete(key);
    }

    public sortByKey(): ArrayMap<T, K> {
        const arr = Array.from(this.tsMap.entries());
        arr.sort((a, b) => {
            const aKey = a[0];
            if (typeof aKey === "string") {
                // String
                return aKey.localeCompare(b[0] as string);
            } else {
                // Number
                return (aKey as number) - (b[0] as number);
            }
        });
        return new ArrayMap(arr.values(), this.identify);
    }

    /**
     * Note: Key type cannot change. for that, make a new collection
     */
    public collect<U>(fn: (t: T) => U | undefined, identify: (u: U) => K): ArrayMap<U, K> {
        const res: [K, U][] = [];
        for (const t of this.values()) {
            const maybeU = fn(t);
            if (maybeU) res.push([identify(maybeU), maybeU]);
        }
        return new ArrayMap(res.values(), identify);
    }

    public collectArray<U>(fn: (t: T) => U | undefined): U[] {
        const res: U[] = [];
        for (const t of this.values()) {
            const maybeU = fn(t);
            if (maybeU) res.push(maybeU);
        }
        return res;
    }

    public fold<A>(initial: A, step: (a: A, t: T) => A): A {
        let acc: A = initial;
        for (const t of this) {
            acc = step(acc, t);
        }
        return acc;
    }

    public reduce(step: (t1: T, t2: T) => T, initial?: T): T {
        const xs = this.array();
        if (!initial && xs.length === 0) {
            throw "reduce of empty collection with no initial value provided";
        }
        let acc = initial ? step(initial, xs[0]) : xs[0];
        let i = 1;
        while (i < xs.length) {
            acc = step(acc, xs[i]);
            i++;
        }
        return acc;
    }

    public groupBy<K2>(fn: (t: T) => K2): Map<K2, T[]> {
        const map = new Map<K2, T[]>();
        for (const t of this) {
            const key = fn(t);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [t]);
            } else {
                collection.push(t);
            }
        }
        return map;
    }

    /**
     * @Slow I think we should manually slice the iterator and do a bit better
     */
    public slice(start?: number, end?: number): ArrayMap<T, K> {
        // TODO: Better performance from a direct impl?
        const arr = Array.from(this.entries()).slice(start, end);
        return new ArrayMap(arr.values(), this.identify);
    }

    /**
     * @Slow Just goes to array and back.
     */
    public splice(start: number, deleteCount: number, ...items: T[]): ArrayMap<T, K> {
        const ts = Array.from(this.entries());
        const idItems: [K, T][] = items.map(i => [this.identify(i), i]);
        ts.splice(start, deleteCount, ...idItems);
        return new ArrayMap(ts.values(), this.identify);
    }

    /**
     * In the event of a duplicate key, the provided argument elements get priority
     */
    public unshift(...items: T[]): ArrayMap<T, K> {
        const shifted: Map<K, T> = new Map();
        for (const t of items) {
            shifted.set(this.identify(t), t);
        }
        for (const [k, v] of this.entries()) {
            shifted.set(k, v);
        }
        return new ArrayMap(shifted.entries(), this.identify);
    }
}

export default ArrayMap;