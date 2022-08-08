import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {makeStore} from 'universal-stores';
import {WithReadonlyStore, WithReadonlyStores, WithStore} from '../src/lib';

describe('components examples', () => {
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

	it('WithStore usage', () => {
		const count$ = makeStore(0);

		function Counter() {
			return (
				<WithStore store={count$}>
					{(count, setCount) => (
						<>
							<h1>{count}</h1>
							<button onClick={() => setCount((c) => c + 1)}>Increment</button>
							<button onClick={() => setCount(0)}>Reset</button>
							<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
						</>
					)}
				</WithStore>
			);
		}

		act(() => {
			root.render(<Counter />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
		act(() => {
			document.querySelectorAll('button')[0].click();
		});
		expect(document.querySelector('h1')?.textContent).to.eq('1');
		act(() => {
			document.querySelectorAll('button')[2].click();
			document.querySelectorAll('button')[2].click();
			document.querySelectorAll('button')[2].click();
		});
		expect(document.querySelector('h1')?.textContent).to.eq('-2');
		act(() => {
			document.querySelectorAll('button')[1].click();
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
	});

	it('WithReadonlyStore usage', () => {
		const count$ = makeStore(0);

		function Counter() {
			return (
				<WithReadonlyStore store={count$}>
					{(count) => <h1>{count}</h1>}
				</WithReadonlyStore>
			);
		}
		act(() => {
			root.render(<Counter />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
		act(() => {
			count$.set(10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('10');
		act(() => {
			count$.update(() => -10);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('-10');
	});

	it('WithReadonlyStores usage', () => {
		const firstNumber$ = makeStore(4);
		const secondNumber$ = makeStore(2);

		function Sum() {
			return (
				<WithReadonlyStores stores={[firstNumber$, secondNumber$]}>
					{([firstNumber, secondNumber]) => (
						<h1>{firstNumber + secondNumber}</h1>
					)}
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
	});
});
