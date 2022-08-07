@universal-stores/react-adapter

# @universal-stores/react-adapter

## Table of contents

### Functions

- [useReadonlyStore](README.md#usereadonlystore)
- [useStore](README.md#usestore)

## Functions

### useReadonlyStore

▸ **useReadonlyStore**<`T`\>(`store`): `T`

Subscribe to a store, getting its most up-to-date value.

Example:

```tsx
const count$ = makeStore(0);

function Counter() {
	const count = useReadonlyStore(count$);
	return (
		<>
			<h1>{count}</h1>
		</>
	);
}
```

Example with a ReadonlyStore:

```tsx
// A lazy loaded readonly store that increments its value every second.
const autoCount$ = makeReadonlyStore<number>(undefined, (set) => {
	let count = 0;
	set(count);
	const intervalId = setInterval(() => {
		count++;
		set(count);
	}, 1000);
	return () => clearInterval(intervalId);
});

function Counter() {
	const count = useReadonlyStore(autoCount$);
	return (
		<>
			<h1>{count}</h1>
		</>
	);
}
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `store` | `ReadonlyStore`<`T`\> | a store (ReadonlyStore<T> or Store<T>) to subscribe to. |

#### Returns

`T`

the up-to-date value of the store.

#### Defined in

[hooks.ts:49](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/hooks.ts#L49)

___

### useStore

▸ **useStore**<`T`\>(`store`): [`T`, (`newValueOrUpdater`: `T` \| `Updater`<`T`\>) => `void`]

Subscribe to a store, providing the most up-to-date value it contains
and a setter function.

Example:
```tsx
const count$ = makeStore(0);

function Counter() {
	const [count, setCount] = useStore(count$);
	return (
		<>
			<h1>{count}</h1>
			<button onClick={() => setCount((c) => c + 1)}>Increment</button>
			<button onClick={() => setCount(0)}>Reset</button>
			<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
		</>
	);
}
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `store` | `Store`<`T`\> | a store to subscribe to. |

#### Returns

[`T`, (`newValueOrUpdater`: `T` \| `Updater`<`T`\>) => `void`]

a tuple containing the current value and a setter.

#### Defined in

[hooks.ts:127](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/hooks.ts#L127)
