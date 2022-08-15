import {useCallback, useEffect, useState} from 'react';
import {
	makeDerivedStore,
	ReadonlyStore,
	Store,
	Updater,
} from 'universal-stores';

/**
 * Subscribe to a store, getting its most up-to-date value.
 *
 * Example:
 *
 * ```tsx
 * const count$ = makeStore(0);
 *
 * function Counter() {
 * 	const count = useReadonlyStore(count$);
 * 	return (
 * 		<>
 * 			<h1>{count}</h1>
 * 		</>
 * 	);
 * }
 * ```
 *
 * Example with a ReadonlyStore:
 *
 * ```tsx
 * // A lazy loaded readonly store that increments its value every second.
 * const autoCount$ = makeReadonlyStore<number>(undefined, (set) => {
 * 	let count = 0;
 * 	set(count);
 * 	const intervalId = setInterval(() => {
 * 		count++;
 * 		set(count);
 * 	}, 1000);
 * 	return () => clearInterval(intervalId);
 * });
 *
 * function Counter() {
 * 	const count = useReadonlyStore(autoCount$);
 * 	return (
 * 		<>
 * 			<h1>{count}</h1>
 * 		</>
 * 	);
 * }
 * ```
 *
 * @param store a store (ReadonlyStore<T> or Store<T>) to subscribe to.
 * @returns the up-to-date value of the store.
 */
export function useReadonlyStore<T>(store: ReadonlyStore<T>): T {
	const [context, setContext] = useState(() => {
		return {value: store.content()};
	});

	useEffect(() => {
		const unsubscribe = store.subscribe((value) => {
			setContext({value});
		});
		return unsubscribe;
	}, [store]);

	return context.value;
}

/**
 * Subscribe to multiple stores, providing an object or an array of all their values.
 *
 * Example using an object:
 *
 * ```ts
 * const firstNumber$ = makeStore(4);
 * const secondNumber$ = makeStore(2);
 *
 * function Sum() {
 * 	const {first, second} = useReadonlyStores({
 * 		first: firstNumber$,
 * 		second: secondNumber$,
 * 	});
 * 	return (
 * 		<>
 * 			<h1>{first + second}</h1>
 * 		</>
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
 * 	const [firstNumber, secondNumber] = useReadonlyStores([firstNumber$, secondNumber$]);
 * 	return (
 * 		<>
 * 			<h1>{firstNumber + secondNumber}</h1>
 * 		</>
 * 	);
 * }
 * ```
 *
 * @param stores an object or an array of stores to subscribe to.
 * @returns an object or an array of all the values contained in the stores, depending on the type of the argument.
 */
export function useReadonlyStores<T>(
	stores:
		| {
				[P in keyof T]: ReadonlyStore<T[P]>;
		  },
): {
	[P in keyof T]: T[P];
} {
	const [context, setContext] = useState(() => ({
		derived$: makeDerivedStore(stores, (x) => x),
		stores,
	}));

	useEffect(() => {
		const currentEntries = Object.entries<ReadonlyStore<unknown>>(
			context.stores,
		);
		const newEntries = Object.entries<ReadonlyStore<unknown>>(stores);
		if (
			// Emulating useMemo, but using a deep comparison.
			currentEntries.length !== newEntries.length ||
			currentEntries.some((s) => s[1] !== stores[s[0] as keyof T])
		) {
			setContext({
				stores,
				derived$: makeDerivedStore(stores, (x) => x),
			});
		}
	}, [stores, context.stores]);

	return useReadonlyStore(context.derived$);
}

/**
 * Subscribe to a store, providing the most up-to-date value it contains
 * and a setter function.
 *
 * Example:
 * ```tsx
 * const count$ = makeStore(0);
 *
 * function Counter() {
 * 	const [count, setCount] = useStore(count$);
 * 	return (
 * 		<>
 * 			<h1>{count}</h1>
 * 			<button onClick={() => setCount((c) => c + 1)}>Increment</button>
 * 			<button onClick={() => setCount(0)}>Reset</button>
 * 			<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
 * 		</>
 * 	);
 * }
 * ```
 *
 * @param store a store to subscribe to.
 * @returns a tuple containing the current value and a setter.
 */
export function useStore<T>(
	store: Store<T>,
): [T, (newValueOrUpdater: T | Updater<T>) => void] {
	const value = useReadonlyStore(store);
	const setter = useCallback(
		(newValueOrUpdater: T | Updater<T>) => {
			if (typeof newValueOrUpdater === 'function') {
				store.update(newValueOrUpdater as Updater<T>);
			} else {
				store.set(newValueOrUpdater as T);
			}
		},
		[store],
	);
	return [value, setter];
}
