'use client'

import React from "react"
import Link from "next/link"

type RichTextRendererProps = {
  content: string
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null

  // First, parse bold blocks: **bold text**
  const boldRegex = /(\*\*.*?\*\*)/g
  const parts = content.split(boldRegex)

  const parseHashtags = (text: string) => {
    // Matches #anyWord consisting of alphanumeric characters and underscores
    const hashtagRegex = /(#[a-zA-Z0-9_]+)/g
    const subParts = text.split(hashtagRegex)

    return subParts.map((subPart, idx) => {
      if (subPart.startsWith("#")) {
        return (
          <Link
            key={idx}
            href={`/explore?tag=${encodeURIComponent(subPart)}`}
            className="font-bold text-violet-600 dark:text-violet-400 hover:underline inline-block"
            onClick={(e) => e.stopPropagation()} // Prevent parent card click event
          >
            {subPart}
          </Link>
        )
      }
      return subPart
    })
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2)
          return (
            <strong key={index} className="font-extrabold text-gray-900 dark:text-white">
              {parseHashtags(boldText)}
            </strong>
          )
        }
        return <React.Fragment key={index}>{parseHashtags(part)}</React.Fragment>
      })}
    </>
  )
}
