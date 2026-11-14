import { useStore } from '../store/useStore'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { formatCurrency, formatPercent, getChangeColor, generateId, cryptoSymbols } from '../utils/helpers'
import { Wallet, TrendingUp, TrendingDown, History, RotateCcw, ShoppingCart, DollarSign, Target, PieChart, AlertTriangle } from 'lucide-react'

export default function PaperTrade() {
  const { prices, updatePrice, paperBalance, setPaperBalance, resetPaperTrading } = useStore()

  // State
  const [balance, setBalance] = useState(paperBalance || 100000)
  const [initialBalance, setInitialBalance] = useState(100000)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all') // 'all' | 'wins' | 'losses'

  // New Trade Form State
  const [symbol, setSymbol] = useState(cryptoSymbols[0] || 'BTCUSDT')
  const [side, setSide] = useState('buy') // 'buy' | 'sell'
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [strategy, setStrategy] = useState('Manual') // 'Manual' | 'RSI' | 'MACD' | 'EMA'

  // Helper to extract numeric price from store
  const getCurrentPrice = (sym) => {
    if (!sym) return 0
    const p = prices[sym]
    if (p === undefined || p === null) return 0
    if (typeof p === 'number') return p
    if (typeof p === 'string' && !isNaN(Number(p))) return Number(p)
    if (p.lastPrice) return parseFloat(p.lastPrice)
    if (p.price) return parseFloat(p.price)
    if (p.c) return parseFloat(p.c)
    if (p.close) return parseFloat(p.close)
    return 0
  }

  // Fetch paper trades from backend API
  const loadData = async () => {
    try {
      setLoading(true)
      const data = await api.getPaperTrades()
      if (data) {
        if (Array.isArray(data.trades)) {
          setTrades(data.trades)
        } else if (Array.isArray(data)) {
          setTrades(data)
        }
        if (typeof data.balance === 'number') {
          setBalance(data.balance)
          setPaperBalance(data.balance)
        }
        if (typeof data.initialBalance === 'number') {
          setInitialBalance(data.initialBalance)
        }
      }
    } catch (err) {
      console.error('Failed to fetch paper trades:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Auto-fill price when symbol changes or when price becomes available
  useEffect(() => {
    const cur = getCurrentPrice(symbol)
    if (cur > 0) {
      setPrice(cur.toString())
    } else {
      api.getCryptoPrice(symbol)
        .then(res => {
          const fetchedPrice = parseFloat(res?.lastPrice || res?.price || 0)
          if (fetchedPrice > 0) {
            updatePrice(symbol, fetchedPrice)
            setPrice(fetchedPrice.toString())
          }
        })
        .catch(err => {
          console.warn(`Could not load price for ${symbol}:`, err)
        })
    }
  }, [symbol])

  // Derive Open Positions and Closed Trades
  const openPositions = trades.filter(t => t.status === 'open')
  const closedTrades = trades.filter(t => t.status === 'closed')

  // Periodically refresh current prices for open positions & active symbol
  useEffect(() => {
    const symbolsToPoll = Array.from(new Set([symbol, ...openPositions.map(p => p.symbol)]))
    if (symbolsToPoll.length === 0) return

    const fetchLivePrices = async () => {
      try {
        const tickers = await api.getCryptoPrices(symbolsToPoll)
        if (Array.isArray(tickers)) {
          tickers.forEach(t => {
            const val = parseFloat(t.lastPrice)
            if (!isNaN(val)) updatePrice(t.symbol, val)
          })
        }
      } catch {
        // Fallback to single quote if batch fails
        try {
          const t = await api.getCryptoPrice(symbol)
          const val = parseFloat(t?.lastPrice)
          if (!isNaN(val)) updatePrice(symbol, val)
        } catch {}
      }
    }

    fetchLivePrices()
    const timer = setInterval(fetchLivePrices, 5000)
    return () => clearInterval(timer)
  }, [symbol, openPositions.map(p => p.id).join(',')])

  // Calculate Account Metrics
  const totalClosedPnl = closedTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0)
  const winningTrades = closedTrades.filter(t => (Number(t.pnl) || 0) > 0)
  const losingTrades = closedTrades.filter(t => (Number(t.pnl) || 0) <= 0)
  const winRate = closedTrades.length > 0
    ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1)
    : '0.0'

  // Order Calculations
  const numQty = parseFloat(quantity) || 0
  const numPrice = parseFloat(price) || 0
  const totalCost = numQty * numPrice
  const isInsufficientBalance = side === 'buy' && totalCost > balance

  // Handler: Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!numQty || numQty <= 0) {
      setError('Please enter a valid quantity greater than 0.')
      return
    }

    if (!numPrice || numPrice <= 0) {
      setError('Please enter a valid price greater than 0.')
      return
    }

    if (isInsufficientBalance) {
      setError(`Insufficient balance! Required: ${formatCurrency(totalCost)}, Available: ${formatCurrency(balance)}`)
      return
    }

    try {
      setSubmitting(true)
      const tradePayload = {
        symbol,
        type: 'crypto',
        side: side.toLowerCase(),
        quantity: numQty,
        price: numPrice,
        strategy: strategy || 'Manual'
      }

      await api.savePaperTrade(tradePayload)
      setSuccess(`Order placed successfully: ${side.toUpperCase()} ${numQty} ${symbol} @ ${formatCurrency(numPrice)}`)
      setQuantity('')
      await loadData()
    } catch (err) {
      console.error('Order placement failed:', err)
      setError(err.response?.data?.error || err.message || 'Failed to place paper trade.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handler: Close Position
  const handleClosePosition = async (pos) => {
    setError('')
    setSuccess('')
    const exitPrice = getCurrentPrice(pos.symbol) || Number(pos.entry_price)
    try {
      setLoading(true)
      if (api.closePaperTrade) {
        await api.closePaperTrade(pos.id, exitPrice)
      } else {
        // Fallback direct call if helper not defined
        const axios = (await import('axios')).default
        await axios.post(`/api/paper-trade/close/${pos.id}`, { exitPrice })
      }
      setSuccess(`Closed position for ${pos.symbol} at ${formatCurrency(exitPrice)}`)
      await loadData()
    } catch (err) {
      console.error('Failed to close position:', err)
      setError(err.response?.data?.error || err.message || 'Failed to close position.')
    } finally {
      setLoading(false)
    }
  }

  // Handler: Reset Account
  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your paper trading account?\n\nThis will clear all positions, trade history, and reset your virtual balance back to ₹1,00,000.'
    )
    if (!confirmed) return

    setError('')
    setSuccess('')
    try {
      setLoading(true)
      await api.resetPaperTrade()
      resetPaperTrading()
      setBalance(100000)
      setTrades([])
      setSuccess('Paper trading account successfully reset to ₹1,00,000.')
      await loadData()
    } catch (err) {
      console.error('Failed to reset account:', err)
      setError(err.response?.data?.error || err.message || 'Failed to reset paper trade account.')
    } finally {
      setLoading(false)
    }
  }

  // Quick allocation buttons
  const handlePercentAllocate = (pct) => {
    const curP = parseFloat(price) || getCurrentPrice(symbol)
    if (!curP || curP <= 0) return
    const allocAmount = (balance * pct) / 100
    const calculatedQty = (allocAmount / curP).toFixed(4)
    setQuantity(calculatedQty)
  }

  // Filtered History (max 200)
  const filteredHistory = closedTrades.filter(t => {
    const pnlVal = Number(t.pnl) || 0
    if (historyFilter === 'wins') return pnlVal > 0
    if (historyFilter === 'losses') return pnlVal <= 0
    return true
  }).slice(0, 200)

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary-400" />
            Paper Trading
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Simulate cryptocurrency trading risk-free with virtual currency in real-time market conditions.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="btn-danger flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
          title="Reset account to initial ₹1,00,000 balance"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Account</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-white text-xs ml-4">✕</button>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-white text-xs ml-4">✕</button>
        </div>
      )}

      {/* 1. Account Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="card border-l-4 border-l-primary-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="stat-label">Virtual Balance</span>
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="stat-value text-white">{formatCurrency(balance)}</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
              <span>Initial: {formatCurrency(initialBalance || 100000)}</span>
              <span className={balance >= (initialBalance || 100000) ? 'text-emerald-400' : 'text-red-400'}>
                {formatPercent(((balance - (initialBalance || 100000)) / (initialBalance || 100000)) * 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Total P&L Card */}
        <div className={`card border-l-4 ${totalClosedPnl >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'} flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <span className="stat-label">Total Realized P&L</span>
            <div className={`p-2 rounded-lg ${totalClosedPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {totalClosedPnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-2">
            <div className={`stat-value ${getChangeColor(totalClosedPnl)}`}>
              {totalClosedPnl >= 0 ? `+${formatCurrency(totalClosedPnl)}` : formatCurrency(totalClosedPnl)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Sum of {closedTrades.length} closed {closedTrades.length === 1 ? 'trade' : 'trades'}
            </div>
          </div>
        </div>

        {/* Open Positions Card */}
        <div className="card border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="stat-label">Open Positions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="stat-value text-white">{openPositions.length}</div>
            <div className="text-xs text-gray-400 mt-1">
              Active market exposures
            </div>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="card border-l-4 border-l-purple-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="stat-label">Win Rate</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="stat-value text-white">{winRate}%</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-medium">{winningTrades.length}W</span>
              <span>/</span>
              <span className="text-red-400 font-medium">{losingTrades.length}L</span>
              <span className="text-gray-500">({closedTrades.length} closed)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: New Trade Form + Open Positions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. New Trade Form Card (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-white">Place Virtual Order</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">Spot • Crypto</span>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Symbol Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="input-field cursor-pointer"
              >
                {cryptoSymbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Side: Buy / Sell Toggle Buttons */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Order Side</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('buy')}
                  className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    side === 'buy'
                      ? 'btn-success shadow-lg shadow-emerald-500/20'
                      : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setSide('sell')}
                  className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    side === 'sell'
                      ? 'btn-danger shadow-lg shadow-red-500/20'
                      : 'bg-dark-900 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>
            </div>

            {/* Price Input with Live auto-fill */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">Price (INR)</label>
                {getCurrentPrice(symbol) > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrice(getCurrentPrice(symbol).toString())}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Live: {formatCurrency(getCurrentPrice(symbol))}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-7"
                  required
                />
              </div>
            </div>

            {/* Quantity Input with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">Quantity</label>
                <div className="flex items-center gap-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentAllocate(pct)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-dark-900 hover:bg-dark-700 text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>

            {/* Strategy Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Strategy (Optional)</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="input-field cursor-pointer"
              >
                <option value="Manual">Manual Discretionary</option>
                <option value="RSI">RSI Oversold / Overbought</option>
                <option value="MACD">MACD Crossover</option>
                <option value="EMA">EMA Trend Following</option>
              </select>
            </div>

            {/* Total Cost Display */}
            <div className="p-3 rounded-lg bg-dark-900/90 border border-gray-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Total Order Value:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Available Capital:</span>
                <span className={`font-mono ${isInsufficientBalance ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              {isInsufficientBalance && (
                <div className="text-[11px] text-red-400 flex items-center gap-1 pt-1 border-t border-gray-800/80">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cost exceeds available balance!</span>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={submitting || isInsufficientBalance || numQty <= 0 || numPrice <= 0}
              className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                side === 'buy'
                  ? 'btn-success'
                  : 'btn-danger'
              } ${isInsufficientBalance || numQty <= 0 || numPrice <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {submitting ? 'Placing Order...' : `Place ${side.toUpperCase()} Order`}
              </span>
            </button>
          </form>
        </div>

        {/* 3. Open Positions Table (7-8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-white">Open Positions</h2>
                <span className="badge-blue text-xs ml-1">{openPositions.length}</span>
              </div>
              <span className="text-xs text-gray-400">Live mark-to-market</span>
            </div>

            <div className="overflow-x-auto mt-3">
              {openPositions.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="text-sm font-medium text-gray-400">No active positions</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a symbol and place a virtual order above to begin trading.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 uppercase text-[11px] tracking-wider">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-2">Side</th>
                      <th className="py-2.5 px-2 text-right">Qty</th>
                      <th className="py-2.5 px-2 text-right">Entry Price</th>
                      <th className="py-2.5 px-2 text-right">Current Price</th>
                      <th className="py-2.5 px-2 text-right">P&L</th>
                      <th className="py-2.5 px-2 text-right">P&L%</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-mono">
                    {openPositions.map((pos) => {
                      const isBuy = (pos.side || '').toLowerCase() === 'buy'
                      const entryP = Number(pos.entry_price) || 0
                      const curP = getCurrentPrice(pos.symbol) || entryP
                      const qty = Number(pos.quantity) || 0
                      const pnl = isBuy
                        ? (curP - entryP) * qty
                        : (entryP - curP) * qty
                      const pnlPercent = (entryP > 0 && qty > 0)
                        ? (pnl / (entryP * qty)) * 100
                        : 0

                      return (
                        <tr key={pos.id || generateId()} className="hover:bg-dark-900/50 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center gap-1.5">
                            <span>{pos.symbol}</span>
                            {pos.strategy && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-dark-900 border border-gray-700/60 text-gray-400 rounded">
                                {pos.strategy}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 font-sans">
                            <span className={isBuy ? 'badge-green' : 'badge-red'}>
                              {pos.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-gray-200">
                            {qty.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right text-gray-300">
                            {formatCurrency(entryP)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-white font-semibold">
                            {formatCurrency(curP)}
                          </td>
                          <td className={`py-2.5 px-2 text-right font-semibold ${getChangeColor(pnl)}`}>
                            {pnl >= 0 ? `+${formatCurrency(pnl)}` : formatCurrency(pnl)}
                          </td>
                          <td className={`py-2.5 px-2 text-right font-semibold ${getChangeColor(pnlPercent)}`}>
                            {formatPercent(pnlPercent)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleClosePosition(pos)}
                              disabled={loading}
                              className="btn-danger text-xs px-2.5 py-1 rounded cursor-pointer"
                              title="Close position at current market price"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Table Footer info */}
          {openPositions.length > 0 && (
            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span>Prices automatically update every 5 seconds</span>
              <span>{openPositions.length} active {openPositions.length === 1 ? 'position' : 'positions'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Trade History Table Card */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Trade History</h2>
            <span className="badge-yellow text-xs ml-1">{closedTrades.length}</span>
          </div>

          {/* Filter Tabs: All / Wins / Losses */}
          <div className="flex bg-dark-900 border border-gray-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setHistoryFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                historyFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({closedTrades.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('wins')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                historyFilter === 'wins'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Wins ({winningTrades.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('losses')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                historyFilter === 'losses'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Losses ({losingTrades.length})
            </button>
          </div>
        </div>

        {/* Scrollable Table (max 200 rows) */}
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="py-14 text-center text-gray-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">No closed trades found</p>
              <p className="text-xs text-gray-500 mt-1">
                {historyFilter === 'all'
                  ? 'Closed positions and executed trade results will be logged here.'
                  : `No ${historyFilter} recorded in trade history.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-dark-900 z-10">
                <tr className="border-b border-gray-800 text-gray-400 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2">Symbol</th>
                  <th className="py-2.5 px-2">Side</th>
                  <th className="py-2.5 px-2 text-right">Entry</th>
                  <th className="py-2.5 px-2 text-right">Exit</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-right">P&L</th>
                  <th className="py-2.5 px-3">Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {filteredHistory.map((trade) => {
                  const isBuy = (trade.side || '').toLowerCase() === 'buy'
                  const pnl = Number(trade.pnl) || 0
                  const tradeDate = trade.closed_at || trade.created_at
                  const formattedDate = tradeDate
                    ? new Date(tradeDate).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : '—'

                  return (
                    <tr key={trade.id || generateId()} className="hover:bg-dark-900/50 transition-colors">
                      <td className="py-2.5 px-3 text-gray-400 font-sans whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-2.5 px-2 font-sans font-medium text-white">
                        {trade.symbol}
                      </td>
                      <td className="py-2.5 px-2 font-sans">
                        <span className={isBuy ? 'badge-green' : 'badge-red'}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-300">
                        {formatCurrency(trade.entry_price)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-200">
                        {formatCurrency(trade.exit_price)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-300">
                        {Number(trade.quantity).toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-2 text-right font-semibold ${getChangeColor(pnl)}`}>
                        {pnl >= 0 ? `+${formatCurrency(pnl)}` : formatCurrency(pnl)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-gray-400">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-dark-900 border border-gray-800 text-gray-300">
                          {trade.strategy || 'Manual'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        {filteredHistory.length > 0 && (
          <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filteredHistory.length} of {closedTrades.length} closed trades (max 200)</span>
            <span>Total Realized: <span className={`font-semibold ${getChangeColor(totalClosedPnl)}`}>{totalClosedPnl >= 0 ? '+' : ''}{formatCurrency(totalClosedPnl)}</span></span>
          </div>
        )}
      </div>
    </div>
  )
}
