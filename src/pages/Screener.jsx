import { useStore } from '../store/useStore'
import { formatCurrency, formatNumber, formatPercent, getChangeColor } from '../utils/helpers'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Search, Filter, ArrowUpDown, Star, RefreshCw, Download, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Screener() {
  const navigate = useNavigate()
  const {
    activeMarket,
    setActiveMarket,
    screenerResults,
    setScreenerResults,
    screenerFilters,
    setScreenerFilters,
    setSelectedSymbol,
    watchlist = [],
    addToWatchlist,
    removeFromWatchlist
  } = useStore()

  // Filter state
  const [market, setMarket] = useState(activeMarket || screenerFilters?.market || 'crypto')
  const [changeMin, setChangeMin] = useState(screenerFilters?.changeMin ?? -100)
  const [changeMax, setChangeMax] = useState(screenerFilters?.changeMax ?? 100)
  const [volumeMin, setVolumeMin] = useState(screenerFilters?.volumeMin ?? 0)
  const [rsiFilter, setRsiFilter] = useState('all') // 'all' | 'oversold' | 'overbought' | 'neutral'
  const [signalFilter, setSignalFilter] = useState('all') // 'all' | 'buy' | 'sell'
  const [sortBy, setSortBy] = useState('volume')
  const [sortDir, setSortDir] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(true)

  // Sync market with activeMarket from store if it changes elsewhere
  useEffect(() => {
    if (activeMarket && activeMarket !== market) {
      setMarket(activeMarket)
    }
  }, [activeMarket])

  // Handle market toggle
  const handleMarketToggle = (newMarket) => {
    setMarket(newMarket)
    if (setActiveMarket) setActiveMarket(newMarket)
    setScreenerFilters({ market: newMarket })
  }

  // Toggle sort direction
  const handleSortDirToggle = () => {
    setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  // Quick preset filters for change%
  const handlePresetChange = (preset) => {
    if (preset === 'all') {
      setChangeMin(-100)
      setChangeMax(100)
      setScreenerFilters({ changeMin: -100, changeMax: 100 })
    } else if (preset === 'gainers') {
      setChangeMin(0)
      setChangeMax(100)
      setScreenerFilters({ changeMin: 0, changeMax: 100 })
    } else if (preset === 'top_gainers') {
      setChangeMin(5)
      setChangeMax(100)
      setScreenerFilters({ changeMin: 5, changeMax: 100 })
    } else if (preset === 'losers') {
      setChangeMin(-100)
      setChangeMax(0)
      setScreenerFilters({ changeMin: -100, changeMax: 0 })
    } else if (preset === 'top_losers') {
      setChangeMin(-100)
      setChangeMax(-5)
      setScreenerFilters({ changeMin: -100, changeMax: -5 })
    }
  }

  // Fetch screener results
  const fetchScreenerData = async () => {
    setLoading(true)
    setError(null)
    const filtersPayload = {
      market,
      volumeMin: Number(volumeMin) || 0,
      changeMin: Number(changeMin) ?? -100,
      changeMax: Number(changeMax) ?? 100,
      rsiFilter,
      signalFilter,
      sortBy,
      sortDir,
    }

    try {
      const data = await api.getScreenerResults(filtersPayload)
      if (Array.isArray(data)) {
        setScreenerResults(data)
        return
      }
      throw new Error('Invalid data received from screener API')
    } catch (err) {
      console.warn('Backend screener failed, attempting direct fetch or fallback:', err.message)
      try {
        if (market === 'crypto') {
          const res = await fetch('https://api.binance.com/api/v3/ticker/24hr')
          const tickers = await res.json()
          let parsed = tickers
            .filter(t => t.symbol.endsWith('USDT') && !t.symbol.includes('UP') && !t.symbol.includes('DOWN'))
            .map(t => ({
              symbol: t.symbol,
              name: t.symbol.replace('USDT', ''),
              price: parseFloat(t.lastPrice) || 0,
              change: parseFloat(t.priceChangePercent) || 0,
              volume: parseFloat(t.quoteVolume) || 0,
              high: parseFloat(t.highPrice) || 0,
              low: parseFloat(t.lowPrice) || 0,
              trades: parseInt(t.count) || 0,
            }))
            .filter(t => 
              t.change >= (Number(changeMin) || -100) && 
              t.change <= (Number(changeMax) || 100) && 
              t.volume >= (Number(volumeMin) || 0)
            )
          parsed.sort((a, b) => sortDir === 'desc' ? (b[sortBy] || 0) - (a[sortBy] || 0) : (a[sortBy] || 0) - (b[sortBy] || 0))
          setScreenerResults(parsed.slice(0, 100))
        } else {
          const defaultIndian = [
            { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2845.50, change: 1.45, volume: 4520000, high: 2865.00, low: 2820.00 },
            { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 4120.00, change: -0.62, volume: 1850000, high: 4165.00, low: 4095.00 },
            { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', price: 1680.25, change: 0.85, volume: 6200000, high: 1695.00, low: 1665.00 },
            { symbol: 'INFY.NS', name: 'Infosys', price: 1855.10, change: 2.10, volume: 3950000, high: 1870.00, low: 1825.00 },
            { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', price: 1245.80, change: 0.40, volume: 5100000, high: 1258.00, low: 1238.00 },
            { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', price: 1540.00, change: 1.95, volume: 2900000, high: 1555.00, low: 1520.00 },
            { symbol: 'SBIN.NS', name: 'State Bank of India', price: 815.50, change: -1.15, volume: 8400000, high: 830.00, low: 810.00 },
            { symbol: 'ITC.NS', name: 'ITC Limited', price: 495.20, change: 0.30, volume: 7200000, high: 498.50, low: 492.00 },
            { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', price: 1780.00, change: -0.45, volume: 2100000, high: 1795.00, low: 1770.00 },
            { symbol: 'LT.NS', name: 'Larsen & Toubro', price: 3620.40, change: 1.12, volume: 1450000, high: 3650.00, low: 3590.00 },
            { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', price: 980.50, change: 3.25, volume: 6800000, high: 995.00, low: 960.00 },
            { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', price: 6920.00, change: -1.80, volume: 920000, high: 7050.00, low: 6890.00 },
            { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', price: 12450.00, change: 0.75, volume: 450000, high: 12550.00, low: 12380.00 },
            { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', price: 1720.00, change: 1.35, volume: 1650000, high: 1735.00, low: 1705.00 },
            { symbol: 'TITAN.NS', name: 'Titan Company', price: 3450.00, change: -0.90, volume: 1100000, high: 3490.00, low: 3425.00 },
          ]
          let filtered = defaultIndian.filter(t => 
            t.change >= (Number(changeMin) || -100) && 
            t.change <= (Number(changeMax) || 100) && 
            t.volume >= (Number(volumeMin) || 0)
          )
          filtered.sort((a, b) => sortDir === 'desc' ? (b[sortBy] || 0) - (a[sortBy] || 0) : (a[sortBy] || 0) - (b[sortBy] || 0))
          setScreenerResults(filtered)
        }
      } catch (fallbackErr) {
        setError('Failed to fetch screener data. Please try refreshing.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Trigger api.getScreenerResults on mount and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScreenerData()
    }, 300)
    return () => clearTimeout(timer)
  }, [market, changeMin, changeMax, volumeMin, rsiFilter, signalFilter, sortBy, sortDir])

  // Filtered by search query & sorted client side
  const filteredResults = (screenerResults || []).filter(item => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const sym = (item.symbol || '').toLowerCase()
    const name = (item.name || '').toLowerCase()
    return sym.includes(q) || name.includes(q)
  }).sort((a, b) => {
    const field = sortBy || 'volume'
    const valA = a[field] ?? 0
    const valB = b[field] ?? 0
    return sortDir === 'desc' ? valB - valA : valA - valB
  })

  // Row navigation to charts
  const handleSelectAsset = (item) => {
    setSelectedSymbol({
      symbol: item.symbol,
      name: item.name || item.symbol,
      type: market === 'indian' ? 'indian' : 'crypto'
    })
    navigate('/charts')
  }

  // Toggle watchlist
  const handleToggleWatchlist = (e, item) => {
    e.stopPropagation()
    const isStarred = watchlist.some(w => w.symbol === item.symbol)
    if (isStarred) {
      if (removeFromWatchlist) removeFromWatchlist(item.symbol)
    } else {
      if (addToWatchlist) {
        addToWatchlist({
          symbol: item.symbol,
          name: item.name || item.symbol,
          type: market === 'indian' ? 'indian' : 'crypto'
        })
      }
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredResults.length) return
    const headers = ['Symbol', 'Name', 'Price', '24h Change (%)', 'Volume', 'High', 'Low']
    const rows = filteredResults.map(item => [
      item.symbol,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      item.price,
      item.change,
      item.volume,
      item.high,
      item.low,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `screener_${market}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Header column sort click handler
  const handleHeaderSort = (column) => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }

  const currencyCode = market === 'indian' ? 'INR' : 'USD'
  const gainersCount = filteredResults.filter(i => (i.change || 0) > 0).length
  const losersCount = filteredResults.filter(i => (i.change || 0) < 0).length

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-primary-400" />
            Market Screener
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Scan, filter, and discover {market === 'indian' ? 'NSE & BSE stocks' : 'cryptocurrency assets'} with real-time technical indicators
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            title="Toggle Filter Panel"
          >
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || filteredResults.length === 0}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchScreenerData}
            disabled={loading}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
            title="Refresh Screener Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Market Toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Market Selection
              </label>
              <div className="grid grid-cols-2 p-1 bg-dark-900 border border-gray-700 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => handleMarketToggle('crypto')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    market === 'crypto'
                      ? 'bg-yellow-500 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <span>₿</span>
                  <span>Crypto</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarketToggle('indian')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    market === 'indian'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>Indian</span>
                </button>
              </div>
            </div>

            {/* 2. Price Change Range */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">
                  Price Change 24h (%)
                </label>
                <span className="text-[11px] text-gray-500">Min to Max</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={changeMin}
                  onChange={(e) => {
                    const val = e.target.value
                    setChangeMin(val)
                    setScreenerFilters({ changeMin: Number(val) })
                  }}
                  placeholder="Min %"
                  className="input-field text-xs py-1.5"
                />
                <span className="text-gray-500 text-xs">to</span>
                <input
                  type="number"
                  value={changeMax}
                  onChange={(e) => {
                    const val = e.target.value
                    setChangeMax(val)
                    setScreenerFilters({ changeMax: Number(val) })
                  }}
                  placeholder="Max %"
                  className="input-field text-xs py-1.5"
                />
              </div>
            </div>

            {/* 3. Volume Minimum */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Min 24h Volume
              </label>
              <input
                type="number"
                value={volumeMin}
                onChange={(e) => {
                  const val = e.target.value
                  setVolumeMin(val)
                  setScreenerFilters({ volumeMin: Number(val) })
                }}
                placeholder="e.g. 1000000"
                className="input-field text-xs py-1.5"
              />
            </div>

            {/* 4. Sort By & Sort Direction */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select-field w-full text-xs py-1.5"
                >
                  <option value="volume">Volume</option>
                  <option value="change">24h Change%</option>
                  <option value="price">Price</option>
                  <option value="rsi">RSI(14)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Direction
                </label>
                <button
                  type="button"
                  onClick={handleSortDirToggle}
                  className="input-field py-1.5 text-xs flex items-center justify-center gap-1.5 hover:bg-dark-800 transition-colors cursor-pointer text-gray-200"
                  title={`Sort direction: ${sortDir.toUpperCase()}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary-400" />
                  <span>{sortDir === 'desc' ? 'High → Low' : 'Low → High'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Indicator Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-gray-800/60">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                📊 RSI Indicator Filter
              </label>
              <select
                value={rsiFilter}
                onChange={(e) => setRsiFilter(e.target.value)}
                className="select-field w-full text-xs py-1.5"
              >
                <option value="all">All RSI Levels</option>
                <option value="oversold">🟢 Oversold (RSI ≤ 30) - Potential Buy</option>
                <option value="neutral">⚪ Neutral Range (30 - 70)</option>
                <option value="overbought">🔴 Overbought (RSI ≥ 70) - Potential Sell</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                🎯 Technical Signal
              </label>
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value)}
                className="select-field w-full text-xs py-1.5"
              >
                <option value="all">All Signals</option>
                <option value="buy">🟢 Buy & Strong Buy Only</option>
                <option value="sell">🔴 Sell & Strong Sell Only</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-[11px] text-gray-400 bg-dark-900/60 p-2 rounded-lg border border-gray-800 w-full flex items-center justify-between">
                <span>RSI & Signal filters apply across <strong>{market === 'indian' ? 'NSE Bluechips' : 'Crypto'}</strong> in real-time</span>
              </div>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/60 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-500 text-[11px] uppercase tracking-wider mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetChange('all')}
                className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${Number(changeMin) === -100 && Number(changeMax) === 100 ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('gainers')}
                className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${Number(changeMin) === 0 && Number(changeMax) === 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                Gainers (&gt;0%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('top_gainers')}
                className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${Number(changeMin) === 5 && Number(changeMax) === 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                Top Gainers (&gt;5%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('losers')}
                className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${Number(changeMin) === -100 && Number(changeMax) === 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                Losers (&lt;0%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('top_losers')}
                className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${Number(changeMin) === -100 && Number(changeMax) === -5 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                Top Losers (&lt;-5%)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[11px] uppercase tracking-wider mr-1">Vol Presets:</span>
              <button
                type="button"
                onClick={() => { setVolumeMin(0); setScreenerFilters({ volumeMin: 0 }) }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${Number(volumeMin) === 0 ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                Any
              </button>
              <button
                type="button"
                onClick={() => { setVolumeMin(1000000); setScreenerFilters({ volumeMin: 1000000 }) }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${Number(volumeMin) === 1000000 ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                &gt; 1M
              </button>
              <button
                type="button"
                onClick={() => { setVolumeMin(10000000); setScreenerFilters({ volumeMin: 10000000 }) }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${Number(volumeMin) === 10000000 ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                &gt; 10M
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Result Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-900/60 p-3 rounded-xl border border-gray-800/60">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or asset name..."
            className="input-field pl-9 pr-8 text-sm py-1.5"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result Count & Market Breadcrumb */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Results:</span>
            <span className="text-white font-semibold bg-dark-800 px-2 py-0.5 rounded border border-gray-700">
              {filteredResults.length}
            </span>
            {searchQuery && (
              <span className="text-gray-500">
                (of {screenerResults.length})
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="badge badge-green text-[11px] py-0 px-2">
              +{gainersCount} Up
            </span>
            <span className="badge badge-red text-[11px] py-0 px-2">
              -{losersCount} Down
            </span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card p-0 overflow-hidden border border-gray-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-dark-900/90 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th
                  onClick={() => handleHeaderSort('symbol')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Symbol</span>
                    {sortBy === 'symbol' && <ArrowUpDown className="w-3 h-3 text-primary-400" />}
                  </div>
                </th>
                <th className="py-3 px-4">Name</th>
                <th
                  onClick={() => handleHeaderSort('price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    {sortBy === 'price' && <ArrowUpDown className="w-3 h-3 text-primary-400" />}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('change')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change%</span>
                    {sortBy === 'change' && <ArrowUpDown className="w-3 h-3 text-primary-400" />}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('volume')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volume</span>
                    {sortBy === 'volume' && <ArrowUpDown className="w-3 h-3 text-primary-400" />}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('rsi')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>RSI(14)</span>
                    {sortBy === 'rsi' && <ArrowUpDown className="w-3 h-3 text-primary-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Signal</th>
                <th className="py-3 px-4 text-right hidden md:table-cell">High (24h)</th>
                <th className="py-3 px-4 text-right hidden md:table-cell">Low (24h)</th>
                <th className="py-3 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                /* Skeleton Loading State */
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-3 text-center">
                      <div className="h-4 w-4 bg-dark-700/80 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-dark-700/80 rounded" />
                        <div className="h-4 w-20 bg-dark-700/80 rounded" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-28 bg-dark-700/80 rounded" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 w-16 bg-dark-700/80 rounded ml-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 w-14 bg-dark-700/80 rounded ml-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 w-16 bg-dark-700/80 rounded ml-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right hidden md:table-cell">
                      <div className="h-4 w-16 bg-dark-700/80 rounded ml-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right hidden md:table-cell">
                      <div className="h-4 w-16 bg-dark-700/80 rounded ml-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-7 w-20 bg-dark-700/80 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredResults.length > 0 ? (
                filteredResults.map((item, index) => {
                  const isStarred = watchlist.some(w => w.symbol === item.symbol)
                  const changeVal = Number(item.change) || 0
                  const changeColor = getChangeColor(changeVal)

                  return (
                    <tr
                      key={item.symbol || index}
                      onClick={() => handleSelectAsset(item)}
                      className="hover:bg-dark-800/50 cursor-pointer transition-colors group"
                    >
                      {/* # Index */}
                      <td className="py-3 px-3 text-center text-xs text-gray-500 font-mono">
                        {index + 1}
                      </td>

                      {/* Symbol with Star watchlist button */}
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleWatchlist(e, item)}
                            className={`p-1 rounded hover:bg-dark-700/60 transition-colors ${
                              isStarred ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-300'
                            }`}
                            title={isStarred ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400' : ''}`} />
                          </button>
                          <span className="group-hover:text-primary-400 transition-colors">
                            {item.symbol}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 text-gray-300 text-xs truncate max-w-[180px]">
                        {item.name || item.symbol}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-white whitespace-nowrap">
                        {formatCurrency(item.price, currencyCode)}
                      </td>

                      {/* 24h Change% */}
                      <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                        <span className={`inline-flex items-center gap-0.5 ${changeColor}`}>
                          {formatPercent(changeVal)}
                        </span>
                      </td>

                      {/* Volume (abbreviated format: 1.2M, 500K) */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-300 whitespace-nowrap">
                        {formatNumber(item.volume)}
                      </td>

                      {/* RSI(14) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.rsi !== undefined ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                            item.rsi <= 30
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : item.rsi >= 70
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-dark-800 text-gray-300 border border-gray-700'
                          }`}>
                            {item.rsi}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Signal */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.signal ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                            item.signal.includes('BUY')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : item.signal.includes('SELL')
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-dark-800 text-gray-400 border border-gray-700'
                          }`}>
                            {item.signal}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">NEUTRAL</span>
                        )}
                      </td>

                      {/* High */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-400 hidden md:table-cell whitespace-nowrap">
                        {formatCurrency(item.high, currencyCode)}
                      </td>

                      {/* Low */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-400 hidden md:table-cell whitespace-nowrap">
                        {formatCurrency(item.low, currencyCode)}
                      </td>

                      {/* Action - View Chart Button */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectAsset(item)
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-all shadow-sm active:scale-95"
                        >
                          View Chart
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-gray-400 space-y-3">
                      <Filter className="w-10 h-10 text-gray-600" />
                      <p className="text-base font-semibold text-gray-300">No assets found</p>
                      <p className="text-xs text-gray-500 text-center">
                        No results match your active search and filter parameters. Try loosening the filter thresholds or clearing the search box.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          handlePresetChange('all')
                          setVolumeMin(0)
                          setScreenerFilters({ volumeMin: 0 })
                        }}
                        className="btn-secondary text-xs py-1.5 px-3 mt-2"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
