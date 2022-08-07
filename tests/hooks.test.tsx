import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {useEffect} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {
	makeReadonlyStore,
	makeStore,
	ReadonlyStore,
	Store,
	Updater,
} from 'universal-stores';
import {useReadonlyStore, useStore} from '../src/lib';

describe('hooks', () => {
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
		onRender?.();
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
		expect(renderCount).to.eq(1);
		act(() => {
			store$.set(42);
		});
		expect(renderCount).to.eq(2);
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
		onRender?.();
		useEffect(() => {
			setStore(target);
		}, [target]);
		return <>{JSON.stringify(store)}</>;
	}

	function ToJSONWithUpdate<T>({
		store$,
		onRender,
		updater,
	}: {
		store$: Store<T>;
		onRender?: () => void;
		updater: Updater<T>;
	}) {
		const [store, setStore] = useStore(store$);
		onRender?.();
		useEffect(() => {
			setStore(updater);
		}, [updater]);
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
			root.render(
				<ToJSONWithUpdate
					store$={store$}
					updater={(c) => c + 1}
					onRender={() => renderCount++}
				/>,
			);
		});
		expect(renderCount).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue + 1));
	});

	it('checks that a component re-renders when the store value changes according to a custom equality function', () => {
		const initialValue = {content: 73};
		const store$ = makeStore(initialValue, {
			comparator: () => false,
		});
		let renderCount = 0;
		act(() => {
			root.render(
				<ToJSONWithUpdate
					store$={store$}
					updater={(c) => {
						c.content = 42;
						return c;
					}}
					onRender={() => renderCount++}
				/>,
			);
		});
		expect(renderCount).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify(initialValue));
	});

	it('checks that a component does not re-render when the store value keeps the same reference', () => {
		const initialValue = {content: 73};
		const store$ = makeStore(initialValue);
		let renderCount = 0;
		act(() => {
			root.render(
				<ToJSONWithUpdate
					store$={store$}
					updater={(c) => {
						c.content = 42;
						return c;
					}}
					onRender={() => renderCount++}
				/>,
			);
		});
		expect(renderCount).to.eq(1);
		expect(document.body.textContent).to.eq(JSON.stringify({content: 73}));
	});

	it('checks that a component re-renders if the store passed as prop changes', () => {
		const store1$ = makeStore(1);
		const store2$ = makeStore(2);
		let renderCount = 0;
		act(() => {
			root.render(<ToJSON store$={store1$} onRender={() => renderCount++} />);
		});
		act(() => {
			root.render(<ToJSON store$={store2$} onRender={() => renderCount++} />);
		});
		expect(renderCount).to.eq(2);
		expect(document.body.textContent).to.eq(JSON.stringify(2));
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
		expect(renderCount).to.eq(1);
		act(() => {
			store1$.set(2);
		});
		expect(store1$.nOfSubscriptions).to.eq(1);
		expect(renderCount).to.eq(2);

		act(() => {
			root.render(<ToJSON store$={store2$} onRender={() => renderCount++} />);
		});
		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(1);
		expect(renderCount).to.eq(3);

		act(() => {
			root.render(<></>);
		});
		expect(store1$.nOfSubscriptions).to.eq(0);
		expect(store2$.nOfSubscriptions).to.eq(0);
		expect(renderCount).to.eq(3);
	});
});
