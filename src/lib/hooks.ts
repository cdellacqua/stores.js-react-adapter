import {useCallback, useEffect, useRef, useState} from 'react';
import {
	makeDerivedStore,
	ReadonlyStore,
	Store,
	Unsubscribe,
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
	// This state is used to let React know when it should schedule a re-render of the component
	// that's using this hook.
	// The reason we are not storing the store value directly via useState is
	// that useState has a deduplication mechanism based on the the strict
	// equality operator (===), while stores support a custom equality comparator
	// function.
	const [, setRerenderFlag] = useState(0);
	// We store the important information in a Ref, so that it persists until the
	// component gets unmounted.
	const contextRef = useRef<
		| {
				unsubscribe: Unsubscribe;
				wrappedValue: {value: T};
				store: ReadonlyStore<T>;
		  }
		| undefined
	>(undefined);

	// If it's the first time this hook is being executed
	// OR
	// the store passed to this hook has changed.
	if (!contextRef.current || contextRef.current.store !== store) {
		contextRef.current?.unsubscribe();
		const wrappedValue = {value: undefined as unknown as T};
		// This flag prevents a useless re-render.
		let firstSubscriberCall = true;
		contextRef.current = {
			store,
			wrappedValue,
			unsubscribe: store.subscribe((v) => {
				// Accessing the value using the wrapper.
				wrappedValue.value = v;

				if (firstSubscriberCall) {
					firstSubscriberCall = false;
					return;
				}
				// If we get here, we need to notify React that the component
				// state has changed and it should therefore re-render it
				// to keep it in sync with the UI.
				setRerenderFlag((r) => (r + 1) % Number.MAX_SAFE_INTEGER);
			}),
		};
	}

	useEffect(() => {
		// Unsubscribe once the component gets unmounted.
		return () => contextRef.current?.unsubscribe();
	}, []);

	return contextRef.current.wrappedValue.value;
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
	}

	return useReadonlyStore(
		(
			previousContextRef.current as {
				derived$: ReadonlyStore<{[P in keyof T]: T[P]}>;
			}
		).derived$,
	) as {
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
