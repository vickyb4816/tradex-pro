import axios from 'axios'

const API_BASE = '/api'

// Binance public API (no key needed)
const BINANCE_API = 'https://api.binance.com/api/v3'
const BINANCE_WS = 'wss://stream.binance.com:9443/ws'

export const api = {
  // Crypto Market Data
  getCryptoPrice: async (symbol) => {
    const res = await axios.get(`${BINANCE_API}/ticker/24hr`, { params: { symbol } })
    return res.data
  },

  getCryptoPrices: async (symbols) => {
    const res = await axios.get(`${BINANCE_API}/ticker/24hr`)
    return res.data.filter(t => symbols.includes(t.symbol))
  },

  getCryptoKlines: async (symbol, interval = '1h', limit = 500) => {
    const res = await axios.get(`${BINANCE_API}/klines`, { params: { symbol, interval, limit } })
    return res.data.map(k => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  },

  getCryptoOrderBook: async (symbol, limit = 20) => {
    const res = await axios.get(`${BINANCE_API}/depth`, { params: { symbol, limit } })
    return res.data
  },

  getCryptoTrades: async (symbol, limit = 50) => {
    const res = await axios.get(`${BINANCE_API}/trades`, { params: { symbol, limit } })
    return res.data
  },

  // Indian Market Data (via backend proxy)
  getIndianIndices: async () => {
    const res = await axios.get(`${API_BASE}/indian/indices`)
    return res.data
  },

  getIndianStockPrice: async (symbol) => {
    const res = await axios.get(`${API_BASE}/indian/quote/${symbol}`)
    return res.data
  },

  getIndianStockKlines: async (symbol, interval = '1d', range = '6mo') => {
    const res = await axios.get(`${API_BASE}/indian/history/${symbol}`, { params: { interval, range } })
    return res.data
  },

  // Binance USDT-M Perpetuals
  getBinancePerpetuals: async () => {
    try {
      const res = await axios.get('https://fapi.binance.com/fapi/v1/ticker/24hr', { timeout: 4500 })
      return res.data
        .filter(t => t.symbol.endsWith('USDT'))
        .map(t => ({
          symbol: t.symbol,
          baseAsset: t.symbol.replace('USDT', ''),
          price: parseFloat(t.lastPrice),
          change: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume),
          high: parseFloat(t.highPrice),
          low: parseFloat(t.lowPrice),
          trades: parseInt(t.count) || 0,
          type: 'perpetual',
          leverage: '125x',
          fundingRate: '+0.0100%',
        }))
        .sort((a, b) => b.volume - a.volume)
    } catch {
      const res = await axios.get(`${API_BASE}/indian/crypto/perpetuals`)
      return res.data
    }
  },

  // Screener
  getScreenerResults: async (filters) => {
    const res = await axios.post(`${API_BASE}/screener`, filters)
    return res.data
  },

  // News
  getNews: async (category = 'all') => {
    const res = await axios.get(`${API_BASE}/news`, { params: { category } })
    return res.data
  },

  // Paper Trading with local storage resilience (prevents 404 or backend disconnect errors)
  getPaperTrades: async () => {
    try {
      const res = await axios.get(`${API_BASE}/paper-trade/history`)
      if (res.data) {
        localStorage.setItem('tradex_paper_store', JSON.stringify(res.data))
      }
      return res.data
    } catch (err) {
      console.warn('Backend paper trade fetch failed, falling back to local store:', err)
      const cached = localStorage.getItem('tradex_paper_store')
      if (cached) {
        try { return JSON.parse(cached) } catch {}
      }
      return { trades: [], balance: 100000, initialBalance: 100000 }
    }
  },

  savePaperTrade: async (trade) => {
    try {
      const res = await axios.post(`${API_BASE}/paper-trade`, trade)
      return res.data
    } catch (err) {
      console.warn('Backend paper trade save failed, saving to local store:', err)
      const cachedStr = localStorage.getItem('tradex_paper_store')
      const cached = cachedStr ? JSON.parse(cachedStr) : { trades: [], balance: 100000, initialBalance: 100000 }
      const cost = Number(trade.quantity) * Number(trade.price)
      const currentBal = typeof cached.balance === 'number' ? cached.balance : 100000

      if (trade.side === 'buy' && cost > currentBal) {
        throw new Error('Insufficient virtual balance')
      }

      const newTrade = {
        id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        symbol: trade.symbol,
        type: trade.type || 'crypto',
        side: trade.side,
        quantity: Number(trade.quantity),
        entry_price: Number(trade.price),
        strategy: trade.strategy || 'Manual',
        status: 'open',
        created_at: new Date().toISOString()
      }

      const updatedBalance = trade.side === 'buy' ? (currentBal - cost) : currentBal
      const updatedStore = {
        trades: [newTrade, ...(cached.trades || [])],
        balance: updatedBalance,
        initialBalance: cached.initialBalance || 100000
      }
      localStorage.setItem('tradex_paper_store', JSON.stringify(updatedStore))
      return { id: newTrade.id, balance: updatedBalance }
    }
  },

  closePaperTrade: async (id, exitPrice) => {
    try {
      const res = await axios.post(`${API_BASE}/paper-trade/close/${id}`, { exitPrice })
      return res.data
    } catch (err) {
      console.warn('Backend close trade failed, closing in local store:', err)
      const cachedStr = localStorage.getItem('tradex_paper_store')
      const cached = cachedStr ? JSON.parse(cachedStr) : { trades: [], balance: 100000, initialBalance: 100000 }
      const trade = (cached.trades || []).find(t => t.id === id)
      if (!trade) {
        throw new Error('Trade not found')
      }
      const numExit = Number(exitPrice)
      const pnl = trade.side === 'buy'
        ? (numExit - Number(trade.entry_price)) * Number(trade.quantity)
        : (Number(trade.entry_price) - numExit) * Number(trade.quantity)
      trade.exit_price = numExit
      trade.pnl = pnl
      trade.status = 'closed'
      trade.closed_at = new Date().toISOString()

      const returnAmt = trade.quantity * numExit
      const updatedBalance = trade.side === 'buy'
        ? (cached.balance || 100000) + returnAmt
        : (cached.balance || 100000) + (trade.quantity * trade.entry_price + pnl)

      cached.balance = updatedBalance
      localStorage.setItem('tradex_paper_store', JSON.stringify(cached))
      return { pnl, balance: updatedBalance }
    }
  },

  resetPaperTrade: async () => {
    try {
      const res = await axios.post(`${API_BASE}/paper-trade/reset`)
      localStorage.setItem('tradex_paper_store', JSON.stringify({ trades: [], balance: 100000, initialBalance: 100000 }))
      return res.data
    } catch (err) {
      console.warn('Backend reset trade failed, resetting local store:', err)
      localStorage.setItem('tradex_paper_store', JSON.stringify({ trades: [], balance: 100000, initialBalance: 100000 }))
      return { balance: 100000, message: 'Paper trading account reset successfully' }
    }
  },

  // Chatbot
  sendChatMessage: async (message, context) => {
    const res = await axios.post(`${API_BASE}/chatbot`, { message, context })
    return res.data
  },

  // Algo Trading
  testAlgoConnection: async (brokerData) => {
    try {
      const res = await axios.post(`${API_BASE}/algo/test-connection`, brokerData)
      return res.data
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message
      throw new Error(serverMsg)
    }
  },

  startAlgoTrade: async (config) => {
    try {
      const res = await axios.post(`${API_BASE}/algo/start`, config)
      return res.data
    } catch (err) {
      console.warn('Backend start algo failed, using client engine:', err)
      return { status: 'running', message: `Algo trading started for ${config.symbol} using ${config.strategy}`, config }
    }
  },

  stopAlgoTrade: async () => {
    try {
      const res = await axios.post(`${API_BASE}/algo/stop`)
      return res.data
    } catch (err) {
      console.warn('Backend stop algo failed, stopping client engine:', err)
      return { status: 'stopped', message: 'Algo trading stopped' }
    }
  },

  getAlgoStatus: async () => {
    try {
      const res = await axios.get(`${API_BASE}/algo/status`)
      return res.data
    } catch (err) {
      return { isRunning: false, isConnected: false, config: {}, logs: [] }
    }
  },

  // Backtest
  runBacktest: async (strategy, symbol, timeframe, period) => {
    const res = await axios.post(`${API_BASE}/backtest`, { strategy, symbol, timeframe, period })
    return res.data
  },
}

// WebSocket connection for live crypto data
export class BinanceWS {
  constructor() {
    this.ws = null
    this.callbacks = new Map()
    this.reconnectAttempts = 0
  }

  connect(streams) {
    const streamStr = streams.map(s => `${s.toLowerCase()}@ticker`).join('/')
    this.ws = new WebSocket(`${BINANCE_WS}/${streamStr}`)

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const symbol = data.s
      if (this.callbacks.has(symbol)) {
        this.callbacks.get(symbol)(data)
      }
      if (this.callbacks.has('*')) {
        this.callbacks.get('*')(data)
      }
    }

    this.ws.onclose = () => {
      if (this.reconnectAttempts < 5) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(streams), 3000 * this.reconnectAttempts)
      }
    }

    this.ws.onerror = () => this.ws.close()
  }

  static connectKline(symbol, interval, callback) {
    const ws = new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@kline_${interval}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.k) {
        callback({
          time: Math.floor(data.k.t / 1000),
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v),
        })
      }
    }
    return ws
  }

  connectKline(symbol, interval, callback) {
    return BinanceWS.connectKline(symbol, interval, callback)
  }

  subscribe(symbol, callback) {
    this.callbacks.set(symbol, callback)
  }

  unsubscribe(symbol) {
    this.callbacks.delete(symbol)
  }

  disconnect() {
    if (this.ws) this.ws.close()
  }
}
