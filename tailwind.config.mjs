import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				display: ['"HarmonyOS Sans TC"', '"HarmonyOS Sans SC"', 'system-ui', 'sans-serif'],
				body: ['"HarmonyOS Sans TC"', '"HarmonyOS Sans SC"', 'system-ui', 'sans-serif'],
				sans: ['"HarmonyOS Sans TC"', '"HarmonyOS Sans SC"', 'system-ui', 'sans-serif'],
				serif: ['"HarmonyOS Sans TC"', '"HarmonyOS Sans SC"', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'monospace'],
			},
		},
	},
	plugins: [typography],
};
