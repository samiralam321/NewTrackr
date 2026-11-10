'use client'

import React from "react"
import Link from "next/link"
import { CarbonCodeBlock } from "@/components/ui/carbon-code-block"

type RichTextRendererProps = {
  content: string
}

// List of recognized domain extensions for bare URLs (e.g. zenvora-platform.vercel.app, github.com, trackr.in)
const TLD_LIST = 'com|org|net|edu|gov|app|dev|io|ai|tech|xyz|me|co|in|to|cc|tv|gg|site|online|live|store|shop|pro|cloud|digital|space|agency|design|media|news|link|world|club|sh|run|is|so|fm|ly|page|bio|us|uk|ca|au|de|fr|it|es|nl|se|no|ch|br|jp|kr|cn|tw|hk|sg|ae|eu'

const BARE_DOMAIN_PATTERN = `(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+(?:${TLD_LIST})(?::[0-9]{1,5})?(?:\\/(?:[^\\s<]*[a-zA-Z0-9\\/_~#?&=%+-])?)?`
const URL_PATTERN = `https?:\\/\\/[^\\s<]+[a-zA-Z0-9\\/_~#?&=%+-]|www\\.[^\\s<]+[a-zA-Z0-9\\/_~#?&=%+-]|${BARE_DOMAIN_PATTERN}`

// Regex to capture URLs and @mentions
const TOKEN_REGEX = new RegExp(`(${URL_PATTERN}|@[a-zA-Z0-9_]+)`, 'gi')
const URL_REGEX = new RegExp(`^(https?:\\/\\/|www\\.|${BARE_DOMAIN_PATTERN})`, 'i')
const MENTION_REGEX = /^@([a-zA-Z0-9_]+)$/
const CODE_BLOCK_REGEX = /```([a-zA-Z0-9_#+-]+)?(?::([a-zA-Z0-9_-]+))?(?::([^\n\r]+))?[\r\n]+([\s\S]*?)```/g

function renderFormattedText(text: string, baseKey: string | number): React.ReactNode[] {
  if (!text) return []

  // Split by URLs and mentions while keeping matching delimiters
  const parts = text.split(TOKEN_REGEX)

  return parts.map((part, i) => {
    const key = `${baseKey}-token-${i}`
    if (!part) return null

    // Check for URL
    if (URL_REGEX.test(part)) {
      // Disallow unsafe schemes
      if (part.toLowerCase().startsWith('javascript:') || part.toLowerCase().startsWith('data:')) {
        return <span key={key}>{part}</span>
      }

      const href = part.startsWith('http://') || part.startsWith('https://') 
        ? part 
        : `https://${part}`

      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 font-medium hover:underline decoration-[1px] underline-offset-2 hover:decoration-violet-400/80 dark:hover:decoration-violet-400/80 inline-flex items-center gap-0.5 break-all hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }

    // Check for @mention
    const mentionMatch = part.match(MENTION_REGEX)
    if (mentionMatch) {
      const handle = mentionMatch[1]
      return (
        <Link
          key={key}
          href={`/profile/${handle}`}
          className="text-violet-600 dark:text-violet-400 font-semibold hover:underline bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.5 rounded-md inline-flex items-center mx-0.5 transition-colors active:scale-95"
          onClick={(e) => e.stopPropagation()}
        >
          @{handle}
        </Link>
      )
    }

    // Check for newlines inside plain text chunks
    if (part.includes('\n')) {
      const lines = part.split('\n')
      return (
        <React.Fragment key={key}>
          {lines.map((line, lineIdx) => (
            <React.Fragment key={`${key}-line-${lineIdx}`}>
              {line}
              {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </React.Fragment>
      )
    }

    return <span key={key}>{part}</span>
  }).filter(Boolean)
}

interface ContentSegment {
  type: 'text' | 'code'
  text?: string
  code?: string
  language?: string
  theme?: string
  title?: string
}

function parseSegments(rawContent: string): ContentSegment[] {
  if (!rawContent || !rawContent.includes('```')) {
    return [{ type: 'text', text: rawContent }]
  }

  const segments: ContentSegment[] = []
  let lastIndex = 0
  const regex = /```([a-zA-Z0-9_#+-]+)?(?::([a-zA-Z0-9_-]+))?(?::([^\n\r]+))?[\r\n]+([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawContent)) !== null) {
    if (match.index > lastIndex) {
      const textPart = rawContent.substring(lastIndex, match.index)
      if (textPart.trim()) {
        segments.push({ type: 'text', text: textPart })
      }
    }

    segments.push({
      type: 'code',
      language: match[1] || 'cpp',
      theme: match[2] || 'trackr',
      title: match[3]?.trim() || undefined,
      code: match[4] || ''
    })

    lastIndex = regex.lastIndex
  }

  if (lastIndex < rawContent.length) {
    const remaining = rawContent.substring(lastIndex)
    if (remaining.trim()) {
      segments.push({ type: 'text', text: remaining })
    }
  }

  return segments.length > 0 ? segments : [{ type: 'text', text: rawContent }]
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null

  const segments = parseSegments(content)

  const htmlToReact = (html: string, baseParentKey: string): React.ReactNode[] => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const parseNodes = (nodes: NodeList, parentKey = baseParentKey): React.ReactNode[] => {
        return Array.from(nodes).map((node, index) => {
          const currentKey = `${parentKey}-${index}`

          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ""
            return renderFormattedText(text, currentKey)
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            const tagName = el.tagName.toLowerCase()

            if (tagName === "strong" || tagName === "b") {
              return (
                <strong key={currentKey} className="font-bold text-[#0f1419] dark:text-[#e7e9ea]">
                  {parseNodes(el.childNodes, currentKey)}
                </strong>
              )
            }

            if (tagName === "br") {
              return <br key={currentKey} />
            }

            if (tagName === "a") {
              const href = el.getAttribute("href") || ""
              const isExternal = href.startsWith("http://") || href.startsWith("https://")
              return (
                <a
                  key={currentKey}
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="text-violet-600 dark:text-violet-400 font-medium hover:underline decoration-[1px] underline-offset-2 hover:decoration-violet-400/80 dark:hover:decoration-violet-400/80 inline-flex items-center gap-0.5 break-all transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {parseNodes(el.childNodes, currentKey)}
                </a>
              )
            }

            if (tagName === "div" || tagName === "p") {
              return (
                <div key={currentKey} className="block mb-1.5 last:mb-0 leading-[1.5]">
                  {parseNodes(el.childNodes, currentKey)}
                </div>
              )
            }

            return (
              <React.Fragment key={currentKey}>
                {parseNodes(el.childNodes, currentKey)}
              </React.Fragment>
            )
          }

          return null
        }).filter(Boolean)
      }

      return parseNodes(doc.body.childNodes)
    } catch (e) {
      return renderFormattedText(html, "fallback")
    }
  }

  const renderTextSegment = (textChunk: string, segKey: string) => {
    // Strip leaked CSS block comments (e.g. "/* Top Section */")
    const sanitized = textChunk.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    if (!sanitized) return null

    // Convert legacy markdown **bold** to <strong> HTML tags for unified rendering
    const htmlContent = sanitized.includes("**") 
      ? sanitized.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      : sanitized

    return (
      <div key={segKey} className="text-[16px] leading-[1.5] text-[#0f1419] dark:text-[#e7e9ea] font-normal">
        {htmlToReact(htmlContent, segKey)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {segments.map((seg, idx) => {
        if (seg.type === 'code' && seg.code) {
          return (
            <CarbonCodeBlock
              key={`code-block-${idx}`}
              code={seg.code}
              language={seg.language}
              theme={seg.theme}
              title={seg.title}
            />
          )
        }
        return renderTextSegment(seg.text || '', `seg-${idx}`)
      })}
    </div>
  )
}
