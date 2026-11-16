import { useStore } from '../store/useStore'
import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { generateAdvisorResponse } from '../services/advisorEngine'
import {
  Send,
  Bot,
  User,
  Trash2,
  Sparkles,
  TrendingUp,
  Target,
  Shield,
  BarChart3,
  Lightbulb,
  Mic,
  Zap
} from 'lucide-react'

// Quick actions list for the left sidebar
const quickActions = [
  { label: '🚀 Start Auto Bot (Paper)', prompt: 'Start auto trading bot with RSI strategy on Paper Trading', icon: Zap },
  { label: '🛑 Stop Auto Bot', prompt: 'Stop auto trading bot', icon: Shield },
  { label: '🛒 Buy 0.05 BTC (Paper)', prompt: 'Buy 0.05 BTC', icon: TrendingUp },
  { label: '🛒 Buy 10 Reliance (Paper)', prompt: 'Buy 10 Reliance', icon: BarChart3 },
  { label: '📊 Bot Status & Balance', prompt: 'Check bot status and paper balance', icon: Bot },
  { label: '⚡ Buy Signals', prompt: 'What are current buy signals?', icon: TrendingUp },
  { label: '🎯 Best Strategies', prompt: 'What are the best trading strategies?', icon: Target },
  { label: '🛡️ Risk Management', prompt: 'How to manage risk?', icon: Shield },
]

// Suggested prompts above the input field
const suggestedPrompts = [
  { label: '🚀 Start Auto Bot', prompt: 'Start auto trading bot with RSI strategy on Paper Trading' },
  { label: '🛑 Stop Bot', prompt: 'Stop auto trading bot' },
  { label: '🛒 Buy 0.05 BTC', prompt: 'Buy 0.05 BTC' },
  { label: '🛒 Buy 10 Reliance', prompt: 'Buy 10 Reliance' },
  { label: '📊 Bot Status & Balance', prompt: 'Check bot status and paper balance' },
  { label: '⚡ Buy Signals', prompt: 'What are current buy signals?' },
]

// Helper function to render text with bold formatting (split on **)
function renderMarkdownLine(text) {
  if (!text) return null
  const parts = text.split('**')
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// Markdown-like message renderer supporting ** for bold and - / * for bullets
function MarkdownMessage({ content }) {
  if (!content) return null
  const lines = content.split('\n')

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-gray-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-2" />
        }

        // Bullet point using '-' or '*'
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[-*]\s+/, '')
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-primary-400 font-bold leading-5 select-none">•</span>
              <div className="flex-1">{renderMarkdownLine(bulletText)}</div>
            </div>
          )
        }

        // Numbered list: "1. ", "2. ", etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-primary-400 font-semibold text-xs mt-0.5 w-4 text-right flex-shrink-0 select-none">
                {numMatch[1]}.
              </span>
              <div className="flex-1">{renderMarkdownLine(numMatch[2])}</div>
            </div>
          )
        }

        // Regular line
        return (
          <div key={idx} className="leading-relaxed">
            {renderMarkdownLine(line)}
          </div>
        )
      })}
    </div>
  )
}

// Format message timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (err) {
    return ''
  }
}

export default function Chatbot() {
  const {
    chatMessages,
    addChatMessage,
    clearChat,
    activeMarket,
    selectedSymbol,
    algoRunning,
    algoConfig,
    setAlgoRunning,
    setAlgoConfig,
    addAlgoLog,
    paperBalance,
    setPaperBalance,
    prices
  } = useStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom of message list on updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isTyping])

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim()
    if (!messageText || isTyping) return

    // 1. Add user message to store
    addChatMessage({
      role: 'user',
      content: messageText,
    })

    setInput('')
    setIsTyping(true)

    const lower = messageText.toLowerCase()

    // ----------------------------------------------------
    // A. INTERCEPT: AUTO-TRADE BOT START / LAUNCH
    // ----------------------------------------------------
    if (
      lower.includes('start bot') ||
      lower.includes('start auto') ||
      lower.includes('start algo') ||
      lower.includes('launch bot') ||
      lower.includes('run bot') ||
      lower.includes('start trading bot')
    ) {
      let targetMarket = activeMarket || 'crypto'
      let targetSymbol = selectedSymbol?.symbol || (targetMarket === 'crypto' ? 'BTCUSDT' : 'RELIANCE.NS')

      if (lower.includes('reliance') || lower.includes('tcs') || lower.includes('nifty') || lower.includes('indian')) {
        targetMarket = 'indian'
        targetSymbol = lower.includes('tcs') ? 'TCS.NS' : lower.includes('nifty') ? '^NSEI' : 'RELIANCE.NS'
      } else if (lower.includes('btc') || lower.includes('bitcoin') || lower.includes('crypto')) {
        targetMarket = 'crypto'
        targetSymbol = 'BTCUSDT'
      } else if (lower.includes('eth')) {
        targetMarket = 'crypto'
        targetSymbol = 'ETHUSDT'
      } else if (lower.includes('sol')) {
        targetMarket = 'crypto'
        targetSymbol = 'SOLUSDT'
      }

      let strat = 'RSI Oversold'
      if (lower.includes('macd')) strat = 'MACD Crossover'
      else if (lower.includes('ema')) strat = 'EMA 9/21 Dynamic Cross'
      else if (lower.includes('bollinger')) strat = 'Bollinger Band Squeeze'
      else if (lower.includes('supertrend')) strat = 'Supertrend + VWAP'

      const isCrypto = targetMarket === 'crypto'
      const tradeAmt = isCrypto ? 1000 : 25000
      const lev = isCrypto ? 10 : 1
      const marginReq = isCrypto ? 100 : 25000
      const qty = isCrypto ? 0.05 : 10

      const configPayload = {
        broker: 'PaperTrade',
        apiKey: '',
        secretKey: '',
        strategy: strat,
        symbol: targetSymbol,
        market: targetMarket,
        riskPerTrade: 1.5,
        maxDailyTrades: 10,
        isDemo: true,
        tradeAmount: tradeAmt,
        leverage: lev,
        marginRequired: marginReq,
        quantity: qty
      }

      try {
        await api.startAlgoTrade(configPayload)
      } catch (err) {
        console.warn('Backend start algo fallback:', err)
      }

      setAlgoRunning(true)
      if (setAlgoConfig) setAlgoConfig(configPayload)
      if (addAlgoLog) {
        addAlgoLog({
          id: String(Date.now()),
          type: 'INFO',
          message: `🚀 Auto Bot started via Chatbot: ${strat} on ${targetSymbol} (Paper Trading Mode • Zero API Keys)`,
          timestamp: new Date().toLocaleTimeString(),
        })
      }

      const responseText = `🚀 **Auto-Trading Bot Activated Successfully!**\n\n` +
        `The automated trading engine is now **actively monitoring and executing trades** in **Paper Trading Mode** with zero API keys required.\n\n` +
        `### 🤖 Active Bot Telemetry:\n` +
        `- **Broker Gateway:** \`📄 Paper Trading Engine\` (Zero API Key • 100% Risk Free)\n` +
        `- **Active Symbol:** \`${targetSymbol}\`\n` +
        `- **Strategy:** \`${strat}\`\n` +
        `- **Market Mode:** \`${targetMarket.toUpperCase()}\`\n` +
        `- **Trade Sizing & Margin:** ${
          isCrypto
            ? `**$${tradeAmt.toLocaleString()} Total Trade Amount** | **${lev}x Leverage** | **$${marginReq.toLocaleString()} Margin Required**`
            : `**₹${tradeAmt.toLocaleString()} Cash Equity (${qty} shares)** | **100% Cash Covered (No Margin Needed)**`
        }\n` +
        `- **Virtual Balance Available:** \`₹${(paperBalance || 100000).toLocaleString()}\`\n\n` +
        `🟢 **Live Status:** Ticks are scanned every 3 seconds for ${strat} signals. Simulated buy/sell triggers will automatically log and update your portfolio.\n\n` +
        `💡 *Type \`Stop Bot\` anytime to pause execution, or ask me for \`Bot Status\`!*`

      addChatMessage({
        role: 'assistant',
        content: responseText,
        confidence: 0.98,
      })
      setIsTyping(false)
      inputRef.current?.focus()
      return
    }

    // ----------------------------------------------------
    // B. INTERCEPT: AUTO-TRADE BOT STOP
    // ----------------------------------------------------
    if (
      lower.includes('stop bot') ||
      lower.includes('stop auto') ||
      lower.includes('stop algo') ||
      lower.includes('halt bot') ||
      lower.includes('pause bot') ||
      lower.includes('kill bot')
    ) {
      try {
        await api.stopAlgoTrade()
      } catch (err) {
        console.warn('Backend stop algo fallback:', err)
      }

      setAlgoRunning(false)
      if (addAlgoLog) {
        addAlgoLog({
          id: String(Date.now()),
          type: 'TRADE',
          message: `🛑 Auto Bot stopped via Chatbot command. Algorithmic triggers paused.`,
          timestamp: new Date().toLocaleTimeString(),
        })
      }

      const responseText = `🛑 **Auto-Trading Bot Stopped.**\n\n` +
        `The automated execution loop has been paused.\n\n` +
        `- **Algorithmic Scanning:** Suspended\n` +
        `- **Open Paper Positions:** Retained safely in portfolio\n` +
        `- **Broker Engine:** Standby\n\n` +
        `💡 *Type \`Start Bot\` or click \`🚀 Start Auto Bot\` anytime to resume automated trading!*`

      addChatMessage({
        role: 'assistant',
        content: responseText,
        confidence: 0.98,
      })
      setIsTyping(false)
      inputRef.current?.focus()
      return
    }

    // ----------------------------------------------------
    // C. INTERCEPT: INSTANT PAPER TRADE VIA CHAT (BUY / SELL)
    // ----------------------------------------------------
    const tradeMatch = lower.match(/^(buy|sell|long|short)\s+([0-9.]+)?\s*([a-zA-Z0-9^._-]+)/i)
    if (tradeMatch) {
      const actionRaw = tradeMatch[1].toLowerCase()
      const side = (actionRaw === 'sell' || actionRaw === 'short') ? 'sell' : 'buy'
      let rawQty = parseFloat(tradeMatch[2])
      let rawSymbol = tradeMatch[3].toUpperCase()

      // Normalize symbol
      let sym = rawSymbol
      let isCrypto = true

      if (rawSymbol.includes('BTC') || rawSymbol === 'BITCOIN') {
        sym = 'BTCUSDT'
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 0.05
      } else if (rawSymbol.includes('ETH') || rawSymbol === 'ETHEREUM') {
        sym = 'ETHUSDT'
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 0.5
      } else if (rawSymbol.includes('SOL')) {
        sym = 'SOLUSDT'
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 5
      } else if (rawSymbol.includes('RELIANCE')) {
        sym = 'RELIANCE.NS'
        isCrypto = false
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 10
      } else if (rawSymbol.includes('TCS')) {
        sym = 'TCS.NS'
        isCrypto = false
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 10
      } else if (rawSymbol.includes('INFY')) {
        sym = 'INFY.NS'
        isCrypto = false
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 15
      } else if (rawSymbol.includes('.NS') || rawSymbol.includes('.BO')) {
        isCrypto = false
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 10
      } else {
        if (isNaN(rawQty) || rawQty <= 0) rawQty = 0.05
      }

      // Determine price
      const livePriceObj = prices[sym]
      let price = livePriceObj?.lastPrice || livePriceObj?.price
      if (!price) {
        if (sym === 'BTCUSDT') price = 64250
        else if (sym === 'ETHUSDT') price = 3480
        else if (sym === 'SOLUSDT') price = 186
        else if (sym === 'RELIANCE.NS') price = 2960
        else if (sym === 'TCS.NS') price = 3880
        else if (sym === 'INFY.NS') price = 1890
        else price = isCrypto ? 100 : 1500
      }
      price = Number(price)

      const totalValue = Number((rawQty * price).toFixed(2))
      const leverage = isCrypto ? 10 : 1
      const marginRequired = isCrypto ? Number((totalValue / leverage).toFixed(2)) : totalValue
      const currencySymbol = isCrypto ? '$' : '₹'

      // Execute paper trade
      let newBalance = paperBalance || 100000
      try {
        const tradeRes = await api.savePaperTrade({
          symbol: sym,
          type: isCrypto ? 'crypto' : 'indian',
          side,
          quantity: rawQty,
          entry_price: price,
          strategy: 'Chatbot AI Direct Order'
        })
        if (tradeRes && tradeRes.balance !== undefined) {
          newBalance = tradeRes.balance
          setPaperBalance(newBalance)
        } else {
          newBalance = side === 'buy' ? Math.max(0, newBalance - marginRequired) : newBalance + totalValue
          setPaperBalance(newBalance)
        }
      } catch (tradeErr) {
        console.warn('Direct chat paper trade error:', tradeErr)
        newBalance = side === 'buy' ? Math.max(0, newBalance - marginRequired) : newBalance + totalValue
        setPaperBalance(newBalance)
      }

      const responseText = `✅ **Paper Trade Executed Instantly via Chatbot!**\n\n` +
        `### 📋 Execution Order Ticket:\n` +
        `- **Order ID:** \`#TRD-${Math.floor(100000 + Math.random() * 900000)}\`\n` +
        `- **Action / Side:** \`${side.toUpperCase()} (${side === 'buy' ? 'LONG' : 'SHORT'})\`\n` +
        `- **Symbol:** \`${sym}\`\n` +
        `- **Quantity Filled:** \`${rawQty}\`\n` +
        `- **Execution Price:** \`${currencySymbol}${price.toLocaleString()}\`\n` +
        `- **Total Order Value:** \`${currencySymbol}${totalValue.toLocaleString()}\`\n` +
        `- **${isCrypto ? 'Margin Required (10x Leverage)' : 'Cash Equity Sizing (No Margin Needed)'}:** \`${currencySymbol}${marginRequired.toLocaleString()}\`\n` +
        `- **Remaining Virtual Balance:** \`₹${Math.round(newBalance).toLocaleString()}\`\n\n` +
        `📊 *Your order is now live and tracked in the Paper Trading module with real-time P&L calculations.*`

      addChatMessage({
        role: 'assistant',
        content: responseText,
        confidence: 0.99,
      })
      setIsTyping(false)
      inputRef.current?.focus()
      return
    }

    // ----------------------------------------------------
    // D. INTERCEPT: BOT STATUS & BALANCE QUERY
    // ----------------------------------------------------
    if (
      lower.includes('bot status') ||
      lower.includes('algo status') ||
      lower.includes('check bot') ||
      lower.includes('paper balance') ||
      lower.includes('my balance') ||
      lower.includes('trading balance')
    ) {
      const responseText = `📊 **TradeX Pro Live Telemetry & Bot Status:**\n\n` +
        `### 🤖 Algorithmic Auto Bot:\n` +
        `- **Status:** ${algoRunning ? '🟢 **RUNNING (Actively Scanning & Trading)**' : '🔴 **STOPPED (Standby)**'}\n` +
        `- **Active Strategy:** \`${algoConfig?.strategy || 'RSI Oversold'}\`\n` +
        `- **Active Symbol:** \`${algoConfig?.symbol || (activeMarket === 'crypto' ? 'BTCUSDT' : 'RELIANCE.NS')}\`\n` +
        `- **Execution Engine:** \`${algoConfig?.broker || 'Paper Trading (Zero API Key Needed)'}\`\n\n` +
        `### 💼 Paper Trading Account:\n` +
        `- **Available Virtual Balance:** \`₹${(paperBalance || 100000).toLocaleString()}\`\n` +
        `- **Margin Model:**\n` +
        `  • **Crypto:** Total Amount & Margin Required (\`Margin = Total / Leverage\`)\n` +
        `  • **Indian Stocks:** 100% Cash Equity (No margin needed)\n\n` +
        `💡 *Commands you can use:*\n` +
        `- *"Start auto trading bot on BTC"* or *"Start bot on Reliance"*\n` +
        `- *"Stop auto trading bot"*\n` +
        `- *"Buy 0.1 BTC"* or *"Buy 25 Reliance"*`

      addChatMessage({
        role: 'assistant',
        content: responseText,
        confidence: 0.98,
      })
      setIsTyping(false)
      inputRef.current?.focus()
      return
    }

    try {
      const context = {
        market: activeMarket,
        symbol: selectedSymbol?.symbol || (activeMarket === 'crypto' ? 'BTCUSDT' : 'RELIANCE.NS'),
      }

      // 2. Call chatbot API endpoint
      const res = await api.sendChatMessage(messageText, context)

      // 3. Add bot response to store
      addChatMessage({
        role: 'assistant',
        content: res.response || "I received your query, but could not formulate a response.",
        confidence: res.confidence ?? 0.94,
      })
    } catch (error) {
      console.warn('Chatbot primary route error, using local AI engine fallback:', error)
      const fallbackResult = generateAdvisorResponse(messageText, {
        market: activeMarket,
        symbol: selectedSymbol?.symbol || (activeMarket === 'crypto' ? 'BTCUSDT' : 'RELIANCE.NS')
      })
      addChatMessage({
        role: 'assistant',
        content: fallbackResult.response,
        confidence: fallbackResult.confidence ?? 0.92,
      })
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSendMessage(input)
  }

  // Voice recognition toggle using Web Speech API
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
        inputRef.current?.focus()
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognition.start()
    } catch (err) {
      console.error('Speech recognition error:', err)
      setIsListening(false)
    }
  }

  return (
    <div
      className="flex gap-4 w-full h-[calc(100vh-120px)]"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      {/* Left Sidebar (w-64) */}
      <aside className="w-64 hidden lg:flex flex-col bg-dark-900/80 backdrop-blur-md border border-gray-800/60 rounded-xl p-3 flex-shrink-0 shadow-lg justify-between">
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-800/60 px-1">
            <div className="p-1 rounded-md bg-primary-500/10 text-primary-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Quick Actions</h3>
              <p className="text-[11px] text-gray-500">Instant AI advisory prompts</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="overflow-y-auto space-y-1.5 pr-1 pt-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => handleSendMessage(action.prompt)}
                  disabled={isTyping}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-300 bg-dark-800/60 hover:bg-dark-800 hover:text-white border border-gray-800 hover:border-primary-500/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-1.5 rounded-md bg-dark-700/80 text-primary-400 group-hover:text-primary-300 group-hover:bg-primary-500/10 transition-colors flex-shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-medium text-gray-200 group-hover:text-white">{action.label}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-3 border-t border-gray-800/60 px-1">
          <div className="bg-dark-800/50 rounded-lg p-2.5 border border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Context:</span>
            <span className="font-semibold capitalize text-primary-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {activeMarket || 'Crypto'} Mode
            </span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area (flex-1) */}
      <section className="flex-1 flex flex-col h-full bg-dark-900/80 backdrop-blur-md border border-gray-800/60 rounded-xl overflow-hidden shadow-xl">
        {/* Chat Area Header */}
        <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between bg-dark-900/50">
          <div className="flex items-center gap-3">
            {/* Bot Avatar with Gradient Glow */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-xl blur-xs opacity-75 animate-pulse-slow"></div>
              <div className="relative w-9 h-9 rounded-xl bg-dark-900 border border-purple-500/40 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <Bot className="w-5 h-5 text-primary-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">AI Trading Advisor</h2>
                <span className="badge-green text-[10px] py-0.5 px-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-400">Algorithmic setups, technical indicators & risk management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Message List (Scrollable container) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="relative mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-60 animate-pulse-slow"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-dark-900 border border-purple-500/40 flex items-center justify-center text-primary-400 shadow-xl">
                  <Bot className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">TradeX AI Trading Advisor</h3>
              <p className="text-sm max-w-md text-gray-400 mb-6">
                Ask about market trends, technical setups, risk sizing, or live indicator signals.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
                {quickActions.slice(0, 4).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-dark-800/80 hover:bg-dark-800 border border-gray-700/60 hover:border-primary-500/40 text-left text-xs text-gray-200 transition-all group"
                  >
                    <action.icon className="w-4 h-4 text-primary-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="font-medium group-hover:text-white truncate">{action.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isBot = msg.role === 'assistant'
              return (
                <div key={index} className="animate-fadeIn">
                  {isBot ? (
                    // Bot Message
                    <div className="flex items-start gap-3">
                      {/* Bot Avatar with Gradient Glow */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-xl blur-xs opacity-75"></div>
                        <div className="relative w-8 h-8 rounded-xl bg-dark-900 border border-purple-500/40 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                          <Bot className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="max-w-[85%] md:max-w-[75%] bg-dark-800 border border-gray-700/50 rounded-2xl rounded-tl-sm p-4 shadow-lg">
                        {/* Markdown Formatting Content */}
                        <MarkdownMessage content={msg.content} />

                        {/* Bot Message Footer: Confidence Score Badge & Timestamp */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-750 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              (msg.confidence ?? 0.92) >= 0.9
                                ? 'badge-green'
                                : (msg.confidence ?? 0.92) >= 0.75
                                ? 'badge-blue'
                                : 'badge-yellow'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {Math.round((msg.confidence ?? 0.92) * 100)}% Confidence
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // User Message
                    <div className="flex items-start justify-end gap-3">
                      <div className="max-w-[80%] md:max-w-[70%] bg-primary-600/20 border border-primary-500/30 rounded-2xl rounded-tr-sm p-3.5 shadow-md">
                        <p className="text-sm text-gray-100 whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex justify-end mt-1.5">
                          <span className="text-[11px] text-primary-300/70">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-300 flex-shrink-0 mt-0.5 shadow-md">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 animate-fadeIn">
              <div className="relative flex-shrink-0 mt-0.5">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-xl blur-xs opacity-75 animate-pulse"></div>
                <div className="relative w-8 h-8 rounded-xl bg-dark-900 border border-purple-500/40 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-dark-800 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-gray-400 ml-1">AI advisor is analyzing market data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area at Bottom */}
        <div className="p-3 border-t border-gray-800/60 bg-dark-900/60">
          {/* Suggested Prompts Row */}
          <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1 flex-shrink-0">
              <Lightbulb className="w-3 h-3 text-yellow-400" />
              Suggested:
            </span>
            {suggestedPrompts.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isTyping}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-dark-800 hover:bg-dark-750 text-gray-300 hover:text-white border border-gray-700/60 hover:border-primary-500/40 text-xs transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Input & Action Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Clear Chat Button */}
            <button
              type="button"
              onClick={clearChat}
              title="Clear conversation"
              className="p-2.5 bg-dark-800 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-gray-700/60 hover:border-red-500/30 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Listening... click to stop' : 'Voice input'}
              className={`p-2.5 rounded-lg border transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                  : 'bg-dark-800 hover:bg-dark-750 text-gray-400 hover:text-white border-gray-700/60 hover:border-primary-500/30'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening to voice input...' : 'Ask AI advisor (e.g. "What are current buy signals?")...'}
                className="input-field"
                disabled={isTyping}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
