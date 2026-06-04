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
