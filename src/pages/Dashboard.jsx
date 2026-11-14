import { useStore } from '../store/useStore'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getChangeColor,
  getMarketSessionInfo,
  isMarketOpen,
  indianStocks,
  cryptoSymbols,
} from '../utils/helpers'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Eye,
  Clock,
  Zap,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

// Helper to generate realistic sparkline data for watchlist items
const generateSparklineData = (basePrice, changePercent = 0, count = 16) => {
  const safeBase = Number(basePrice) > 0 ? Number(basePrice) : 100
  const startPrice = safeBase / (1 + (changePercent || 0) / 100)
  const delta = safeBase - startPrice
  const points = []

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1)
    const wave = Math.sin(i * 0.9) * 0.15 + Math.cos(i * 1.3) * 0.1
    const noise = wave * Math.abs(delta || safeBase * 0.02)
    const val = i === count - 1 ? safeBase : Math.max(0.001, startPrice + delta * progress + (i > 0 ? noise : 0))
    points.push({
      time: `${i * 2}h`,
      price: Number(val.toFixed(val > 100 ? 2 : 4)),
    })
  }
  return points
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { prices, activeMarket, setActiveMarket, watchlist, setBulkPrices, updatePrice, setSelectedSymbol } = useStore()

  // Primary market switcher: 'indian' vs 'crypto' (completely separated)
  const [selectedMarket, setSelectedMarket] = useState(activeMarket || 'indian')

  // Keep selectedMarket in sync with activeMarket from header
  useEffect(() => {
    if (activeMarket && activeMarket !== selectedMarket) {
      setSelectedMarket(activeMarket)
    }
  }, [activeMarket])

  // Real Market Session Info (Accurate IST market hours: Mon-Fri 9:15 AM - 3:30 PM IST)
  const [marketSession, setMarketSession] = useState(getMarketSessionInfo())

  // Indian indices from backend API / Yahoo Finance
  const [indianIndices, setIndianIndices] = useState([
    { symbol: '^NSEI', displaySymbol: 'NIFTY 50', name: 'NSE Benchmark', exchange: 'NSE', value: 25144.30, previousClose: 25299.30, changeVal: -110.80, changePercent: -0.44, dayHigh: 25246.35, dayLow: 25054.40, isPositive: false },
    { symbol: '^BSESN', displaySymbol: 'SENSEX', name: 'BSE Benchmark', exchange: 'BSE', value: 81592.45, previousClose: 81911.00, changeVal: -286.95, changePercent: -0.35, dayHigh: 81879.51, dayLow: 81288.75, isPositive: false },
    { symbol: '^NSEBANK', displaySymbol: 'BANK NIFTY', name: 'NSE Banking Index', exchange: 'NSE', value: 61034.10, previousClose: 61518.50, changeVal: 241.70, changePercent: 0.40, dayHigh: 61300.55, dayLow: 60780.55, isPositive: true },
    { symbol: 'BSE-BANK.BO', displaySymbol: 'BSE BANKEX', name: 'BSE Banking Benchmark', exchange: 'BSE', value: 68809.34, previousClose: 69251.20, changeVal: -441.86, changePercent: -0.64, dayHigh: 69148.30, dayLow: 68496.07, isPositive: false },
    { symbol: '^CNXIT', displaySymbol: 'NIFTY IT', name: 'NSE Technology', exchange: 'NSE', value: 31931.15, previousClose: 32163.60, changeVal: -364.45, changePercent: -1.13, dayHigh: 32387.75, dayLow: 31806.30, isPositive: false },
    { symbol: '^INDIAVIX', displaySymbol: 'INDIA VIX', name: 'NSE Volatility', exchange: 'NSE', value: 15.50, previousClose: 16.62, changeVal: -2.06, changePercent: -11.76, dayHigh: 16.88, dayLow: 15.30, isPositive: false, isVolatility: true },
  ])

  // Crypto benchmarks
  const [cryptoBenchmarks, setCryptoBenchmarks] = useState([
    { symbol: 'BTCUSDT', name: 'Bitcoin Perp', value: 66720.50, changePercent: -4.45, dayHigh: 70214.30, dayLow: 66456.00, volume: 1386043683, isPositive: false },
    { symbol: 'ETHUSDT', name: 'Ethereum Perp', value: 1891.75, changePercent: -4.15, dayHigh: 1989.10, dayLow: 1878.00, volume: 517206317, isPositive: false },
    { symbol: 'SOLUSDT', name: 'Solana Perp', value: 134.80, changePercent: 3.25, dayHigh: 138.50, dayLow: 129.10, volume: 389405120, isPositive: true },
    { symbol: 'BNBUSDT', name: 'BNB Perp', value: 585.20, changePercent: 1.15, dayHigh: 592.00, dayLow: 578.40, volume: 142805400, isPositive: true },
    { symbol: 'DOGEUSDT', name: 'Dogecoin Perp', value: 0.1245, changePercent: 5.82, dayHigh: 0.1310, dayLow: 0.1170, volume: 215403000, isPositive: true },
    { symbol: 'BTC.D', name: 'BTC Dominance', value: 58.20, changePercent: 0.45, dayHigh: 58.50, dayLow: 57.90, isPositive: true, unit: '%' },
  ])

  // Binance USDT-M Perpetual Futures all coins list (700+ contracts)
  const [perpetualsList, setPerpetualsList] = useState([])
  const [loadingPerpetuals, setLoadingPerpetuals] = useState(true)
  const [perpSearch, setPerpSearch] = useState('')
  const [perpTab, setPerpTab] = useState('all') // 'all' | 'gainers' | 'losers' | 'volume'

  // Indian Stocks list (80+ NSE stocks)
  const [indianStockList, setIndianStockList] = useState([])
  const [loadingStocks, setLoadingStocks] = useState(true)
  const [stockSearch, setStockSearch] = useState('')
  const [stockTab, setStockTab] = useState('all') // 'all' | 'gainers' | 'losers' | 'volume'
  const [stockSector, setStockSector] = useState('All')

  // Live order book tape stream
  const [indianTrades, setIndianTrades] = useState([
    { id: 'in-1', time: 'LTP Close', symbol: 'RELIANCE.NS', type: 'BUY', price: 1339.70, qty: 150, total: 200955.00 },
    { id: 'in-2', time: 'LTP Close', symbol: 'HDFCBANK.NS', type: 'SELL', price: 804.00, qty: 300, total: 241200.00 },
    { id: 'in-3', time: 'LTP Close', symbol: 'TCS.NS', type: 'BUY', price: 2407.50, qty: 80, total: 192600.00 },
    { id: 'in-4', time: 'LTP Close', symbol: 'SBIN.NS', type: 'BUY', price: 1080.00, qty: 250, total: 270000.00 },
    { id: 'in-5', time: 'LTP Close', symbol: 'INFY.NS', type: 'SELL', price: 1141.50, qty: 200, total: 228300.00 },
  ])

  const [cryptoTrades, setCryptoTrades] = useState([
    { id: 'cr-1', time: 'Just now', symbol: 'BTCUSDT', type: 'BUY', price: 66720.50, qty: 0.35, total: 23352.17 },
    { id: 'cr-2', time: '3s ago', symbol: 'ETHUSDT', type: 'SELL', price: 1891.40, qty: 3.20, total: 6052.48 },
    { id: 'cr-3', time: '7s ago', symbol: 'SOLUSDT', type: 'BUY', price: 134.90, qty: 25.0, total: 3372.50 },
    { id: 'cr-4', time: '11s ago', symbol: 'DOGEUSDT', type: 'BUY', price: 0.1245, qty: 45000, total: 5602.50 },
    { id: 'cr-5', time: '15s ago', symbol: '1000PEPEUSDT', type: 'SELL', price: 0.00985, qty: 500000, total: 4925.00 },
  ])

  // Watchlist active preview
  const [selectedWatchlistSymbol, setSelectedWatchlistSymbol] = useState(
    selectedMarket === 'indian' ? 'RELIANCE.NS' : 'BTCUSDT'
  )

  // 1. Clock timer & Market Session update
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketSession(getMarketSessionInfo())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Fetch official Indian Indices from backend API
  useEffect(() => {
    let isMounted = true
    const fetchIndices = async () => {
      try {
        const data = await api.getIndianIndices()
        if (isMounted && data && Array.isArray(data.indices)) {
          setIndianIndices(data.indices)
          if (data.session) setMarketSession(data.session)
        }
      } catch (e) {
        console.warn('Could not refresh Indian indices:', e.message)
      }
    }

    fetchIndices()
    // Poll indices every 15s during market hours, or every 60s when closed
    const pollInterval = marketSession.isOpen ? 15000 : 60000
    const interval = setInterval(fetchIndices, pollInterval)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [marketSession.isOpen])

  // 3. Fetch all Binance USDT-M Perpetuals (700+ contracts)
  useEffect(() => {
    let isMounted = true
    const fetchPerpetuals = async () => {
      try {
        setLoadingPerpetuals(true)
        const data = await api.getBinancePerpetuals()
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPerpetualsList(data)

          // Update crypto benchmarks with live top perp prices
          const btc = data.find(c => c.symbol === 'BTCUSDT')
          const eth = data.find(c => c.symbol === 'ETHUSDT')
          const sol = data.find(c => c.symbol === 'SOLUSDT')
          const bnb = data.find(c => c.symbol === 'BNBUSDT')
          const doge = data.find(c => c.symbol === 'DOGEUSDT')

          setCryptoBenchmarks(prev => prev.map(b => {
            let matched = null
            if (b.symbol === 'BTCUSDT') matched = btc
            if (b.symbol === 'ETHUSDT') matched = eth
            if (b.symbol === 'SOLUSDT') matched = sol
            if (b.symbol === 'BNBUSDT') matched = bnb
            if (b.symbol === 'DOGEUSDT') matched = doge
            if (matched) {
              return {
                ...b,
                value: matched.price,
                changePercent: matched.change,
                dayHigh: matched.high,
                dayLow: matched.low,
                volume: matched.volume,
                isPositive: matched.change >= 0,
              }
            }
            return b
          }))
        }
      } catch (err) {
        console.error('Failed to load Binance perpetuals:', err)
      } finally {
        if (isMounted) setLoadingPerpetuals(false)
      }
    }

    fetchPerpetuals()
    const interval = setInterval(fetchPerpetuals, 15000) // Poll 24/7 futures every 15s
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // 4. Fetch all NSE Stocks from Screener
  useEffect(() => {
    let isMounted = true
    const fetchStocks = async () => {
      try {
        setLoadingStocks(true)
        const data = await api.getScreenerResults({ market: 'indian', sortBy: 'volume', sortDir: 'desc' })
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setIndianStockList(data)
        }
      } catch (err) {
        console.warn('Failed to load NSE stocks:', err)
      } finally {
        if (isMounted) setLoadingStocks(false)
      }
    }

    fetchStocks()
    const interval = setInterval(fetchStocks, marketSession.isOpen ? 20000 : 120000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [marketSession.isOpen])

  // 5. 24/7 Live Crypto simulated/live tick updates (ONLY CRYPTO, NEVER INDIAN WHEN CLOSED!)
  useEffect(() => {
    // Only crypto gets live tick jitter because crypto trades 24/7/365!
    const cryptoInterval = setInterval(() => {
      setCryptoBenchmarks(prev => prev.map(c => {
        if (c.symbol === 'BTC.D') return c
        const delta = (Math.random() - 0.49) * 0.001 * c.value
        const newVal = Number((c.value + delta).toFixed(c.value < 1 ? 4 : 2))
        return {
          ...c,
          value: newVal,
        }
      }))
    }, 2000)

    return () => clearInterval(cryptoInterval)
  }, [])

  // 6. Indian Indices tick: ONLY when market is actually open (Mon-Fri 9:15 AM - 3:30 PM IST)
  useEffect(() => {
    // CRITICAL: When market is closed, DO NOT run tick intervals!
    if (!marketSession.isOpen) return

    const indianInterval = setInterval(() => {
      setIndianIndices(prev => prev.map(idx => {
        if (Math.random() > 0.4) {
          const delta = (Math.random() - 0.49) * 0.0008 * idx.value
          const newVal = Number((idx.value + delta).toFixed(2))
          const newChg = Number((newVal - idx.previousClose).toFixed(2))
          const newPct = Number(((newChg / idx.previousClose) * 100).toFixed(2))
          return {
            ...idx,
            value: newVal,
            changeVal: newChg,
            changePercent: newPct,
            isPositive: newChg >= 0,
          }
        }
        return idx
      }))
    }, 2500)

    return () => clearInterval(indianInterval)
  }, [marketSession.isOpen])

  // Filtered & Sorted Binance Perpetuals
  const filteredPerpetuals = useMemo(() => {
    let list = [...perpetualsList]
    if (perpSearch.trim()) {
      const q = perpSearch.toUpperCase().trim()
      list = list.filter(p => p.symbol.includes(q) || (p.baseAsset && p.baseAsset.includes(q)))
    }
    if (perpTab === 'gainers') {
      list.sort((a, b) => b.change - a.change)
    } else if (perpTab === 'losers') {
      list.sort((a, b) => a.change - b.change)
    } else if (perpTab === 'volume') {
      list.sort((a, b) => b.volume - a.volume)
    }
    return list
  }, [perpetualsList, perpSearch, perpTab])

  // Filtered & Sorted Indian Stocks
  const filteredIndianStocks = useMemo(() => {
    let list = [...indianStockList]
    if (stockSearch.trim()) {
      const q = stockSearch.toLowerCase().trim()
      list = list.filter(s => (s.symbol || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q))
    }
    if (stockSector !== 'All') {
      list = list.filter(s => s.sector === stockSector)
    }
    if (stockTab === 'gainers') {
      list.sort((a, b) => b.change - a.change)
    } else if (stockTab === 'losers') {
      list.sort((a, b) => a.change - b.change)
    } else if (stockTab === 'volume') {
      list.sort((a, b) => b.volume - a.volume)
    }
    return list
  }, [indianStockList, stockSearch, stockTab, stockSector])

  // Filter watchlist items matching the selected market
  const marketWatchlist = useMemo(() => {
    return watchlist.filter(w => {
      const isInd = w.symbol.includes('.NS') || w.symbol.includes('.BO') || w.type === 'indian'
      return selectedMarket === 'indian' ? isInd : !isInd
    })
  }, [watchlist, selectedMarket])

  const handleLaunchChart = (symbol, type = 'indian') => {
    setSelectedSymbol({
      symbol,
      name: symbol,
      type: type === 'indian' || symbol.includes('.NS') || symbol.includes('.BO') ? 'indian' : 'crypto',
    })
    navigate('/charts')
  }

  const handleMarketSwitch = (m) => {
    setSelectedMarket(m)
    setActiveMarket(m)
    setSelectedWatchlistSymbol(m === 'indian' ? 'RELIANCE.NS' : 'BTCUSDT')
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ======================================================== */}
      {/* 1. TOP MARKET SWITCHER & STATUS BAR                     */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase rounded bg-primary-500/15 text-primary-400 border border-primary-500/30">
              TradeX Institutional
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-xs text-gray-400">
              {selectedMarket === 'indian' ? 'NSE & BSE Equity Terminal' : 'Binance Perpetual Futures Terminal'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Market Command Center</span>
          </h1>
        </div>

        {/* Primary Segmented Market Switcher (Indian vs Crypto) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-dark-900 border border-gray-800 rounded-2xl shadow-xl">
          <button
            onClick={() => handleMarketSwitch('indian')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              selectedMarket === 'indian'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/40'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <span className="text-base">🇮🇳</span>
            <span>Indian Market (NSE & BSE)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              marketSession.isOpen ? 'bg-emerald-500 text-black' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {marketSession.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </button>

          <button
            onClick={() => handleMarketSwitch('crypto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              selectedMarket === 'crypto'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/25 ring-1 ring-yellow-300'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <span className="text-base">₿</span>
            <span>Crypto Market (Binance Futures)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500 text-black">
              24/7 LIVE
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DEDICATED VIEW: 🇮🇳 INDIAN MARKET                      */}
      {/* ======================================================== */}
      {selectedMarket === 'indian' && (
        <div className="space-y-6">
          {/* Indian Market Session Banner */}
          <div className="card p-4 bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${marketSession.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    NSE & BSE Status: {marketSession.statusText}
                  </h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                    marketSession.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {marketSession.nextSession}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Regular Trading Hours: <strong className="text-gray-200">Monday to Friday, 09:15 AM – 03:30 PM IST</strong>.
                  {!marketSession.isOpen && (
                    <span className="text-amber-400 font-medium ml-1">
                      (Prices frozen at official Closing LTP to prevent false ticks outside market hours)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs text-gray-300 bg-dark-950/80 px-3 py-1.5 rounded-lg border border-gray-800">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>{marketSession.istDate} • {marketSession.istTime} IST</span>
            </div>
          </div>

          {/* 6 Indian Benchmark Indices (Nifty 50, Sensex, Bank Nifty, BSE Bankex, Nifty IT, India VIX) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {indianIndices.map((idx) => {
              const isPositive = idx.changeVal >= 0
              return (
                <div
                  key={idx.symbol}
                  onClick={() => handleLaunchChart(idx.symbol, 'indian')}
                  className="card p-3.5 hover:border-orange-500/50 hover:bg-dark-800/80 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      {idx.displaySymbol}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-dark-900 border border-gray-800 text-gray-400">
                      {idx.exchange}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate mb-2">{idx.name}</div>
                  <div className="text-lg font-mono font-extrabold text-white">
                    {formatCurrency(idx.value, 'INR')}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-mono font-semibold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isPositive ? '+' : ''}{idx.changeVal}</span>
                    <span>({isPositive ? '+' : ''}{idx.changePercent}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 pt-1.5 border-t border-gray-800/60 font-mono">
                    <span>H: {idx.dayHigh}</span>
                    <span>L: {idx.dayLow}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* NSE Stocks Catalog & Movers */}
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                  <span>National Stock Exchange (NSE) Stocks Catalog</span>
                  <span className="badge badge-primary text-[11px] py-0 px-2 font-mono">
                    {filteredIndianStocks.length} Stocks
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Live closing and intraday quotes across Nifty 50, Next 50, and sector leaders
                </p>
              </div>

              {/* Tabs: All, Gainers, Losers, Volume */}
              <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-xl border border-gray-800 text-xs">
                {['all', 'gainers', 'losers', 'volume'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStockTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-all ${
                      stockTab === tab
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Sector Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search NSE stock by symbol or company name (e.g. Reliance, HDFC, Tata, SBI)..."
                  className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Sector Dropdown */}
              <select
                value={stockSector}
                onChange={(e) => setStockSector(e.target.value)}
                className="select-field text-xs py-2 w-full sm:w-48"
              >
                <option value="All">All Sectors</option>
                <option value="Banking">Banking & Financials</option>
                <option value="IT">Information Technology</option>
                <option value="Automobile">Automobile</option>
                <option value="Energy">Energy & Oil/Gas</option>
                <option value="FMCG">FMCG & Consumer</option>
                <option value="Pharma">Pharma & Healthcare</option>
                <option value="Metals">Metals & Mining</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Defense">Defense</option>
              </select>
            </div>

            {/* Stock Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-800/80">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-dark-900/90 text-gray-400 uppercase tracking-wider border-b border-gray-800 text-[11px] font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-4">Symbol / Company</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-4 text-right">LTP (₹)</th>
                    <th className="py-2.5 px-4 text-right">Day Change (%)</th>
                    <th className="py-2.5 px-4 text-right">Volume</th>
                    <th className="py-2.5 px-4 text-center">RSI</th>
                    <th className="py-2.5 px-4 text-center">Technical Signal</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 font-mono">
                  {loadingStocks ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Loading NSE stocks quotes...
                      </td>
                    </tr>
                  ) : filteredIndianStocks.slice(0, 30).map((stk, index) => {
                    const chg = stk.change || 0
                    const isPos = chg >= 0
                    return (
                      <tr
                        key={stk.symbol}
                        onClick={() => handleLaunchChart(stk.symbol, 'indian')}
                        className="hover:bg-dark-800/60 cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-gray-500">{index + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-white font-sans group-hover:text-orange-400 transition-colors">
                          <div className="font-semibold text-xs">{stk.symbol}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{stk.name}</div>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-gray-400 text-[11px]">{stk.sector || 'Equities'}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-white">
                          {formatCurrency(stk.price, 'INR')}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{Number(chg).toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-400">
                          {formatNumber(stk.volume)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            (stk.rsi || 50) <= 30 ? 'bg-emerald-500/20 text-emerald-300' : (stk.rsi || 50) >= 70 ? 'bg-rose-500/20 text-rose-300' : 'bg-dark-800 text-gray-400'
                          }`}>
                            {stk.rsi || 50}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            (stk.signal || '').includes('BUY') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : (stk.signal || '').includes('SELL') ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-dark-800 text-gray-400'
                          }`}>
                            {stk.signal || 'NEUTRAL'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLaunchChart(stk.symbol, 'indian')
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors font-sans"
                          >
                            Chart
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DEDICATED VIEW: ₿ CRYPTO MARKET (BINANCE PERPETUALS) */}
      {/* ======================================================== */}
      {selectedMarket === 'crypto' && (
        <div className="space-y-6">
          {/* Crypto 24/7 Futures Session Banner */}
          <div className="card p-4 bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-yellow-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Binance USDT-M Futures: 24/7 Global Trading Live
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-emerald-500/20 text-emerald-300">
                    700+ Perpetual Coins Active
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  High-liquidity cryptocurrency perpetual contracts with up to 125x leverage and real-time funding rates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs text-gray-300 bg-dark-950/80 px-3 py-1.5 rounded-lg border border-gray-800">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Binance Direct Feed • 24/7 Real-Time</span>
            </div>
          </div>

          {/* 6 Crypto Benchmark Cards (BTC, ETH, SOL, BNB, DOGE, BTC.D) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {cryptoBenchmarks.map((c) => {
              const isPositive = c.changePercent >= 0
              return (
                <div
                  key={c.symbol}
                  onClick={() => c.symbol !== 'BTC.D' && handleLaunchChart(c.symbol, 'crypto')}
                  className="card p-3.5 hover:border-yellow-500/50 hover:bg-dark-800/80 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {c.symbol}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-dark-900 border border-gray-800 text-amber-400">
                      PERP
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate mb-2">{c.name}</div>
                  <div className="text-lg font-mono font-extrabold text-white">
                    {c.unit ? `${c.value}%` : formatCurrency(c.value, 'USD')}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-mono font-semibold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isPositive ? '+' : ''}{c.changePercent}%</span>
                  </div>
                  {c.volume && (
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 pt-1.5 border-t border-gray-800/60 font-mono">
                      <span>Vol: {formatNumber(c.volume)}</span>
                      <span>24h</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Binance Perpetual Futures Explorer (All 700+ Contracts) */}
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-yellow-400" />
                  <span>All Binance USDT-M Perpetual Coins</span>
                  <span className="badge badge-warning text-[11px] py-0 px-2 font-mono">
                    {perpetualsList.length} Coins Available
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete listing of Binance USDT-margined perpetual futures with mark prices and volumes
                </p>
              </div>

              {/* Tabs: All, Gainers, Losers, Volume */}
              <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-xl border border-gray-800 text-xs">
                {['all', 'gainers', 'losers', 'volume'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPerpTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-all ${
                      perpTab === tab
                        ? 'bg-yellow-500 text-black shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input for Perpetuals */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={perpSearch}
                onChange={(e) => setPerpSearch(e.target.value)}
                placeholder="Search any Binance perpetual coin (e.g. BTC, ETH, SOL, PEPE, SUI, NEAR, TAO, WIF, DOGE)..."
                className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Perpetuals Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-800/80 max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-dark-950 text-gray-400 uppercase tracking-wider border-b border-gray-800 text-[11px] font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-4">Contract Symbol</th>
                    <th className="py-2.5 px-4 text-right">Mark Price ($)</th>
                    <th className="py-2.5 px-4 text-right">24h Change (%)</th>
                    <th className="py-2.5 px-4 text-right">24h Volume ($)</th>
                    <th className="py-2.5 px-4 text-center">Funding Rate</th>
                    <th className="py-2.5 px-4 text-center">Leverage</th>
                    <th className="py-2.5 px-4 text-right hidden sm:table-cell">24h High</th>
                    <th className="py-2.5 px-4 text-right hidden sm:table-cell">24h Low</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 font-mono">
                  {loadingPerpetuals ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        Loading Binance perpetual contracts...
                      </td>
                    </tr>
                  ) : filteredPerpetuals.slice(0, 50).map((perp, index) => {
                    const isPos = perp.change >= 0
                    return (
                      <tr
                        key={perp.symbol}
                        onClick={() => handleLaunchChart(perp.symbol, 'crypto')}
                        className="hover:bg-dark-800/60 cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-gray-500">{index + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-white font-sans group-hover:text-yellow-400 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{perp.symbol}</span>
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1 py-0.2 rounded font-mono font-bold">
                              PERP
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-white">
                          {formatCurrency(perp.price, 'USD')}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{Number(perp.change).toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-300">
                          ${formatNumber(perp.volume)}
                        </td>
                        <td className="py-2.5 px-4 text-center text-emerald-400 text-[11px]">
                          {perp.fundingRate || '+0.0100%'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-sans">
                          <span className="bg-dark-800 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-300 border border-gray-700">
                            {perp.leverage || '125x'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-400 hidden sm:table-cell">
                          {formatCurrency(perp.high, 'USD')}
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-400 hidden sm:table-cell">
                          {formatCurrency(perp.low, 'USD')}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLaunchChart(perp.symbol, 'crypto')
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors font-sans"
                          >
                            Chart
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. WATCHLIST & EXECUTION STREAM (Separated per Market)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist with Sparklines */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-400" />
              <span>{selectedMarket === 'indian' ? 'Indian Stock Watchlist' : 'Crypto Perpetuals Watchlist'}</span>
              <span className="badge badge-primary text-[10px] py-0 px-1.5 font-mono">
                {marketWatchlist.length} Saved
              </span>
            </h3>
            <span className="text-xs text-gray-400">Click to preview chart & metrics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {marketWatchlist.map(w => {
              const curPrice = prices[w.symbol]?.price || (w.symbol.includes('.NS') ? 2500 : 100)
              const curChg = prices[w.symbol]?.changePercent || 1.25
              const isPos = curChg >= 0
              const spark = generateSparklineData(curPrice, curChg, 14)
              const curr = selectedMarket === 'indian' ? 'INR' : 'USD'

              return (
                <div
                  key={w.symbol}
                  onClick={() => handleLaunchChart(w.symbol, selectedMarket)}
                  className="p-3 bg-dark-900 border border-gray-800/80 rounded-xl hover:border-primary-500/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{w.symbol}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{w.name}</div>
                    <div className="font-mono font-bold text-sm text-white mt-1">
                      {formatCurrency(curPrice, curr)}
                    </div>
                    <div className={`text-[11px] font-mono font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{Number(curChg).toFixed(2)}%
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={spark}>
                        <defs>
                          <linearGradient id={`grad-${w.symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPos ? '#22c55e' : '#ef4444'} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={isPos ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={isPos ? '#22c55e' : '#ef4444'}
                          strokeWidth={1.5}
                          fill={`url(#grad-${w.symbol})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Order Book / Trades Stream (Market-specific) */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{selectedMarket === 'indian' ? 'NSE Execution Tape' : 'Binance Perpetuals Tape'}</span>
            </h3>
            <span className="text-[10px] text-gray-500">
              {selectedMarket === 'indian' ? (marketSession.isOpen ? 'Live Fills' : 'Last Session Fills') : '24/7 Fills'}
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto font-mono text-xs">
            {(selectedMarket === 'indian' ? indianTrades : cryptoTrades).map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-900 border border-gray-800/60">
                <div>
                  <span className="font-bold text-white mr-1.5">{t.symbol}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${t.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {t.type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">
                    {formatCurrency(t.price, selectedMarket === 'indian' ? 'INR' : 'USD')}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Qty: {t.qty} • {t.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
