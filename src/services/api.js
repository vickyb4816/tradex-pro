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

  // Paper Trading
  getPaperTrades: async () => {
    const res = await axios.get(`${API_BASE}/paper-trade/history`)
    return res.data
  },

  savePaperTrade: async (trade) => {
    const res = await axios.post(`${API_BASE}/paper-trade`, trade)
    return res.data
  },

  closePaperTrade: async (id, exitPrice) => {
    const res = await axios.post(`${API_BASE}/paper-trade/close/${id}`, { exitPrice })
    return res.data
  },

  resetPaperTrade: async () => {
    const res = await axios.post(`${API_BASE}/paper-trade/reset`)
    return res.data
  },

  // Chatbot
  sendChatMessage: async (message, context) => {
    const res = await axios.post(`${API_BASE}/chatbot`, { message, context })
    return res.data
  },

  // Algo Trading
  startAlgoTrade: async (config) => {
    const res = await axios.post(`${API_BASE}/algo/start`, config)
    return res.data
  },

  stopAlgoTrade: async () => {
    const res = await axios.post(`${API_BASE}/algo/stop`)
    return res.data
  },

  getAlgoStatus: async () => {
    const res = await axios.get(`${API_BASE}/algo/status`)
    return res.data
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
