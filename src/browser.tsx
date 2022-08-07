import './style.css';
import {useReadonlyStore, useStore} from './lib';
import {makeReadonlyStore, makeStore, ReadonlyStore} from 'universal-stores';
import {createRoot, Root} from 'react-dom/client';
import {useState} from 'react';

const appDiv = document.getElementById('app') as HTMLDivElement;

const count$ = makeStore(0);

const autoCount$ = makeReadonlyStore<number>(undefined, (set) => {
	let count = 0;
	set(count);
	const intervalId = setInterval(() => {
		count++;
		set(count);
	}, 1000);
	return () => clearInterval(intervalId);
});

function Counter() {
	const [count, setCount] = useStore(count$);
	return (
		<>
			<h1>Counter: {count}</h1>
			<button onClick={() => setCount((c) => c + 1)}>Increment</button>
			<button onClick={() => setCount(0)}>Reset</button>
			<button onClick={() => setCount((c) => c - 1)}>Decrement</button>
		</>
	);
}

function ReadonlyCounter(props: {count$: ReadonlyStore<number>}) {
	const count = useReadonlyStore(props.count$);
	return (
		<>
			<h1>Readonly counter: {count}</h1>
		</>
	);
}

function App() {
	const [mountAutoCount, setMountAutoCount] = useState(true);
	return (
		<>
			<Counter />
			<div style={{borderBottom: '1px solid gray', margin: '1rem 0'}} />
			<ReadonlyCounter count$={count$} />
			<div style={{borderBottom: '1px solid gray', margin: '1rem 0'}} />
			{mountAutoCount && <ReadonlyCounter count$={autoCount$} />}
			<button onClick={() => setMountAutoCount(!mountAutoCount)}>
				{mountAutoCount ? 'unmount auto counter' : 'mount auto counter'}
			</button>
		</>
	);
}

const global = window as {reactRoot?: Root};
// Fix the hot reload issue by caching the Root object.
global.reactRoot = global.reactRoot || createRoot(appDiv);
global.reactRoot.render(<App />);
