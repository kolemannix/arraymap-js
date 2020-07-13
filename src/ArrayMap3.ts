// class ArrayMap3<T, K> extends Array<T> {
//     constructor() {
//         super();
//         return new Proxy(this, {
//             set: (object, key, value, proxy) => {
//                 object[key] = value;
//                 console.log('PROXY SET');
//                 return true;
//             },
//         });
//     }
//
//     public collect<U>(fn: (t: T) => U | undefined, identify: (u: U) => K): ArrayMap3<U, K> {
//         const res: [K, U][] = [];
//         for (const t of this.values()) {
//             const maybeU = fn(t);
//             if (maybeU) res.push([identify(maybeU), maybeU]);
//         }
//         ArrayMap3.from(res)
//         return new ArrayMap3(res.values(), identify);
//     }
// }

