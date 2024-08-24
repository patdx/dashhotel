import { vitePlugin as remix } from '@remix-run/dev';
import AutoImport from 'unplugin-auto-import/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [
		AutoImport({
			imports: ['react'],
			biomelintrc: {
				enabled: true,
			},
		}),
		remix({
			future: {
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
				unstable_singleFetch: true,
				unstable_lazyRouteDiscovery: true,
			},
		}),
		tsconfigPaths(),
	],
});
