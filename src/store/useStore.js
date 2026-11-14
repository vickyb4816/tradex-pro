import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Theme
  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  // Timezone
  timezone: 'Asia/Kolkata',
  setTimezone: (tz) => set({ timezone: tz }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  // Active market
  activeMarket: 'crypto', // 'crypto' | 'indian'
  setActiveMarket: (m) => set({ activeMarket: m }),

  // Selected symbol
  selectedSymbol: { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto' },
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),

  // Timeframe
  timeframe: '1h',
  setTimeframe: (tf) => set({ timeframe: tf }),

  // Live prices
  prices: {},
  updatePrice: (symbol, data) => set(s => ({ prices: { ...s.prices, [symbol]: data } })),
  setBulkPrices: (data) => set(s => ({ prices: { ...s.prices, ...data } })),

  // Screener results
  screenerResults: [],
  setScreenerResults: (r) => set({ screenerResults: r }),
  screenerFilters: { market: 'crypto', rsiMin: 0, rsiMax: 100, volumeMin: 0, changeMin: -100, changeMax: 100 },
  setScreenerFilters: (f) => set(s => ({ screenerFilters: { ...s.screenerFilters, ...f } })),

  // Paper Trading
  paperBalance: 100000,
  paperPositions: [],
  paperHistory: [],
  setPaperBalance: (b) => set({ paperBalance: b }),
  addPaperPosition: (p) => set(s => ({ paperPositions: [...s.paperPositions, p] })),
  removePaperPosition: (id) => set(s => ({ paperPositions: s.paperPositions.filter(p => p.id !== id) })),
  addPaperTrade: (t) => set(s => ({ paperHistory: [...s.paperHistory, t] })),
  resetPaperTrading: () => set({ paperBalance: 100000, paperPositions: [], paperHistory: [] }),

  // Algo Trading
  algoRunning: false,
  algoConfig: { broker: 'Binance', apiKey: '', secretKey: '', strategy: 'RSI Oversold', symbol: 'BTCUSDT', market: 'crypto', riskPerTrade: 1.5, maxDailyTrades: 10 },
  algoLogs: [],
  setAlgoRunning: (r) => set({ algoRunning: r }),
  setAlgoConfig: (c) => set(s => ({ algoConfig: { ...s.algoConfig, ...c } })),
  setAlgoLogs: (logs) => set({ algoLogs: logs }),
  addAlgoLog: (l) => set(s => ({ algoLogs: [l, ...s.algoLogs].slice(0, 500) })),
  clearAlgoLogs: () => set({ algoLogs: [] }),

  // Chatbot
  chatMessages: [{ role: 'assistant', content: 'Welcome to TradeX Pro! I\'m your AI trading advisor. Ask me about market analysis, strategies, technical indicators, or trade suggestions for Indian stocks and crypto markets. 🚀', timestamp: Date.now() }],
  addChatMessage: (m) => set(s => ({ chatMessages: [...s.chatMessages, { ...m, timestamp: Date.now() }] })),
  clearChat: () => set({ chatMessages: [] }),

  // News
  news: [],
  setNews: (n) => set({ news: n }),

  // Strategies
  activeStrategy: null,
  setActiveStrategy: (s) => set({ activeStrategy: s }),
  backtestResults: null,
  setBacktestResults: (r) => set({ backtestResults: r }),

  // Pine scripts
  pineScripts: [],
  activePineScript: '',
  setPineScripts: (s) => set({ pineScripts: s }),
  setActivePineScript: (s) => set({ activePineScript: s }),

  // Watchlist
  watchlist: [
    { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto' },
    { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto' },
    { symbol: 'RELIANCE.NS', name: 'Reliance', type: 'indian' },
    { symbol: 'TCS.NS', name: 'TCS', type: 'indian' },
    { symbol: 'INFY.NS', name: 'Infosys', type: 'indian' },
  ],
  addToWatchlist: (item) => set(s => ({ watchlist: [...s.watchlist.filter(w => w.symbol !== item.symbol), item] })),
  removeFromWatchlist: (symbol) => set(s => ({ watchlist: s.watchlist.filter(w => w.symbol !== symbol) })),

  // Notifications
  notifications: [],
  addNotification: (n) => set(s => ({ notifications: [{ ...n, id: Date.now(), read: false }, ...s.notifications].slice(0, 50) })),
  markNotificationRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
}))
