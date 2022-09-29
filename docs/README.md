@universal-stores/react-adapter

# @universal-stores/react-adapter

## Table of contents

### Type Aliases

- [WithReadonlyStoreProps](README.md#withreadonlystoreprops)
- [WithReadonlyStoresProps](README.md#withreadonlystoresprops)
- [WithStoreProps](README.md#withstoreprops)

### Functions

- [WithReadonlyStore](README.md#withreadonlystore)
- [WithReadonlyStores](README.md#withreadonlystores)
- [WithStore](README.md#withstore)
- [useReadonlyStore](README.md#usereadonlystore)
- [useReadonlyStores](README.md#usereadonlystores)
- [useStore](README.md#usestore)

## Type Aliases

### WithReadonlyStoreProps

Ƭ **WithReadonlyStoreProps**<`T`\>: `Object`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `children` | (`value`: `T`) => `React.ReactNode` |
| `store` | `ReadonlyStore`<`T`\> |

#### Defined in

[components.tsx:49](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L49)

___

### WithReadonlyStoresProps

Ƭ **WithReadonlyStoresProps**<`T`\>: `Object`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `children` | (`values`: { [P in keyof T]: T[P] }) => `React.ReactNode` |
| `stores` | { [P in keyof T]: ReadonlyStore<T[P]\> } |

#### Defined in

[components.tsx:81](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L81)

___

### WithStoreProps

Ƭ **WithStoreProps**<`T`\>: `Object`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `children` | (`value`: `T`, `setValue`: (`newValueOrUpdater`: `T` \| `Updater`<`T`\>) => `void`) => `React.ReactNode` |
| `store` | `Store`<`T`\> |

#### Defined in

[components.tsx:5](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L5)

## Functions

### WithReadonlyStore

▸ **WithReadonlyStore**<`T`\>(`__namedParameters`): `React.ReactElement`

Subscribe to a Store or ReadonlyStore and pass its value
to the children of this component.
```tsx
const count$ = makeStore(0);

function Counter() {
	return (
		<WithReadonlyStore store={count$}>
			{(count) => <h1>{count}</h1>}
		</WithReadonlyStore>
	);
}
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`WithReadonlyStoreProps`](README.md#withreadonlystoreprops)<`T`\> |

#### Returns

`React.ReactElement`

#### Defined in

[components.tsx:73](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L73)

___

### WithReadonlyStores

▸ **WithReadonlyStores**<`T`\>(`__namedParameters`): `React.ReactElement`

Subscribe to a collection of Store/ReadonlyStore and pass their values
to the children of this component.

Example:

```tsx
const firstNumber$ = makeStore(4);
const secondNumber$ = makeStore(2);

function Sum() {
	return (
		<WithReadonlyStores stores={[firstNumber$, secondNumber$]}>
			{([firstNumber, secondNumber]) => <h1>{firstNumber + secondNumber}</h1>}
		</WithReadonlyStores>
	);
}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown`[] \| [`unknown`, ...unknown[]] |

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`WithReadonlyStoresProps`](README.md#withreadonlystoresprops)<`T`\> |

#### Returns

`React.ReactElement`

#### Defined in

[components.tsx:113](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L113)

▸ **WithReadonlyStores**<`T`\>(`__namedParameters`): `React.ReactElement`

Subscribe to a a collection of Store/ReadonlyStore and pass their values
to the children of this component.

Example:

```tsx
const firstNumber$ = makeStore(4);
const secondNumber$ = makeStore(2);

function Sum() {
	return (
		<WithReadonlyStores stores={{first: firstNumber$, second: secondNumber$}}>
			{({first, second}) => <h1>{first + second}</h1>}
		</WithReadonlyStores>
	);
}
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`WithReadonlyStoresProps`](README.md#withreadonlystoresprops)<`T`\> |

#### Returns

`React.ReactElement`

#### Defined in

[components.tsx:140](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L140)

___

### WithStore

▸ **WithStore**<`T`\>(`__namedParameters`): `React.ReactElement`

Subscribe to a Store and pass its value and setter function
to the children of this component.

Example
```tsx
const count$ = makeStore(0);

function Counter() {
	return (
		<WithStore store={count$}>
			{(count, setCount) => (
				<>
					<h1>Counter: {count}</h1>
					<button onClick={() => setCount((c) => c + 1)}>Increment</button>
					<button onClick={() => setCount(0)}>Reset</button>
					<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
				</>
			)}
		</WithStore>
	);
}
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`WithStoreProps`](README.md#withstoreprops)<`T`\> |

#### Returns

`React.ReactElement`

#### Defined in

[components.tsx:41](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/components.tsx#L41)

___

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

[hooks.ts:54](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/hooks.ts#L54)

___

### useReadonlyStores

▸ **useReadonlyStores**<`T`\>(`stores`): { [P in keyof T]: T[P] }

Subscribe to multiple stores, providing an array containing all their values.

Example:

```tsx
const firstNumber$ = makeStore(4);
const secondNumber$ = makeStore(2);

function Sum() {
	const [firstNumber, secondNumber] = useReadonlyStores([firstNumber$, secondNumber$]);
	return (
		<>
			<h1>{firstNumber + secondNumber}</h1>
		</>
	);
}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown`[] \| [`unknown`, ...unknown[]] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `stores` | { [P in string \| number \| symbol]: ReadonlyStore<T[P]\> } | an array of stores to subscribe to. |

#### Returns

{ [P in keyof T]: T[P] }

an array of all the values contained in the stores.

#### Defined in

[hooks.ts:90](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/hooks.ts#L90)

▸ **useReadonlyStores**<`T`\>(`stores`): { [P in keyof T]: T[P] }

Subscribe to multiple stores, providing an object containing all their values.

Example:

```ts
const firstNumber$ = makeStore(4);
const secondNumber$ = makeStore(2);

function Sum() {
	const {first, second} = useReadonlyStores({
		first: firstNumber$,
		second: secondNumber$,
	});
	return (
		<>
			<h1>{first + second}</h1>
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
| `stores` | { [P in string \| number \| symbol]: ReadonlyStore<T[P]\> } | an object or an array of stores to subscribe to. |

#### Returns

{ [P in keyof T]: T[P] }

an object of all the values contained in the stores.

#### Defined in

[hooks.ts:126](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/hooks.ts#L126)

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

[hooks.ts:199](https://github.com/cdellacqua/stores.js-react-adapter/blob/main/src/lib/hooks.ts#L199)
