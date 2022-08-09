import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {useState} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {makeStore, ReadonlyStore} from 'universal-stores';
import {WithReadonlyStore, WithReadonlyStores} from '../src/lib';

describe('components', () => {
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

	it("WithReadonlyStore: tests rerenders when the parent component doesn't change", () => {
		const count$ = makeStore(4);
		let renders = 0;

		function Counter() {
			return (
				<WithReadonlyStore store={count$}>
					{(count) => {
						renders++;
						return <h1>{count}</h1>;
					}}
				</WithReadonlyStore>
			);
		}
		act(() => {
			root.render(<Counter />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('4');
		act(() => {
			count$.set(10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('10');
		expect(renders).to.eq(3);
	});
	it('WithReadonlyStore: tests rerenders when the parent rerenders', () => {
		const count$ = makeStore(4);
		let parentRenders = 0;
		let childrenRenders = 0;

		function Counter() {
			const [, setRerenderMe] = useState(0);
			parentRenders++;
			return (
				<>
					<button onClick={() => setRerenderMe((n) => n + 1)}>click</button>
					<WithReadonlyStore store={count$}>
						{(count) => {
							childrenRenders++;
							return <h1>{count}</h1>;
						}}
					</WithReadonlyStore>
				</>
			);
		}
		act(() => {
			root.render(<Counter />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('4');
		act(() => {
			count$.set(10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('10');
		expect(parentRenders).to.eq(1);
		expect(childrenRenders).to.eq(3);
		act(() => {
			document.querySelector<HTMLButtonElement>('button')?.click();
		});
		expect(parentRenders).to.eq(2);
		expect(childrenRenders).to.eq(4);
	});

	it("WithReadonlyStores: tests rerenders when the parent component doesn't change", () => {
		const firstNumber$ = makeStore(4);
		const secondNumber$ = makeStore(2);
		let renders = 0;

		function Sum() {
			return (
				<WithReadonlyStores stores={[firstNumber$, secondNumber$]}>
					{([firstNumber, secondNumber]) => {
						renders++;
						return <h1>{firstNumber + secondNumber}</h1>;
					}}
				</WithReadonlyStores>
			);
		}
		act(() => {
			root.render(<Sum />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('6');
		act(() => {
			firstNumber$.set(10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('12');
		act(() => {
			secondNumber$.update(() => -10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
		expect(renders).to.eq(4);
	});
	it('WithReadonlyStores: tests rerenders when the parent rerenders', () => {
		const firstNumber$ = makeStore(4);
		const secondNumber$ = makeStore(2);
		let parentRenders = 0;
		let childrenRenders = 0;

		function Sum() {
			const [, setRerenderMe] = useState(0);
			parentRenders++;
			return (
				<>
					<button onClick={() => setRerenderMe((n) => n + 1)}>click</button>
					<WithReadonlyStores stores={[firstNumber$, secondNumber$]}>
						{([firstNumber, secondNumber]) => {
							childrenRenders++;
							return <h1>{firstNumber + secondNumber}</h1>;
						}}
					</WithReadonlyStores>
				</>
			);
		}
		act(() => {
			root.render(<Sum />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('6');
		act(() => {
			firstNumber$.set(10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('12');
		act(() => {
			secondNumber$.update(() => -10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
		expect(parentRenders).to.eq(1);
		expect(childrenRenders).to.eq(4);
		act(() => {
			document.querySelector<HTMLButtonElement>('button')?.click();
		});
		expect(parentRenders).to.eq(2);
		expect(childrenRenders).to.eq(5);
	});

	it('WithReadonlyStores: tests that the output changes when the stores are rearranged', () => {
		const firstNumber$ = makeStore(4);
		const secondNumber$ = makeStore(2);
		let renders = 0;

		function Sub() {
			const [stores, setStores] = useState<
				[ReadonlyStore<number>, ReadonlyStore<number>]
			>([firstNumber$, secondNumber$]);
			return (
				<>
					<button onClick={() => setStores([secondNumber$, firstNumber$])}>
						click
					</button>
					<WithReadonlyStores stores={stores}>
						{([firstNumber, secondNumber]) => {
							renders++;
							return <h1>{firstNumber - secondNumber}</h1>;
						}}
					</WithReadonlyStores>
				</>
			);
		}
		act(() => {
			root.render(<Sub />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('2');
		expect(renders).to.eq(2);
		act(() => {
			document.querySelector<HTMLButtonElement>('button')?.click();
		});
		expect(renders).to.eq(5);
		expect(document.querySelector('h1')?.textContent).to.eq('-2');
		act(() => {
			firstNumber$.set(10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('-8');
		expect(renders).to.eq(6);
	});
});
