import {expect} from 'chai';
import enableJSDOM from 'jsdom-global';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {makeReadonlyStore, makeStore} from 'universal-stores';
import {useReadonlyStore, useStore} from '../src/lib';

describe('examples', () => {
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

	it('useReadonlyStore usage 1/2', () => {
		const count$ = makeStore(0);

		function Counter() {
			const count = useReadonlyStore(count$);
			return (
				<>
					<h1>{count}</h1>
				</>
			);
		}
		act(() => {
			root.render(<Counter />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
		act(() => {
			count$.update((c) => c + 1);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('1');
		act(() => {
			count$.update((c) => c - 1);
			count$.update((c) => c - 1);
			count$.update((c) => c - 1);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('-2');
		act(() => {
			count$.set(0);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
	});

	it('useReadonlyStore usage 2/2', () => {
		let intervalCb = () => undefined as void;
		function setIntervalMock(cb: () => void) {
			intervalCb = cb;
			return 0;
		}
		function clearIntervalMock(_id: number) {
			return;
		}
		// A lazy loaded readonly store that increments its value every second.
		const autoCount$ = makeReadonlyStore<number>(undefined, (set) => {
			let count = 0;
			set(count);
			const intervalId = setIntervalMock(() => {
				count++;
				set(count);
			});
			return () => clearIntervalMock(intervalId);
		});

		function Counter() {
			const count = useReadonlyStore(autoCount$);
			return (
				<>
					<h1>{count}</h1>
				</>
			);
		}
		act(() => {
			root.render(<Counter />);
		});
		expect(document.querySelector('h1')?.textContent).to.eq('0');
		act(() => {
			intervalCb();
		});
		expect(document.querySelector('h1')?.textContent).to.eq('1');
	});

	it('useStore usage', () => {
		const count$ = makeStore(0);

		function Counter() {
			const [count, setCount] = useStore(count$);
			return (
				<>
					<h1>{count}</h1>
					<button onClick={() => setCount((c) => c + 1)}>Increment</button>
					<button onClick={() => setCount(0)}>Reset</button>
					<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
				</>
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
});
