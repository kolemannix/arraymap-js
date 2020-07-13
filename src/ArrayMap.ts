export type Key = number | string;

export function mapIterator<T, U>(itT: IterableIterator<T>, fn: (t: T) => U): IterableIterator<U> {
    const next: () => IteratorResult<U> = () => {
        const n = itT.next();
        const t: T = n.value;
        if (!n.done) return {done: false, value: fn(t)};
        else return {done: true, value: undefined};
    };
    return {
        next: next,
        [Symbol.iterator]: function () {
            return this;
        }
    };
}

class ArrayMap<T, K extends Key> {
    private ts: [K, T][];
    private indexesByKey: Map<K, number>;
    private keysByIndex: Map<number, K>;

    readonly identify: (t: T) => K;

    /**
     * Requires that `key` is not already present
     */
    private doPush(index: number, key: K, t: T): void {
        this.ts.push([key, t]);
        this.indexesByKey.set(key, index);
        this.keysByIndex.set(index, key);
    }

    private updateIndexOfKey(key: K, index: number): void {
        this.indexesByKey.set(key, index);
        this.keysByIndex.set(index, key);
    }

    private clearIndexOfKey(key: K): void {
        this.indexesByKey.delete(key);
    }

    constructor(entries: IterableIterator<[K, T]>, identify: (t: T) => K) {
        this.ts = []
        this.indexesByKey = new Map();
        this.keysByIndex = new Map();
        let idx = 0;
        for (const [k, t] of entries) {
            if (this.indexOfKey(k) === undefined) {
                this.doPush(idx, k, t);
                idx++;
            }
        }
        this.identify = identify;
    }

    static fromArray<T, K extends Key>(items: T[], identify: (t: T) => K) {
        const entries = items.map(i => [identify(i), i] as [K, T]);
        return new ArrayMap(entries.values(), identify);
    }

    static clone<T, K extends Key>(that: ArrayMap<T, K>): ArrayMap<T, K> {
        return new ArrayMap(that.entries(), that.identify);
    }

    static empty<T, K extends Key>(identify: (t: T) => K): ArrayMap<T, K> {
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

    public keys(): IterableIterator<K> {
        return mapIterator(this.entries(), pair => pair[0]);
    }

    public values(): IterableIterator<T> {
        const iter: IterableIterator<[K, T]> = this.ts.values();
        return mapIterator(iter, pair => pair[1]);
    }

    public entries(): IterableIterator<[K, T]> {
        return this.ts.values();
    }

    public isEmpty(): boolean {
        return this.ts.length === 0;
    }

    public nonEmpty(): boolean {
        return this.ts.length !== 0;
    }

    get length(): number {
        return this.ts.length;
    }

    public size(): number {
        return this.length;
    }

    public indexOfKey(key: K): number | undefined {
        return this.indexesByKey.get(key);
    }

    public indexOf(t: T): number | undefined {
        const key = this.identify(t);
        return this.indexOfKey(key);
    }

    public getAtIndex(index: number): T | undefined {
        const item = this.ts[index];
        if (item === undefined) return undefined;
        else return item[1];
    }

    public removeAtIndex(index: number): boolean {
        const key = this.keysByIndex.get(index);
        if (key) {
            this.remove(key);
            return true;
        } else {
            return false;
        }
    }

    public head(): T | undefined {
        return this.getAtIndex(0);
    }

    // I can't make much sense of how to do a .map that returns an ArrayMap
    // without asking for a new ID function...
    // public map<U>(fn: (value: T, index: number) => U): ArrayMap<T, K> {
    //     const iter = this.ts.values();
    //     let idx = 0;
    //     const mapped = mapIterator(iter, pair => {
    //        const [k, t] = pair;
    //        const u = fn(t, idx);
    //        idx++;
    //        return [k, u];
    //     });
    //     return new ArrayMap(mapped, this.identify);
    // }

    // @TODO: Use Function.length to accept 3rd argument efficiently
    public map<U>(fn: (value: T, index: number) => U): U[] {
        // TODO: Use mapIterator
        return this.ts.map((pair, idx) => fn(pair[1], idx));
    }

    // @TODO: Use Function.length to accept 3rd argument efficiently
    public forEach(fn: (t: T, index: number) => void): void {
        return this.ts.forEach((pair, idx) => fn(pair[1], idx));
    }

    public filter(fn: (t: T, index: number) => boolean): ArrayMap<T, K> {
        const copy = ArrayMap.empty<T, K>(this.identify);
        let idx = 0;
        for (const [k, t] of this.entries()) {
            if (fn(t, idx)) copy.doPush(copy.length, k, t);
            idx += 1;
        }
        return copy;
    }

    public update(key: K, newT: ((t: T) => T) | T): void {
        const index = this.indexOfKey(key);
        let updated;
        if (typeof newT === "function") {
            const f = newT as (t: T) => T;
            const [k, t] = this.ts[index];
            updated = [k, f(t)];
        } else {
            updated = [key, newT];
        }
        this.ts[index] = updated;
    }

    public put(t: T): void {
        const key = this.identify(t);
        const exists = this.contains(key);
        if (exists) {
            this.update(key, t);
        } else {
            this.push(t);
        }
    }

    /**
     * Inserts at end, even for existing values
     */
    public push(...items: T[]): void {
        let n = this.length;
        for (const t of items) {
            const key = this.identify(t);
            if (this.indexOfKey(key) === undefined) {
                this.doPush(n, key, t);
                n++;
            }
        }
    }

    public contains(key: K): boolean {
        return this.indexesByKey.has(key);
    }

    public get(key: K): T | undefined {
        const idx = this.indexesByKey.get(key);
        if (idx) return this.getAtIndex(idx);
        else return undefined;
    }

    public remove(key: K): boolean {
        const start = this.indexOfKey(key);
        if (start) {
            this.ts.splice(start, 1);
            this.clearIndexOfKey(key);
            let n = start;
            while (n < this.length) {
                let [k, _t] = this.ts[n];
                this.updateIndexOfKey(k, n);
                n++;
            }
            return true;
        } else {
            return false;
        }
    }

    public sortByKey(): ArrayMap<T, K> {
        const arr = Array.from(this.ts.values());
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

    public slice(start?: number, end?: number): ArrayMap<T, K> {
        const arr = Array.from(this.entries()).slice(start, end);
        return new ArrayMap(arr.values(), this.identify);
    }

    public splice(start: number, deleteCount: number, ...items: T[]): ArrayMap<T, K> {
        const toInsert: [K, T][] = items.map(i => [this.identify(i), i]);
        const newTs = [...this.ts];
        newTs.splice(start, deleteCount, ...toInsert);
        return new ArrayMap(newTs.values(), this.identify);
    }

    /**
     * In the event of a duplicate key, the provided argument elements get priority
     */
    public prepend(...items: T[]): ArrayMap<T, K> {
        const newItems: [K, T][] = [];
        for (const t of items) {
            newItems.push([this.identify(t), t]);
        }
        return new ArrayMap([...newItems, ...Array.from(this.entries())].values(), this.identify);
    }
}

export default ArrayMap;