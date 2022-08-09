import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {useEffect, useState} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {makeReadonlyStore, makeStore, ReadonlyStore} from 'universal-stores';
import {useReadonlyStores} from '../src/lib';

describe('complex hooks', () => {
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

	function ToJSON<T extends [unknown, ...unknown[]]>({
		stores,
		onRender,
	}: {
		stores: {
			[P in keyof T]: ReadonlyStore<T[P]>;
		};
		onRender?: () => void;
	}) {
		const values = useReadonlyStores(stores);
		useEffect(() => {
			onRender?.();
		});
		return <>{JSON.stringify(values)}</>;
	}

	it('checks that a component gets the initial value of multiple stores containing numbers', () => {
		const initialValue1 = 73;
		const initialValue2 = 42;
		const store1$ = makeStore(initialValue1);
		const store2$ = makeStore(initialValue2);
		act(() => {
			root.render(<ToJSON stores={[store1$, store2$]} />);
		});
		expect(document.body.textContent).to.eq(
			JSON.stringify([initialValue1, initialValue2]),
		);
	});

	it('checks that a component gets the initial value of a store containing an object', () => {
		const initialValue = {test: 'demo'};
		const store$ = makeStore(initialValue);
		act(() => {
			root.render(<ToJSON stores={[store$]} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue]));
	});

	it('checks that a component gets the initial value of a readonly store containing a number', () => {
		const initialValue = 73;
		const store$ = makeReadonlyStore(initialValue);
		act(() => {
			root.render(<ToJSON stores={[store$]} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue]));
	});

	it('checks that a component gets the initial value of a readonly store containing an object', () => {
		const initialValue = {test: 'demo'};
		const store$ = makeReadonlyStore(initialValue);
		act(() => {
			root.render(<ToJSON stores={[store$]} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue]));
	});

	it('checks that a component re-renders when the store value changes', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		act(() => {
			root.render(<ToJSON stores={[store$]} />);
		});
		act(() => {
			store$.set(42);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([42]));
	});

	it('checks that a component re-renders if the stores passed as prop change', async () => {
		const store1$ = makeStore(1);
		const store2$ = makeStore(2);
		function Component() {
			const [prop, setProp] = useState(store1$);
			return (
				<>
					<button title="trigger" onClick={() => setProp(store2$)}>
						click me
					</button>
					<div title="content">
						<ToJSON stores={[prop]} />
					</div>
				</>
			);
		}
		act(() => {
			root.render(<Component />);
		});
		expect(store1$.nOfSubscriptions).to.eq(1);
		expect(store2$.nOfSubscriptions).to.eq(0);
		act(() => {
			const btn =
				document.querySelector<HTMLButtonElement>('[title="trigger"]');
			btn?.click();
		});
		const div = document.querySelector('[title="content"]');
		expect(div?.textContent).to.eq(JSON.stringify([2]));
		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(1);
	});

	it('keeps track of the number of subscriptions', async () => {
		const store1$ = makeStore(1);
		const store2$ = makeStore(1);
		expect(store1$.nOfSubscriptions).to.eq(0);

		function Component() {
			const [prop, setProp] = useState(store1$);
			return (
				<>
					<button title="trigger" onClick={() => setProp(store2$)}>
						click me
					</button>
					<div title="content">
						<ToJSON stores={[prop]} />
					</div>
				</>
			);
		}
		act(() => {
			root.render(<Component />);
		});

		expect(store1$.nOfSubscriptions).to.eq(1);
		act(() => {
			store1$.set(2);
		});
		expect(store1$.nOfSubscriptions).to.eq(1);

		const btn = document.querySelector<HTMLButtonElement>('[title="trigger"]');
		act(() => {
			btn?.click();
		});

		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(1);

		act(() => {
			root.render(<></>);
		});

		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(0);
	});

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
				<ToJSONMulti stores={[store1$, store2$]} onRender={() => renders++} />,
			);
		});
		expect(renders).to.eq(2);
		expect(initializations).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify([initialValue, 0]));
		expect(unsubscriptions).to.eq(1);
		expect(subscriptions).to.eq(2);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			store1$.set(10);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([10, 0]));
		act(() => {
			store2$.set(20);
		});
		expect(document.body.textContent).to.eq(JSON.stringify([10, 20]));
		expect(renders).to.eq(4);
		expect(initializations).to.eq(2);
		expect(unsubscriptions).to.eq(1);
		expect(subscriptions).to.eq(2);
		act(() => {
			root.render(<></>);
		});
		expect(unsubscriptions).to.eq(2);
	});
});
