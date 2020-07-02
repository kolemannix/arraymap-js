# What

A thin wrapper around ES6 "Map" that provides both array-like and map-like methods and functions.

# Why

My JavaScript and TypeScript work is all frontend work, specifically single page apps with React.
When working on such applications, almost all the data I work with has an "id" field of some kind.
This is usually a `string`, `number`, or `uuid`, which I just model as a `string` in TS.

I find myself needing to update or remove elements by ID, but also needing array-like operations 
such as `map` and `filter` (plus some other operations that I miss from other languages!). Sometimes
I use a `Map`, but then I can't access elements by index or `push` something to the end, so most often
I'm just using `Array`, which of course does not know that my elements all have unique IDs.

Enter `ArrayMap`, which does both. In addition to the usual suspects of `set`, `get`, `push`, `map`, and `filter`, it
provides some additional operations such as `collect`, `groupBy`, `sortByKey`, et. al.

I find this to be a highly *convenient* solution that makes state management much easier when building my applications

# Performance

It should be noted that, since the use-case here is frontend applications, the optimal use case for `ArrayMap` is
probably when you have less than ~10,000 elements. Any more than that and you'll want to be careful with 
certain operations that copy and iterate liberally. Don't use it to build your JS games... actually don't use JS to build games.

Estimated Time complexity and space complexity properties can be found on each method.

# The Basics

`ArrayMap` works with any type `T`, but it needs to know how to get the ID of that type. It does this
with the provided `identify` function which takes a `T` and returns its ID. For example, if we had a user
named Alex and a `User` model type:
```ts
interface User {
  id: number;
  name: string;
  email: string;
}
const alex = { id: 1, name: "Alex", email: "alex@example.com" };
```
We could add Alex to our `users` collection like so:
```ts
import ArrayMap from "arraymap-js"; 
const users = ArrayMap.empty(user => user.id);
users.push(alex);
//or
const users = ArrayMap.fromArray([alex], user => user.id);
```
