'use client'

import React from "react"
import Link from "next/link"

type RichTextRendererProps = {
  content: string
}

// Regex to capture URLs and @mentions
const TOKEN_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s]|@[a-zA-Z0-9_]+)/gi
const URL_REGEX = /^(https?:\/\/[^\s<]+|www\.[^\s<]+)/i
const MENTION_REGEX = /^@([a-zA-Z0-9_]+)$/

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
          className="text-violet-600 dark:text-violet-400 font-medium hover:underline inline-flex items-center gap-0.5 break-all hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
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

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null

  // Strip leaked CSS block comments (e.g. "/* Top Section */")
  const sanitized = content.replace(/\/\*[\s\S]*?\*\//g, '').trim()
  if (!sanitized) return null

  // Convert legacy markdown **bold** to <strong> HTML tags for unified rendering
  const htmlContent = sanitized.includes("**") 
    ? sanitized.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    : sanitized

  const htmlToReact = (html: string): React.ReactNode[] => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const parseNodes = (nodes: NodeList, parentKey = "root"): React.ReactNode[] => {
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
                <strong key={currentKey} className="font-extrabold text-gray-900 dark:text-white">
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
                  className="text-violet-600 dark:text-violet-400 font-medium hover:underline inline-flex items-center gap-0.5 break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {parseNodes(el.childNodes, currentKey)}
                </a>
              )
            }

            if (tagName === "div" || tagName === "p") {
              return (
                <div key={currentKey} className="block mb-1.5 last:mb-0 leading-relaxed">
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
      // Fallback in case of SSR or DOMParser error
      return renderFormattedText(content, "fallback")
    }
  }

  return <div className="text-[14.5px] leading-relaxed text-gray-800 dark:text-gray-200">{htmlToReact(htmlContent)}</div>
}
