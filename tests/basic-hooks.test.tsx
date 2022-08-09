import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {useEffect, useState} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {
	makeReadonlyStore,
	makeStore,
	ReadonlyStore,
	Store,
} from 'universal-stores';
import {useReadonlyStore, useStore} from '../src/lib';

describe('basic hooks', () => {
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

	it('checks that a component gets the initial value of a store containing a number', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		act(() => {
			root.render(<ToJSON store$={store$} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
	});

	it('checks that a component gets the initial value of a store containing an object', () => {
		const initialValue = {test: 'demo'};
		const store$ = makeStore(initialValue);
		act(() => {
			root.render(<ToJSON store$={store$} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
	});

	it('checks that a component gets the initial value of a readonly store containing a number', () => {
		const initialValue = 73;
		const store$ = makeReadonlyStore(initialValue);
		act(() => {
			root.render(<ToJSON store$={store$} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
	});

	it('checks that a component gets the initial value of a readonly store containing an object', () => {
		const initialValue = {test: 'demo'};
		const store$ = makeReadonlyStore(initialValue);
		act(() => {
			root.render(<ToJSON store$={store$} />);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
	});

	it('checks that a component re-renders when the store value changes', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		let renderCount = 0;
		act(() => {
			root.render(<ToJSON store$={store$} onRender={() => renderCount++} />);
		});
		expect(renderCount).to.eq(2);
		act(() => {
			store$.set(42);
		});
		expect(renderCount).to.eq(3);
		expect(document.body.textContent).to.eq(JSON.stringify(42));
	});

	function ToJSONWithSet<T>({
		store$,
		onRender,
		target,
	}: {
		store$: Store<T>;
		onRender?: () => void;
		target: T;
	}) {
		const [store, setStore] = useStore(store$);
		useEffect(() => {
			onRender?.();
		});
		useEffect(() => {
			setStore(target);
		}, [target, setStore]);
		return <>{JSON.stringify(store)}</>;
	}

	it('checks that a component re-renders when the store value changes via the setter returned by useStore 1/2', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		let renderCount = 0;
		act(() => {
			root.render(
				<ToJSONWithSet
					store$={store$}
					target={13}
					onRender={() => renderCount++}
				/>,
			);
		});
		expect(renderCount).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify(13));
	});

	it('checks that a component re-renders when the store value changes via the setter returned by useStore 2/2', () => {
		const initialValue = 73;
		const store$ = makeStore(initialValue);
		let renderCount = 0;
		act(() => {
			root.render(<ToJSON store$={store$} onRender={() => renderCount++} />);
		});
		act(() => {
			store$.update((c) => c + 1);
		});
		expect(renderCount).to.eq(3);
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue + 1));
	});

	it('checks that a component re-renders when the store value changes according to a custom equality function', () => {
		const initialValue = {content: 73};
		const store$ = makeStore(initialValue, {
			comparator: () => false,
		});
		let renderCount = 0;
		act(() => {
			root.render(<ToJSON store$={store$} onRender={() => renderCount++} />);
		});
		expect(renderCount).to.eq(2);
		act(() => {
			store$.update((c) => {
				c.content = 42;
				return c;
			});
		});
		expect(renderCount).to.eq(3);
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
	});

	it('checks that a component does not re-render when the store value keeps the same reference', () => {
		const initialValue = {content: 73};
		const store$ = makeStore(initialValue);
		let renderCount = 0;
		act(() => {
			root.render(<ToJSON store$={store$} onRender={() => renderCount++} />);
		});
		expect(renderCount).to.eq(2);
		act(() => {
			store$.update((c) => {
				c.content = 42;
				return c;
			});
		});
		expect(renderCount).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify({content: 73}));
	});

	it('checks that a component re-renders if the store passed as prop changes', () => {
		const store1$ = makeStore(1);
		const store2$ = makeStore(10);
		let renderCount = 0;
		function Component() {
			const [prop, setProp] = useState(store1$);
			return (
				<>
					<button title="trigger" onClick={() => setProp(store2$)}>
						click me
					</button>
					<div title="content">
						<ToJSON store$={prop} onRender={() => renderCount++} />
					</div>
				</>
			);
		}
		act(() => {
			root.render(<Component />);
		});
		expect(renderCount).to.eq(2);
		act(() => {
			document.querySelector<HTMLButtonElement>('[title="trigger"]')?.click();
		});
		expect(renderCount).to.eq(4);
		expect(document.querySelector('[title="content"]')?.textContent).to.eq(
			JSON.stringify(10),
		);
		expect(renderCount).to.eq(4);
	});

	it('keeps track of the number of subscriptions', () => {
		const store1$ = makeStore(1);
		const store2$ = makeStore(1);
		let renderCount = 0;
		expect(store1$.nOfSubscriptions).to.eq(0);
		act(() => {
			root.render(<ToJSON store$={store1$} onRender={() => renderCount++} />);
		});
		expect(store1$.nOfSubscriptions).to.eq(1);
		expect(renderCount).to.eq(2);
		act(() => {
			store1$.set(2);
		});
		expect(store1$.nOfSubscriptions).to.eq(1);
		expect(renderCount).to.eq(3);

		act(() => {
			root.render(<ToJSON store$={store2$} onRender={() => renderCount++} />);
		});
		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(1);
		expect(renderCount).to.eq(5);

		act(() => {
			root.render(<></>);
		});
		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(0);
		expect(renderCount).to.eq(5);
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
			root.render(<ToJSON store$={store$} onRender={() => renders++} />);
		});
		expect(initializations).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
		expect(unsubscriptions).to.eq(1);
		expect(subscriptions).to.eq(2);
		expect(mockedStore.nOfSubscriptions).to.eq(1);
		act(() => {
			store$.set(10);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(10));
		act(() => {
			store$.set(20);
		});
		expect(document.body.textContent).to.eq(JSON.stringify(20));
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
