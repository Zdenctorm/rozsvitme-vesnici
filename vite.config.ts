import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { strings } from './src/strings.cs.ts';

/** Fills %APP_TITLE% in index.html from the strings file, so copy stays in one place. */
function stringsInHtml(): Plugin {
  return {
    name: 'strings-in-html',
    transformIndexHtml: (html) => html.replaceAll('%APP_TITLE%', strings.appTitle),
  };
}

export default defineConfig({
  plugins: [stringsInHtml()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
