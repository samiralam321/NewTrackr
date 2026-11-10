/**
 * Cleans raw post content for clipboard copying and sharing.
 * Strips HTML formatting tags (<b>, </b>, <strong>, <p>, <br>, etc.) and internal code fences,
 * while preserving emojis, plain text, and code symbols (<iostream>, vector<int>, etc.).
 */
export function extractCleanPlainText(content: string): string {
  if (!content) return ''

  // 1. Separate code fences so their contents are never damaged by HTML strippers
  const codeBlocks: string[] = []
  let text = content.replace(/```[a-zA-Z0-9_#+-]*(?::[^\n\r]*)?[\r\n]+([\s\S]*?)```/g, (_, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
    codeBlocks.push(code.trim())
    return placeholder
  })

  // 2. Remove leaked CSS comments if any
  text = text.replace(/\/\*[\s\S]*?\*\//g, '')

  // 3. Convert line breaks and paragraph ends to newlines
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')

  // 4. Strip known HTML formatting tags (<b>, </b>, <strong>, <span>, <i>, <p>, <div>, etc.)
  // while safely preserving code symbols like #include <iostream>, vector<int>, List<String>
  const HTML_TAGS_REGEX = /<\/?(?:b|strong|i|em|u|s|strike|span|p|div|br|hr|a|ul|ol|li|code|pre|blockquote|h[1-6]|font|small|sub|sup)\b[^>]*>/gi
  text = text.replace(HTML_TAGS_REGEX, '')

  // 5. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")

  // 6. Restore code blocks
  codeBlocks.forEach((code, index) => {
    text = text.replace(`__CODE_BLOCK_${index}__`, `\n${code}\n`)
  })

  // 7. Clean up excessive blank lines (more than 2 consecutive newlines)
  return text.replace(/\n{3,}/g, '\n\n').trim()
}
