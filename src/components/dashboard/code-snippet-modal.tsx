'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Code2, Eye, PenLine, Sparkles, Check, Hash, ChevronDown } from 'lucide-react'
import { CarbonCodeBlock, THEME_CONFIGS, CarbonTheme, LANGUAGE_LABELS } from '@/components/ui/carbon-code-block'

export interface CodeSnippetData {
  code: string
  language: string
  theme: CarbonTheme
  title?: string
  showLineNumbers?: boolean
}

interface CodeSnippetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: CodeSnippetData | null
  onSaveSnippet: (snippet: CodeSnippetData) => void
}

const SUPPORTED_LANGUAGES = [
  { id: 'cpp', name: 'C++' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'c', name: 'C' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'sql', name: 'SQL' },
  { id: 'html', name: 'HTML / CSS' },
]

export function CodeSnippetModal({
  open,
  onOpenChange,
  initialData,
  onSaveSnippet
}: CodeSnippetModalProps) {
  const [code, setCode] = useState(initialData?.code || '')
  const [language, setLanguage] = useState(initialData?.language || 'cpp')
  const [theme, setTheme] = useState<CarbonTheme>(initialData?.theme || 'trackr')
  const [title, setTitle] = useState(initialData?.title || '')
  const [showLineNumbers, setShowLineNumbers] = useState(initialData?.showLineNumbers ?? true)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const langButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)

  // Close custom language dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        langButtonRef.current && !langButtonRef.current.contains(target) &&
        dropdownMenuRef.current && !dropdownMenuRef.current.contains(target)
      ) {
        setIsLangDropdownOpen(false)
      }
    }
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isLangDropdownOpen])

  // Update floating dropdown position in real time without causing modal layout shift
  useEffect(() => {
    if (isLangDropdownOpen && langButtonRef.current) {
      const updatePos = () => {
        if (!langButtonRef.current) return
        const rect = langButtonRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom - 12
        const openUpwards = spaceBelow < 200 && rect.top > spaceBelow
        const maxHeight = openUpwards ? Math.min(224, rect.top - 20) : Math.min(224, spaceBelow)
        const top = openUpwards ? Math.max(10, rect.top - 6 - maxHeight) : rect.bottom + 6

        setDropdownPos({
          top,
          left: rect.left,
          width: rect.width,
          maxHeight,
        })
      }

      updatePos()
      window.addEventListener('resize', updatePos)
      window.addEventListener('scroll', updatePos, true)
      return () => {
        window.removeEventListener('resize', updatePos)
        window.removeEventListener('scroll', updatePos, true)
      }
    } else {
      setDropdownPos(null)
    }
  }, [isLangDropdownOpen])

  useEffect(() => {
    if (!open) {
      setIsLangDropdownOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setCode(initialData?.code || '')
      setLanguage(initialData?.language || 'cpp')
      setTheme(initialData?.theme || 'trackr')
      setTitle(initialData?.title || '')
      setShowLineNumbers(initialData?.showLineNumbers ?? true)
      setActiveTab('edit')
    }
  }, [open, initialData])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enable Tab indentation inside textarea
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const updatedCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(updatedCode)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleAttach = () => {
    if (!code.trim()) {
      alert('Please enter or paste your code snippet.')
      return
    }

    onSaveSnippet({
      code: code.trim(),
      language,
      theme,
      title: title.trim() || undefined,
      showLineNumbers
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        overlayClassName="z-[10000] bg-black/70 backdrop-blur-xs"
        className="z-[10001] sm:max-w-[700px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-[#0D0B14] border border-gray-100 dark:border-[#2D2B3B] shadow-2xl"
      >
        {/* Modal Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Code2 className="w-4.5 h-4.5" />
              </span>
              <span>Code Snippet Editor</span>
            </DialogTitle>

            {/* View Switcher: Write vs Preview */}
            <div className="flex items-center bg-gray-100 dark:bg-white/10 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white dark:bg-[#1A1A24] text-violet-600 dark:text-violet-400 shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-[#1A1A24] text-violet-600 dark:text-violet-400 shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="px-5 pt-4 pb-2.5 flex-1 overflow-y-auto space-y-3.5 [scrollbar-gutter:stable]">
          {/* Controls Bar: Language, Title, Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Custom Aesthetic Language Selector */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Language
              </Label>
              <button
                ref={langButtonRef}
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className={`w-full h-10 px-3.5 rounded-xl border text-sm font-semibold flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                  isLangDropdownOpen
                    ? 'border-violet-500 ring-2 ring-violet-500/20 bg-white dark:bg-[#1A1A24]'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#161420] hover:bg-gray-100/70 dark:hover:bg-[#1A1A26]'
                } text-gray-900 dark:text-white`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                  <span className="truncate">{SUPPORTED_LANGUAGES.find(l => l.id === language)?.name || 'C++'}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180 text-violet-500' : ''}`} />
              </button>
            </div>

            {/* Filename / Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>File Name / Title (Optional)</span>
                <span className="text-[10px] text-gray-400 font-normal">e.g. Solution.cpp</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. main.${language === 'cpp' ? 'cpp' : language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'}`}
                className="h-10 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161420]"
                maxLength={50}
              />
            </div>
          </div>

          {/* Theme Palette & Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>Carbon Presentation Theme</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                  showLineNumbers
                    ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400'
                    : 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-500'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>Line Numbers</span>
              </button>
            </div>

            {/* Theme Swatches */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(THEME_CONFIGS) as CarbonTheme[]).map((themeKey) => {
                const config = THEME_CONFIGS[themeKey]
                const isSelected = theme === themeKey
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setTheme(themeKey)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-950/30'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-[#161420]'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${config.dot}`} />
                    <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {config.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Tab View: Code Editor or Preview */}
          {activeTab === 'edit' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Code Content</span>
                <span>{code.split('\n').length} lines · Tab indentation enabled</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`// Paste or write your ${LANGUAGE_LABELS[language] || language} code here...\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Trackr Code Snippet" << endl;\n    return 0;\n}`}
                rows={12}
                className="w-full block p-3.5 font-mono text-[13px] sm:text-[13.5px] leading-relaxed rounded-xl border border-gray-200 dark:border-white/10 bg-[#0D0B14] text-gray-100 placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500 resize-none select-text"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Live Carbon.sh Card Preview:
              </p>
              {code.trim() ? (
                <CarbonCodeBlock
                  code={code}
                  language={language}
                  theme={theme}
                  title={title || undefined}
                  showLineNumbers={showLineNumbers}
                />
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-sm">
                  Write or paste code in the Editor tab to preview your snippet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative px-5 py-2.5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-[#12101A] flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          {/* Centered Minimal Tagline */}
          <div className="w-full sm:w-auto sm:absolute sm:inset-0 sm:flex sm:items-center sm:justify-center text-center pointer-events-none order-2 sm:order-1">
            <p className="text-[11.5px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 tracking-normal select-none inline-flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500/80 dark:text-violet-400/80 shrink-0" />
              <span>
                Good code deserves to be <span className="text-violet-600 dark:text-violet-400 font-semibold">shared.</span>
              </span>
            </p>
          </div>

          <div className="hidden sm:block w-20" aria-hidden="true" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 justify-end w-full sm:w-auto relative z-10 shrink-0 order-1 sm:order-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAttach}
              className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold px-4 py-2 cursor-pointer shadow-md active:scale-95 transition-all"
            >
              Attach Snippet
            </Button>
          </div>
        </div>

        {/* Floating Custom Language Dropdown Portaled to Body (Zero Layout Shift) */}
        {isLangDropdownOpen && dropdownPos && typeof document !== 'undefined' && createPortal(
          <div
            ref={dropdownMenuRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
              zIndex: 100005,
            }}
            className="p-1.5 rounded-xl border border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#161420]/95 backdrop-blur-md shadow-2xl overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="space-y-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.id
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.id)
                      setIsLangDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-400 dark:bg-gray-600'}`} />
                      <span>{lang.name}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
      </DialogContent>
    </Dialog>
  )
}
