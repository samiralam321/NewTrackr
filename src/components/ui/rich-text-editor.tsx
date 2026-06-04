'use client'

import React, { useRef, useEffect, useState } from "react"

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

export function RichTextEditor({ value, onChange, placeholder, className, onKeyDown }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Synchronize internal HTML with value prop when it changes externally
  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value
      checkIsEmpty()
    }
  }, [value])

  const checkIsEmpty = () => {
    const editor = editorRef.current
    if (editor) {
      const text = editor.innerText.trim()
      setIsEmpty(text === "" && editor.querySelectorAll('img, br').length === 0)
    }
  }

  // Caret save/restore helper
  const saveSelection = (containerEl: HTMLElement) => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    
    // Ensure selection is inside our container
    if (!containerEl.contains(range.startContainer)) return null
    
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(containerEl)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    
    return {
      start: start,
      end: start + range.toString().length
    }
  }

  const restoreSelection = (containerEl: HTMLElement, savedSel: { start: number, end: number } | null) => {
    if (!savedSel) return
    const sel = window.getSelection()
    if (!sel) return
    
    let charIndex = 0
    const range = document.createRange()
    range.setStart(containerEl, 0)
    range.collapse(true)
    
    const nodeQueue = [containerEl]
    let foundStart = false
    
    while (nodeQueue.length > 0) {
      const node = nodeQueue.shift()!
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharIndex = charIndex + node.textContent!.length
        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
          range.setStart(node, savedSel.start - charIndex)
          foundStart = true
        }
        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
          range.setEnd(node, savedSel.end - charIndex)
          break
        }
        charIndex = nextCharIndex
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          nodeQueue.push(node.childNodes[i] as HTMLElement)
        }
      }
    }
    
    sel.removeAllRanges()
    sel.addRange(range)
  }

  // Formats hashtag text nodes into styled spans recursively
  const formatHashtagsHTML = (html: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ""
        const hashtagRegex = /(#[A-Za-z0-9_]+)/g
        if (hashtagRegex.test(text)) {
          const parent = node.parentNode
          if (parent && (parent as HTMLElement).tagName !== 'A' && !(parent as HTMLElement).classList.contains('hashtag-span')) {
            const parts = text.split(hashtagRegex)
            const fragment = document.createDocumentFragment()
            parts.forEach(part => {
              if (part.startsWith('#')) {
                const span = document.createElement('span')
                span.className = 'font-bold text-violet-600 dark:text-violet-400 hashtag-span'
                span.textContent = part
                fragment.appendChild(span)
              } else {
                fragment.appendChild(document.createTextNode(part))
              }
            })
            parent.replaceChild(fragment, node)
          }
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i])
        }
      }
    }
    
    walk(doc.body)
    return doc.body.innerHTML
  }

  const handleInput = () => {
    const editor = editorRef.current
    if (!editor) return

    let html = editor.innerHTML
    const formattedHtml = formatHashtagsHTML(html)
    
    if (formattedHtml !== html) {
      const savedSel = saveSelection(editor)
      editor.innerHTML = formattedHtml
      restoreSelection(editor, savedSel)
    }

    checkIsEmpty()
    onChange(editor.innerHTML)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  return (
    <div className="relative w-full">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={onKeyDown}
        className={`w-full min-h-[160px] resize-none outline-none overflow-y-auto text-gray-900 dark:text-white ${className}`}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />
      {isEmpty && (
        <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none select-none font-normal text-sm leading-relaxed">
          {placeholder?.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
    </div>
  )
}
