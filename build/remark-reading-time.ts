import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { parse, stringify } from 'yaml'
import { slugify } from '../src/features/notes/slugify.ts'

const WORDS_PER_MINUTE = 220

/**
 * Adds build-time metadata to a note's YAML frontmatter, so pages don't ship or re-parse raw text:
 * - `readingMinutes`: estimated reading time
 * - `toc`: the note's `##` headings with the same ids the page renders (for "On this page")
 *
 * Must run after remark-frontmatter and before remark-mdx-frontmatter.
 */
export function remarkReadingTime() {
  return (tree: Root) => {
    const yamlNode = tree.children.find((node) => node.type === 'yaml')
    if (!yamlNode || yamlNode.type !== 'yaml') return

    const words = toString(tree).split(/\s+/).filter(Boolean).length
    const toc: { text: string; id: string }[] = []
    visit(tree, 'heading', (heading) => {
      if (heading.depth !== 2) return
      const text = toString(heading)
      toc.push({ text, id: slugify(text) })
    })

    const data = (parse(yamlNode.value) ?? {}) as Record<string, unknown>
    data.readingMinutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
    data.toc = toc
    yamlNode.value = stringify(data).trim()
  }
}
