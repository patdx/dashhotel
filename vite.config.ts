import { vitePlugin as remix } from '@remix-run/dev';
import AutoImport from 'unplugin-auto-import/vite';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';

const ReactCompilerConfig = {};

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
		babel({
			filter: /\.[jt]sx?$/,
			babelConfig: {
				presets: ['@babel/preset-typescript'], // if you use TypeScript
				plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
			},
		}),
		tsconfigPaths(),
	],
});
