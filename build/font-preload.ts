import type { HtmlTagDescriptor, Plugin } from 'vite'

/**
 * Adds `<link rel="preload">` for the fonts used above the fold, so they arrive before first paint.
 * Matches hashed build filenames, so it keeps working as font versions change.
 */
export function fontPreload(patterns: RegExp[]): Plugin {
  return {
    name: 'portfolio-font-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter(
          (file) => file.endsWith('.woff2') && patterns.some((pattern) => pattern.test(file)),
        )
        return files.map<HtmlTagDescriptor>((file) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: `/${file}`,
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
          },
          injectTo: 'head-prepend',
        }))
      },
    },
  }
}
