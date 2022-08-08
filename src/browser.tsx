import {start as startHooks} from './browser-hooks';
import {start as startComponents} from './browser-components';

if (import.meta.env.VITE_DEMO === 'hooks') {
	startHooks();
} else {
	startComponents();
}
