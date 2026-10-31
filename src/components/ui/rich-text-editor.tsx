'use client'

import React, { useRef, useEffect, useState } from "react"

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  placeholderClassName?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "", 
  className = "", 
  placeholderClassName = "",
  onKeyDown 
}: RichTextEditorProps) {
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
      const text = (editor.innerText || "").replace(/[\r\n\t]/g, "").trim()
      const empty = text === "" && editor.querySelectorAll('img').length === 0
      if (empty && editor.innerHTML !== "" && editor.innerHTML !== "<br>") {
        editor.innerHTML = ""
      }
      setIsEmpty(empty)
    }
  }

  const handleInput = () => {
    const editor = editorRef.current
    if (!editor) return

    checkIsEmpty()
    onChange(editor.innerHTML)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  // If no min-height is passed in className, use a sensible default of min-h-[80px]
  const hasMinHeight = className.includes('min-h-')
  const defaultMinHeight = hasMinHeight ? '' : 'min-h-[80px]'

  return (
    <div 
      className="relative w-full cursor-text"
      onClick={() => editorRef.current?.focus()}
    >
      <div
        ref={editorRef}
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={onKeyDown}
        className={`w-full ${defaultMinHeight} resize-none outline-none overflow-y-auto text-gray-900 dark:text-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:dark:text-gray-500 empty:before:pointer-events-none empty:before:select-none empty:before:cursor-text ${className}`}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />
    </div>
  )
}
