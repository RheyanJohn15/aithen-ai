'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme/theme-provider';

export interface MessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  isLast?: boolean;
}

export default function Message({ id, role, content, isLoading = false, isLast = false }: MessageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isEmpty = !content.trim();
  const showBorder = !isLast && !(isEmpty && isLoading && role === 'assistant');

  return (
    <div
      className={`flex gap-3 py-4 ${
        showBorder ? 'border-b border-gray-200/60 dark:border-gray-700/60' : ''
      } ${
        role === 'user' ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
          role === 'user'
            ? 'bg-[var(--color-aithen-teal)] text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}
      >
        {role === 'user' ? 'U' : 'A'}
      </div>

      {/* Message content */}
      <div className={`flex-1 ${role === 'user' ? 'text-right' : ''}`}>
        {isEmpty && isLoading && role === 'assistant' ? (
          <TypingIndicator />
        ) : isEmpty ? null : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-p:text-sm prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-[var(--color-aithen-teal)] dark:prose-code:text-[var(--color-aithen-teal-light)] prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200/60 dark:prose-pre:border-gray-700/60">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Code blocks
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return !inline && language ? (
                    <CodeBlock language={language} code={String(children).replace(/\n$/, '')} isDark={isDark} />
                  ) : (
                    <code
                      className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] font-mono text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Headings
                h1: ({ children }) => (
                  <h1 className="text-lg font-semibold font-heading text-gray-900 dark:text-white mt-3 mb-1.5">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold font-heading text-gray-900 dark:text-white mt-2.5 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold font-heading text-gray-900 dark:text-white mt-2 mb-1">
                    {children}
                  </h3>
                ),
                // Paragraphs
                p: ({ children }) => (
                  <p className="text-sm text-gray-900 dark:text-gray-100 mb-1.5 leading-relaxed">
                    {children}
                  </p>
                ),
                // Lists
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 text-gray-900 dark:text-gray-100 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 text-gray-900 dark:text-gray-100 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-900 dark:text-gray-100">{children}</li>
                ),
                // Links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] hover:underline text-sm"
                  >
                    {children}
                  </a>
                ),
                // Blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300/60 dark:border-gray-600/60 pl-3 italic text-sm text-gray-700 dark:text-gray-300 my-1.5">
                    {children}
                  </blockquote>
                ),
                // Tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100/80 dark:bg-gray-800/80">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-gray-200/60 dark:divide-gray-700/60">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-1.5 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200/60 dark:border-gray-700/60">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200/60 dark:border-gray-700/60">
                    {children}
                  </td>
                ),
                // Horizontal rule
                hr: () => (
                  <hr className="my-3 border-gray-200/60 dark:border-gray-700/60" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ language, code, isDark }: { language: string; code: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const languageLabels: Record<string, string> = {
    js: 'JavaScript',
    jsx: 'JSX',
    ts: 'TypeScript',
    tsx: 'TSX',
    py: 'Python',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    php: 'PHP',
    rb: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    swift: 'Swift',
    kt: 'Kotlin',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    md: 'Markdown',
    sh: 'Shell',
    bash: 'Bash',
    zsh: 'Zsh',
    powershell: 'PowerShell',
    dockerfile: 'Dockerfile',
    docker: 'Docker',
  };

  const languageLabel = languageLabels[language.toLowerCase()] || language.toUpperCase();

  return (
    <div className="relative my-1.5 rounded-lg overflow-hidden border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/80">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700/60">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 font-mono">
          {languageLabel}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={isDark ? vscDarkPlus : vs}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            fontSize: '0.8125rem',
            background: 'transparent',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex space-x-1">
      <div
        className="w-1.5 h-1.5 bg-[var(--color-aithen-teal)] dark:bg-[var(--color-aithen-teal-light)] rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-1.5 h-1.5 bg-[var(--color-aithen-teal)] dark:bg-[var(--color-aithen-teal-light)] rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="w-1.5 h-1.5 bg-[var(--color-aithen-teal)] dark:bg-[var(--color-aithen-teal-light)] rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

