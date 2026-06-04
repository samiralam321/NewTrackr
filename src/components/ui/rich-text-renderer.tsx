'use client'

import React from "react"
import Link from "next/link"

type RichTextRendererProps = {
  content: string
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null

  // Convert legacy markdown **bold** to <strong> HTML tags for unified rendering
  const htmlContent = content.includes("**") 
    ? content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    : content

  const parseHashtags = (text: string, keyPrefix: any): React.ReactNode[] => {
    const hashtagRegex = /(#[A-Za-z0-9_]+)/g
    const parts = text.split(hashtagRegex)

    return parts.map((part, idx) => {
      if (part.startsWith("#")) {
        return (
          <Link
            key={`${keyPrefix}-${idx}`}
            href={`/explore?tag=${encodeURIComponent(part)}`}
            className="font-bold text-violet-600 dark:text-violet-400 hover:underline inline-block"
            onClick={(e) => e.stopPropagation()} // Prevent card click propagation
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  const htmlToReact = (html: string): React.ReactNode[] => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const parseNodes = (nodes: NodeList): React.ReactNode[] => {
        return Array.from(nodes).map((node, index) => {
          if (node.nodeType === Node.TEXT_NODE) {
            return parseHashtags(node.textContent || "", index)
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            const tagName = el.tagName.toLowerCase()

            if (tagName === "strong" || tagName === "b") {
              return (
                <strong key={index} className="font-extrabold text-gray-900 dark:text-white">
                  {parseNodes(el.childNodes)}
                </strong>
              )
            }

            if (el.classList.contains("hashtag-span") || tagName === "a") {
              const text = el.textContent || ""
              return (
                <Link
                  key={index}
                  href={`/explore?tag=${encodeURIComponent(text)}`}
                  className="font-bold text-violet-600 dark:text-violet-400 hover:underline inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {text}
                </Link>
              )
            }

            if (tagName === "br") {
              return <br key={index} />
            }

            if (tagName === "div" || tagName === "p") {
              return (
                <div key={index} className="block">
                  {parseNodes(el.childNodes)}
                </div>
              )
            }

            return <React.Fragment key={index}>{parseNodes(el.childNodes)}</React.Fragment>
          }

          return null
        }).filter(Boolean)
      }

      return parseNodes(doc.body.childNodes)
    } catch (e) {
      // Fallback in case of SSR or parsing error
      return [content]
    }
  }

  return <>{htmlToReact(htmlContent)}</>
}
