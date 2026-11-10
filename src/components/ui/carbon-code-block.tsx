'use client'

import React, { useState } from 'react'
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react'

export type CarbonTheme = 'trackr' | 'dracula' | 'sunset' | 'midnight' | 'cyberpunk' | 'minimal'

export interface CarbonCodeBlockProps {
  code: string
  language?: string
  theme?: CarbonTheme | string
  title?: string
  showLineNumbers?: boolean
  className?: string
}

// Language display labels
export const LANGUAGE_LABELS: Record<string, string> = {
  cpp: 'C++',
  'c++': 'C++',
  c: 'C',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  csharp: 'C#',
  cs: 'C#',
  go: 'Go',
  golang: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
}

// Language keywords definition
const KEYWORDS: Record<string, Set<string>> = {
  cpp: new Set([
    'include', 'namespace', 'using', 'std', 'int', 'float', 'double', 'char', 'void', 'bool',
    'auto', 'const', 'static', 'struct', 'class', 'public', 'private', 'protected', 'template',
    'typename', 'vector', 'string', 'cout', 'cin', 'endl', 'return', 'if', 'else', 'for', 'while',
    'switch', 'case', 'break', 'continue', 'new', 'delete', 'nullptr', 'true', 'false', 'sizeof'
  ]),
  python: new Set([
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
    'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield',
    'async', 'await', 'pass', 'global', 'nonlocal', 'assert', 'None', 'True', 'False', 'in',
    'is', 'not', 'and', 'or', 'print', 'len', 'range', 'self'
  ]),
  java: new Set([
    'public', 'private', 'protected', 'static', 'final', 'void', 'int', 'double', 'float',
    'char', 'boolean', 'class', 'interface', 'extends', 'implements', 'new', 'return', 'if',
    'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
    'throw', 'throws', 'import', 'package', 'null', 'true', 'false', 'this', 'super'
  ]),
  javascript: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'default', 'new', 'this', 'class', 'extends',
    'super', 'import', 'export', 'from', 'as', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false'
  ]),
  typescript: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'default', 'new', 'this', 'class', 'extends',
    'super', 'import', 'export', 'from', 'as', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false',
    'type', 'interface', 'enum', 'any', 'string', 'number', 'boolean', 'void', 'never', 'unknown'
  ]),
  go: new Set([
    'func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'return',
    'if', 'else', 'for', 'range', 'switch', 'case', 'break', 'continue', 'go', 'chan',
    'select', 'defer', 'nil', 'true', 'false', 'string', 'int', 'bool'
  ]),
  rust: new Set([
    'fn', 'let', 'mut', 'pub', 'struct', 'enum', 'impl', 'trait', 'match', 'if', 'else',
    'for', 'while', 'loop', 'return', 'break', 'continue', 'use', 'mod', 'crate', 'self',
    'Self', 'true', 'false', 'None', 'Some', 'Ok', 'Err'
  ]),
  sql: new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE',
    'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY',
    'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AND', 'OR', 'NOT', 'NULL', 'PRIMARY', 'KEY',
    'FOREIGN', 'REFERENCES', 'AS', 'DISTINCT', 'UNION', 'ALL', 'select', 'from', 'where',
    'insert', 'into', 'update', 'delete', 'create', 'table', 'alter', 'drop', 'join',
    'on', 'and', 'or', 'not', 'null', 'as'
  ])
}

// Theme color definitions
export const THEME_CONFIGS: Record<CarbonTheme, {
  name: string
  dot: string
  outerBg: string
  windowBg: string
  tokens: {
    keyword: string
    string: string
    number: string
    comment: string
    function: string
    type: string
    operator: string
    variable: string
  }
}> = {
  trackr: {
    name: 'Trackr Violet',
    dot: 'bg-violet-500',
    outerBg: 'bg-gradient-to-br from-violet-600/35 via-purple-900/30 to-fuchsia-600/35 border border-violet-500/30',
    windowBg: 'bg-[#0D0B14]/95 border border-violet-500/25',
    tokens: {
      keyword: 'text-[#C084FC] font-semibold',
      string: 'text-[#6EE7B7]',
      number: 'text-[#FDE047]',
      comment: 'text-[#94A3B8] italic',
      function: 'text-[#38BDF8]',
      type: 'text-[#F472B6]',
      operator: 'text-[#CBD5E1]',
      variable: 'text-[#F8FAFC]',
    }
  },
  dracula: {
    name: 'Dracula',
    dot: 'bg-[#BD93F9]',
    outerBg: 'bg-gradient-to-br from-[#282a36] via-[#44475a] to-[#6272a4] border border-[#6272a4]/40',
    windowBg: 'bg-[#1E1F29]/95 border border-[#6272A4]/40',
    tokens: {
      keyword: 'text-[#FF79C6] font-semibold',
      string: 'text-[#F1FA8C]',
      number: 'text-[#BD93F9]',
      comment: 'text-[#6272A4] italic',
      function: 'text-[#50FA7B]',
      type: 'text-[#8BE9FD]',
      operator: 'text-[#FF79C6]',
      variable: 'text-[#F8F8F2]',
    }
  },
  sunset: {
    name: 'Sunset',
    dot: 'bg-rose-500',
    outerBg: 'bg-gradient-to-br from-rose-500/35 via-orange-500/30 to-amber-500/35 border border-rose-500/30',
    windowBg: 'bg-[#18131A]/95 border border-rose-500/25',
    tokens: {
      keyword: 'text-[#FB7185] font-semibold',
      string: 'text-[#FBBF24]',
      number: 'text-[#F472B6]',
      comment: 'text-[#9CA3AF] italic',
      function: 'text-[#38BDF8]',
      type: 'text-[#34D399]',
      operator: 'text-[#E2E8F0]',
      variable: 'text-white',
    }
  },
  midnight: {
    name: 'Midnight',
    dot: 'bg-blue-600',
    outerBg: 'bg-gradient-to-br from-blue-900/40 via-indigo-950/45 to-slate-900/50 border border-blue-500/30',
    windowBg: 'bg-[#0B0F19]/95 border border-blue-500/25',
    tokens: {
      keyword: 'text-[#60A5FA] font-semibold',
      string: 'text-[#F87171]',
      number: 'text-[#4ADE80]',
      comment: 'text-[#64748B] italic',
      function: 'text-[#FBBF24]',
      type: 'text-[#2DD4BF]',
      operator: 'text-[#94A3B8]',
      variable: 'text-[#F1F5F9]',
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    dot: 'bg-cyan-400',
    outerBg: 'bg-gradient-to-br from-cyan-500/35 via-emerald-600/25 to-teal-900/40 border border-cyan-500/30',
    windowBg: 'bg-[#061214]/95 border border-cyan-500/25',
    tokens: {
      keyword: 'text-[#22D3EE] font-semibold',
      string: 'text-[#4ADE80]',
      number: 'text-[#FACC15]',
      comment: 'text-[#4B5563] italic',
      function: 'text-[#A855F7]',
      type: 'text-[#F43F5E]',
      operator: 'text-[#E0F2FE]',
      variable: 'text-[#ECFDF5]',
    }
  },
  minimal: {
    name: 'Minimal',
    dot: 'bg-slate-400',
    outerBg: 'bg-slate-900/40 border border-white/10',
    windowBg: 'bg-[#18181B]/95 border border-white/10',
    tokens: {
      keyword: 'text-white font-semibold',
      string: 'text-[#94A3B8]',
      number: 'text-[#CBD5E1]',
      comment: 'text-[#64748B] italic',
      function: 'text-white',
      type: 'text-[#E2E8F0]',
      operator: 'text-[#94A3B8]',
      variable: 'text-[#F8FAFC]',
    }
  }
}

// Tokenize a single line of code into highlighted pieces
function tokenizeLine(line: string, lang: string, tokenStyles: Record<string, string>): React.ReactNode[] {
  const normLang = lang.toLowerCase()
  const isPython = normLang === 'python' || normLang === 'py'
  const isSql = normLang === 'sql'
  const commentPrefix = isPython ? '#' : (isSql ? '--' : '//')

  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < line.length) {
    // Single line comments
    if (line.substr(i, commentPrefix.length) === commentPrefix) {
      nodes.push(
        <span key={`comment-${i}`} className={tokenStyles.comment}>
          {line.slice(i)}
        </span>
      )
      break
    }

    // Block comments
    if (line.substr(i, 2) === '/*') {
      const end = line.indexOf('*/', i + 2)
      if (end !== -1) {
        nodes.push(
          <span key={`bcomment-${i}`} className={tokenStyles.comment}>
            {line.slice(i, end + 2)}
          </span>
        )
        i = end + 2
        continue
      } else {
        nodes.push(
          <span key={`bcomment-${i}`} className={tokenStyles.comment}>
            {line.slice(i)}
          </span>
        )
        break
      }
    }

    // Strings
    const char = line[i]
    if (char === '"' || char === "'" || char === '`') {
      let str = char
      i++
      while (i < line.length && line[i] !== char) {
        if (line[i] === '\\' && i + 1 < line.length) {
          str += line[i] + line[i + 1]
          i += 2
        } else {
          str += line[i]
          i++
        }
      }
      if (i < line.length) {
        str += line[i]
        i++
      }
      nodes.push(
        <span key={`str-${i}`} className={tokenStyles.string}>
          {str}
        </span>
      )
      continue
    }

    // Numbers
    if (/\d/.test(char) && (i === 0 || /[^a-zA-Z0-9_]/.test(line[i - 1]))) {
      let num = ''
      while (i < line.length && /[0-9.xXbBoOfFlL]/.test(line[i])) {
        num += line[i]
        i++
      }
      nodes.push(
        <span key={`num-${i}`} className={tokenStyles.number}>
          {num}
        </span>
      )
      continue
    }

    // Words / Keywords / Functions / Types
    if (/[a-zA-Z_$]/.test(char)) {
      let word = ''
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i]
        i++
      }

      const langMap = KEYWORDS[normLang] || KEYWORDS.javascript
      const isKeyword = langMap.has(word) || (isSql && langMap.has(word.toUpperCase()))

      if (isKeyword) {
        nodes.push(
          <span key={`kw-${i}`} className={tokenStyles.keyword}>
            {word}
          </span>
        )
      } else if (i < line.length && line.slice(i).trimStart().startsWith('(')) {
        nodes.push(
          <span key={`fn-${i}`} className={tokenStyles.function}>
            {word}
          </span>
        )
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        nodes.push(
          <span key={`type-${i}`} className={tokenStyles.type}>
            {word}
          </span>
        )
      } else {
        nodes.push(
          <span key={`var-${i}`} className={tokenStyles.variable}>
            {word}
          </span>
        )
      }
      continue
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:;]/.test(char)) {
      nodes.push(
        <span key={`op-${i}`} className={tokenStyles.operator}>
          {char}
        </span>
      )
      i++
      continue
    }

    // Default character
    nodes.push(
      <span key={`plain-${i}`} className="text-gray-300">
        {char}
      </span>
    )
    i++
  }

  return nodes
}

export function CarbonCodeBlock({
  code,
  language = 'javascript',
  theme = 'trackr',
  title,
  showLineNumbers = true,
  className = ''
}: CarbonCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const activeThemeKey: CarbonTheme = (theme in THEME_CONFIGS) 
    ? (theme as CarbonTheme) 
    : 'trackr'
  const currentTheme = THEME_CONFIGS[activeThemeKey]

  const cleanCode = (code || '').trimEnd()
  const lines = cleanCode.split('\n')
  const langKey = language.toLowerCase()
  const displayLang = LANGUAGE_LABELS[langKey] || language.toUpperCase() || 'CODE'

  const isCollapsible = lines.length > 9

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(cleanCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Failed to copy code:', err)
    }
  }

  return (
    <div 
      className={`my-2 rounded-xl p-1.5 sm:p-2 shadow-md select-none ${currentTheme.outerBg} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Carbon Window */}
      <div className={`rounded-lg shadow-lg overflow-hidden backdrop-blur-md ${currentTheme.windowBg}`}>
        {/* macOS Style Window Header */}
        <div className="flex items-center justify-between px-3 py-1.5 sm:py-2 border-b border-white/10 bg-black/25 select-none">
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-xs inline-block" />
          </div>

          {/* Window Title / Filename */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-300 dark:text-gray-300 truncate max-w-[180px] sm:max-w-[280px]">
            {title ? (
              <span>{title}</span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400">
                <Terminal className="w-3 h-3" />
                <span>{displayLang}</span>
              </span>
            )}
          </div>

          {/* Right Action: Language Badge & One-Click Copy */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">
              {displayLang}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded transition-all duration-150 cursor-pointer ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 active:scale-95'
              }`}
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Viewport with Horizontal Scroll & Optimistic Max Height */}
        <div className="relative">
          <div 
            className={`p-2.5 sm:p-3 overflow-x-auto text-[12px] sm:text-[12.5px] font-mono leading-[1.48] select-text no-scrollbar transition-all duration-200 ${
              isCollapsible && !isExpanded 
                ? 'max-h-[220px] overflow-hidden' 
                : 'max-h-[500px] overflow-y-auto'
            }`}
          >
            <table className="border-collapse w-full">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={`line-${idx}`} className="hover:bg-white/[0.03] transition-colors">
                    {showLineNumbers && (
                      <td className="pr-2.5 pl-0.5 py-[1px] text-right select-none text-gray-500/50 text-[10px] w-[26px] font-mono align-top">
                        {idx + 1}
                      </td>
                    )}
                    <td className="py-[1px] whitespace-pre font-mono text-gray-200 break-normal">
                      {tokenizeLine(line, langKey, currentTheme.tokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fade mask when collapsed */}
          {isCollapsible && !isExpanded && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand / Collapse Footer Toggle for Longer Snippets */}
        {isCollapsible && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-1.5 px-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-white bg-black/35 hover:bg-black/50 border-t border-white/5 transition-colors cursor-pointer select-none"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse snippet</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show more ({lines.length} lines)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
