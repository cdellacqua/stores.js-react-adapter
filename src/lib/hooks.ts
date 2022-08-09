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
		return {value: store.value};
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
 * Subscribe to one or more stores, providing an array of all their values.
 *
 * Example:
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
 * @param stores one or more stores to subscribe to.
 * @returns an array of all the values contained in the stores.
 */
export function useReadonlyStores<T extends [unknown, ...unknown[]]>(
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
	/* 
	const previousContextRef = useRef<
		| {
				derived$: ReadonlyStore<[unknown, ...unknown[]]>;
				stores: typeof stores;
		  }
		| undefined
	>(undefined);

	const previousContext = previousContextRef.current;

	if (
		!previousContext ||
		// Emulating useMemo, but using a deep comparison.
		previousContext.stores.length !== stores.length ||
		previousContext.stores.some((s, i) => s !== stores[i])
	) {
		previousContextRef.current = {
			stores,
			derived$: makeDerivedStore(stores, (x) => x),
		};
	} */

	useEffect(() => {
		if (
			// Emulating useMemo, but using a deep comparison.
			context.stores.length !== stores.length ||
			context.stores.some((s, i) => s !== stores[i])
		) {
			setContext({
				stores,
				derived$: makeDerivedStore(stores, (x) => x),
			});
		}
	}, [stores, context.stores]);

	return useReadonlyStore(context.derived$) as {
		[P in keyof T]: T[P];
	};
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
