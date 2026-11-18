import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
import { parse, stringify } from 'yaml'

const WORDS_PER_MINUTE = 220

/**
 * Adds `readingMinutes` to a note's YAML frontmatter at build time, so the notes list can show it
 * without shipping the raw text. Must run after remark-frontmatter and before remark-mdx-frontmatter.
 */
export function remarkReadingTime() {
  return (tree: Root) => {
    const yamlNode = tree.children.find((node) => node.type === 'yaml')
    if (!yamlNode || yamlNode.type !== 'yaml') return

    const words = toString(tree).split(/\s+/).filter(Boolean).length
    const data = (parse(yamlNode.value) ?? {}) as Record<string, unknown>
    data.readingMinutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
    yamlNode.value = stringify(data).trim()
  }
}
