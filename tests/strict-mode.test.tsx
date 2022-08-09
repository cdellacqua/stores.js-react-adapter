import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {StrictMode, useEffect} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {makeStore, ReadonlyStore} from 'universal-stores';
import {useReadonlyStore, useReadonlyStores} from '../src/lib';

describe('strict mode', () => {
	let disableJSDOM = () => undefined as void;
	before(() => {
		disableJSDOM = enableJSDOM();
		(global as unknown as Record<string, boolean>).IS_REACT_ACT_ENVIRONMENT =
			true;
	});
	after(() => {
		disableJSDOM();
	});
	let root: Root;
	beforeEach(() => {
		document.body.innerHTML = '<div id="root"></div>';
		act(() => {
			root = createRoot(document.body.children[0]);
		});
	});
	afterEach(() => {
		act(() => {
			root.unmount();
		});
	});

	function ToJSON<T>({
		store$,
		onRender,
	}: {
		store$: ReadonlyStore<T>;
		onRender?: () => void;
	}) {
		const store = useReadonlyStore(store$);
		useEffect(() => {
			onRender?.();
		});
		return <>{JSON.stringify(store)}</>;
	}

	function ToJSONMulti<T>({
		stores,
		onRender,
	}: {
		stores: [ReadonlyStore<T>, ...ReadonlyStore<T>[]];
		onRender?: () => void;
	}) {
		const values = useReadonlyStores(stores);
		useEffect(() => {
			onRender?.();
		});
		return <>{JSON.stringify(values)}</>;
	}

	it('tests the number of re-renders in strict mode', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		let renders = 0;
		act(() => {
			root.render(
				<StrictMode>
					<ToJSON store$={store$} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
		expect(renders).to.eq(3);
	});

	it('tests that a store is correctly read in StrictMode', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		let renders = 0;
		act(() => {
			root.render(
				<StrictMode>
					<ToJSON store$={store$} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
		act(() => {
			store$.set(10);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(10));
		act(() => {
			store$.set(20);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(20));
		expect(renders).to.eq(5);
		expect(store$.nOfSubscriptions).to.eq(1);
		act(() => {
			root.render(<StrictMode></StrictMode>);
		});
		expect(store$.nOfSubscriptions).to.eq(0);
	});

	it('tests the number of initializations and subscriptions that occur on a lazy store', async () => {
		const initialValue = 73;
		let initializations = 0;
		let subscriptions = 0;
		let unsubscriptions = 0;
		const originalStore = makeStore(initialValue, () => {
			initializations++;
		});
		const mockedStore: typeof originalStore = {
			set: originalStore.set,
			update: originalStore.update,
			get value() {
				subscriptions++;
				unsubscriptions++;
				return originalStore.value;
			},
			get nOfSubscriptions() {
				return originalStore.nOfSubscriptions;
			},
			subscribe: (cb) => {
				subscriptions++;
				const unsubscribe = originalStore.subscribe(cb);
				return () => {
					unsubscriptions++;
					unsubscribe();
				};
			},
		};
		const store$ = mockedStore;
		let renders = 0;
		act(() => {
			root.render(
				<StrictMode>
					<ToJSON store$={store$} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(initializations).to.eq(4);
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
		expect(unsubscriptions).to.eq(3);
		expect(subscriptions).to.eq(4);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			store$.set(10);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(10));
		act(() => {
			store$.set(20);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(20));
		expect(renders).to.eq(5);
		expect(initializations).to.eq(4);
		expect(unsubscriptions).to.eq(3);
		expect(subscriptions).to.eq(4);
		act(() => {
			root.render(<StrictMode></StrictMode>);
		});
		expect(unsubscriptions).to.eq(4);
	});

	it('tests the number of initializations and subscriptions that occur on multiple lazy stores', async () => {
		const initialValue = 73;
		let initializations = 0;
		let subscriptions = 0;
		let unsubscriptions = 0;
		const originalStore = makeStore(initialValue, () => {
			initializations++;
		});
		const mockedStore: typeof originalStore = {
			set: originalStore.set,
			update: originalStore.update,
			get value() {
				subscriptions++;
				unsubscriptions++;
				return originalStore.value;
			},
			get nOfSubscriptions() {
				return originalStore.nOfSubscriptions;
			},
			subscribe: (cb) => {
				subscriptions++;
				const unsubscribe = originalStore.subscribe(cb);
				return () => {
					unsubscriptions++;
					unsubscribe();
				};
			},
		};
		const store1$ = mockedStore;
		const store2$ = makeStore(0);
		let renders = 0;
		act(() => {
			root.render(
				<StrictMode>
					<ToJSONMulti stores={[store1$, store2$]} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(initializations).to.eq(4);
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue, 0]));
		expect(unsubscriptions).to.eq(3);
		expect(subscriptions).to.eq(4);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			store1$.set(10);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([10, 0]));
		act(() => {
			store2$.set(20);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([10, 20]));
		expect(renders).to.eq(5);
		expect(initializations).to.eq(4);
		expect(unsubscriptions).to.eq(3);
		expect(subscriptions).to.eq(4);
		act(() => {
			root.render(<StrictMode></StrictMode>);
		});
		expect(unsubscriptions).to.eq(4);
	});

	it('tests the number of initializations and subscriptions that occur on multiple lazy stores when changing the store array', async () => {
		const initialValue = 73;
		let initializations = 0;
		let subscriptions = 0;
		let unsubscriptions = 0;
		const originalStore = makeStore(initialValue, () => {
			initializations++;
		});
		const mockedStore: typeof originalStore = {
			set: originalStore.set,
			update: originalStore.update,
			get value() {
				subscriptions++;
				unsubscriptions++;
				return originalStore.value;
			},
			get nOfSubscriptions() {
				return originalStore.nOfSubscriptions;
			},
			subscribe: (cb) => {
				subscriptions++;
				const unsubscribe = originalStore.subscribe(cb);
				return () => {
					unsubscriptions++;
					unsubscribe();
				};
			},
		};
		const store1$ = mockedStore;
		const store2$ = makeStore(0);
		let renders = 0;
		act(() => {
			root.render(
				<StrictMode>
					<ToJSONMulti stores={[store1$, store2$]} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(renders).to.eq(3);
		expect(initializations).to.eq(4);
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue, 0]));
		expect(unsubscriptions).to.eq(3);
		expect(subscriptions).to.eq(4);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			root.render(
				<StrictMode>
					<ToJSONMulti stores={[store2$, store1$]} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(renders).to.eq(6);
		expect(initializations).to.eq(5);
		expect(document.body.textContent).to.eq(JSON.stringify([0, initialValue]));
		expect(unsubscriptions).to.eq(4);
		expect(subscriptions).to.eq(5);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			root.render(<StrictMode></StrictMode>);
		});
		expect(unsubscriptions).to.eq(5);
	});

	it('tests the number of initializations and subscriptions that occur on multiple lazy stores when changing the store array length', async () => {
		const initialValue = 73;
		let initializations = 0;
		let subscriptions = 0;
		let unsubscriptions = 0;
		const originalStore = makeStore(initialValue, () => {
			initializations++;
		});
		const mockedStore: typeof originalStore = {
			set: originalStore.set,
			update: originalStore.update,
			get value() {
				subscriptions++;
				unsubscriptions++;
				return originalStore.value;
			},
			get nOfSubscriptions() {
				return originalStore.nOfSubscriptions;
			},
			subscribe: (cb) => {
				subscriptions++;
				const unsubscribe = originalStore.subscribe(cb);
				return () => {
					unsubscriptions++;
					unsubscribe();
				};
			},
		};
		const store1$ = mockedStore;
		const store2$ = makeStore(0);
		const store3$ = makeStore(87);
		let renders = 0;
		act(() => {
			root.render(
				<StrictMode>
					<ToJSONMulti stores={[store1$, store2$]} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(renders).to.eq(3);
		expect(initializations).to.eq(4);
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue, 0]));
		expect(unsubscriptions).to.eq(3);
		expect(subscriptions).to.eq(4);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			root.render(
				<StrictMode>
					<ToJSONMulti stores={[store3$]} onRender={() => renders++} />
				</StrictMode>,
			);
		});
		expect(renders).to.eq(6);
		expect(initializations).to.eq(4);
		expect(document.body.textContent).to.eq(JSON.stringify([87]));
		expect(unsubscriptions).to.eq(4);
		expect(subscriptions).to.eq(4);
		expect(mockedStore.nOfSubscriptions).to.eq(0);
		act(() => {
			root.render(<StrictMode></StrictMode>);
		});
		expect(unsubscriptions).to.eq(4);
	});
});
