import React from 'react';
import {ReadonlyStore, Store, Updater} from 'universal-stores';
import {useReadonlyStore, useReadonlyStores, useStore} from './hooks';

export type WithStoreProps<T> = {
	store: Store<T>;
	children: (
		value: T,
		setValue: (newValueOrUpdater: T | Updater<T>) => void,
	) => React.ReactNode;
};

/**
 * Subscribe to a Store and pass its value and setter function
 * to the children of this component.
 *
 * Example
 * ```tsx
 * const count$ = makeStore(0);
 *
 * function Counter() {
 * 	return (
 * 		<WithStore store={count$}>
 * 			{(count, setCount) => (
 * 				<>
 * 					<h1>Counter: {count}</h1>
 * 					<button onClick={() => setCount((c) => c + 1)}>Increment</button>
 * 					<button onClick={() => setCount(0)}>Reset</button>
 * 					<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
 * 				</>
 * 			)}
 * 		</WithStore>
 * 	);
 * }
 * ```
 *
 * @param props.store a store to subscribe to.
 * @param props.children a render prop that takes the store value and its setter as parameters.
 * @returns {React.ReactElement}
 */
export function WithStore<T>({
	store,
	children,
}: WithStoreProps<T>): React.ReactElement {
	const [value, setValue] = useStore(store);
	return <>{children(value, setValue)}</>;
}

export type WithReadonlyStoreProps<T> = {
	store: ReadonlyStore<T>;
	children: (value: T) => React.ReactNode;
};

/**
 * Subscribe to a Store or ReadonlyStore and pass its value
 * to the children of this component.
 * ```tsx
 * const count$ = makeStore(0);
 *
 * function Counter() {
 * 	return (
 * 		<WithReadonlyStore store={count$}>
 * 			{(count) => <h1>{count}</h1>}
 * 		</WithReadonlyStore>
 * 	);
 * }
 * ```
 *
 * @param props.store a store to subscribe to.
 * @param props.children a render prop that takes the store value as its parameter.
 * @returns {React.ReactElement}
 */
export function WithReadonlyStore<T>({
	store,
	children,
}: WithReadonlyStoreProps<T>): React.ReactElement {
	const value = useReadonlyStore(store);
	return <>{children(value)}</>;
}

export type WithReadonlyStoresProps<T> = {
	stores: {
		[P in keyof T]: ReadonlyStore<T[P]>;
	};
	children: (values: {
		[P in keyof T]: T[P];
	}) => React.ReactNode;
};

/**
 * Subscribe to a a collection of Store/ReadonlyStore and pass their values
 * to the children of this component.
 *
 * Example using an object:
 *
 * ```tsx
 * const firstNumber$ = makeStore(4);
 * const secondNumber$ = makeStore(2);
 *
 * function Sum() {
 * 	return (
 * 		<WithReadonlyStores stores={{first: firstNumber$, second: secondNumber$}}>
 * 			{({first, second}) => <h1>{first + second}</h1>}
 * 		</WithReadonlyStores>
 * 	);
 * }
 * ```
 *
 * Example using an array:
 *
 * ```tsx
 * const firstNumber$ = makeStore(4);
 * const secondNumber$ = makeStore(2);
 *
 * function Sum() {
 * 	return (
 * 		<WithReadonlyStores stores={[firstNumber$, secondNumber$]}>
 * 			{([firstNumber, secondNumber]) => <h1>{firstNumber + secondNumber}</h1>}
 * 		</WithReadonlyStores>
 * 	);
 * }
 * ```
 *
 * @param props.stores a collection of Store and/or ReadonlyStore.
 * @param props.children a render prop that takes an object or an array of all the values contained in the stores as its parameter.
 * @returns {React.ReactElement}
 */
export function WithReadonlyStores<T>({
	stores,
	children,
}: WithReadonlyStoresProps<T>): React.ReactElement {
	const values = useReadonlyStores<T>(stores);
	return <>{children(values)}</>;
}
