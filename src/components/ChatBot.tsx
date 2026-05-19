import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isSystem?: boolean
}

const QUICK_QUESTIONS = [
  'ヒヤリハットの記録方法を教えて',
  '複数のスタッフで使うには？',
  '午睡チェックの使い方は？',
  'データはどこに保存されますか？',
]

const GREETING: Message = {
  role: 'assistant',
  content: 'こんにちは！まもりすとサポートBotです🛡️\n\n使い方でわからないことがあれば、なんでも聞いてください！\nよくある質問はボタンからも選べます。',
  isSystem: true,
}

export const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // パネルを開いたとき未読バッジを消す
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasNewMessage(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // GREETING はAPIに送らない（システムプロンプト側で対応済み）
      const history = newMessages.filter((m) => !m.isSystem)
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const botMsg: Message = { role: 'assistant', content: data.reply }
      setMessages((prev) => [...prev, botMsg])
      if (!open) setHasNewMessage(true)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '申し訳ありません、一時的にエラーが発生しました。\nしばらく経ってから再度お試しいただくか、お問い合わせフォームよりご連絡ください。',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* チャットパネル */}
      {open && (
        <div className="fixed bottom-[88px] right-4 z-[55] w-[min(340px,calc(100vw-32px))] sm:w-[380px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
             style={{ maxHeight: 'calc(100vh - 120px)' }}>

          {/* ヘッダー */}
          <div className="bg-blue-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <div>
                <div className="text-white font-bold text-sm leading-tight">まもりすとサポートBot</div>
                <div className="text-blue-200 text-xs">使い方はなんでも聞いてください</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
                    className="text-blue-200 hover:text-white transition-colors p-1 rounded">
              <X size={18} />
            </button>
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <span className="text-lg mr-2 mt-0.5 shrink-0">🛡️</span>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* ローディング */}
            {loading && (
              <div className="flex justify-start">
                <span className="text-lg mr-2 mt-0.5">🛡️</span>
                <div className="bg-white border border-gray-100 shadow-sm px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-gray-400 text-sm">考え中...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* クイック質問（メッセージが初期のみ表示） */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 shrink-0">
              <p className="text-xs text-gray-400 mb-2">よくある質問</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q}
                          onClick={() => sendMessage(q)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 個人情報注意 */}
          <div className="px-3 pt-2 pb-0 bg-white shrink-0">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-relaxed">
              ⚠️ 園児名・職員名などの個人情報は入力しないでください（外部AIに送信されます）
            </p>
          </div>

          {/* 入力エリア */}
          <div className="px-3 py-3 border-t-0 bg-white shrink-0 flex gap-2 items-end pt-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="質問を入力（Enterで送信）"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed"
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="送信"
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2 transition-colors shrink-0">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* フローティングボタン */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[88px] right-4 z-[55] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-2xl transition-all flex items-center gap-2 px-4 py-3"
        aria-label="サポートチャットを開く"
      >
        {open ? (
          <ChevronDown size={20} />
        ) : (
          <>
            <MessageCircle size={20} />
            <span className="text-sm font-bold">使い方を聞く</span>
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">1</span>
            )}
          </>
        )}
      </button>
    </>
  )
}
