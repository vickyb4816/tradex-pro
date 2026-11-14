import { useStore } from '../store/useStore'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import { api, BinanceWS } from '../services/api'
import {
  SMA,
  EMA,
  WMA,
  HMA,
  RSI,
  MACD,
  BollingerBands,
  VWAP,
  Supertrend,
  ATR,
  StochRSI,
  OBV,
  ADX,
  CCI,
  WilliamsR,
  DonchianChannels,
  KeltnerChannels,
  ParabolicSAR,
  MFI,
  ROC,
  PivotPoints,
} from '../utils/indicators'
import { timeframes, formatCurrency, formatNumber } from '../utils/helpers'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  TrendingUp,
  Clock,
  Layers,
  Settings2,
  Plus,
  Minus,
  MousePointer,
  Square,
  Type,
  Undo2,
  Trash2,
  Ruler,
  Sliders,
  Activity,
  X,
  Search,
  Check,
} from 'lucide-react'

// Comprehensive list of 22+ Technical Indicators
const ALL_INDICATORS = [
  // Moving Averages
  { key: 'sma20', name: 'SMA (20)', category: 'Moving Averages', color: '#eab308', overlay: true },
  { key: 'sma50', name: 'SMA (50)', category: 'Moving Averages', color: '#f59e0b', overlay: true },
  { key: 'sma200', name: 'SMA (200)', category: 'Moving Averages', color: '#ef4444', overlay: true },
  { key: 'ema9', name: 'EMA (9)', category: 'Moving Averages', color: '#38bdf8', overlay: true },
  { key: 'ema21', name: 'EMA (21)', category: 'Moving Averages', color: '#ec4899', overlay: true },
  { key: 'ema50', name: 'EMA (50)', category: 'Moving Averages', color: '#8b5cf6', overlay: true },
  { key: 'ema200', name: 'EMA (200)', category: 'Moving Averages', color: '#f97316', overlay: true },
  { key: 'wma20', name: 'WMA (20)', category: 'Moving Averages', color: '#10b981', overlay: true },
  { key: 'hma20', name: 'Hull MA (20)', category: 'Moving Averages', color: '#06b6d4', overlay: true },

  // Trend & Overlays
  { key: 'bb', name: 'Bollinger Bands (20, 2)', category: 'Trend & Bands', color: '#22d3ee', overlay: true },
  { key: 'vwap', name: 'VWAP', category: 'Trend & Bands', color: '#fbbf24', overlay: true },
  { key: 'supertrend', name: 'Supertrend (10, 3)', category: 'Trend & Bands', color: '#22c55e', overlay: true },
  { key: 'keltner', name: 'Keltner Channels (20, 2)', category: 'Trend & Bands', color: '#a78bfa', overlay: true },
  { key: 'donchian', name: 'Donchian Channels (20)', category: 'Trend & Bands', color: '#fb7185', overlay: true },
  { key: 'psar', name: 'Parabolic SAR', category: 'Trend & Bands', color: '#cbd5e1', overlay: true },

  // Momentum & Oscillators
  { key: 'rsi', name: 'RSI (14)', category: 'Oscillators', color: '#a855f7', overlay: false },
  { key: 'stochRsi', name: 'Stochastic RSI', category: 'Oscillators', color: '#06b6d4', overlay: false },
  { key: 'macd', name: 'MACD (12, 26, 9)', category: 'Oscillators', color: '#f97316', overlay: false },
  { key: 'cci', name: 'CCI (20)', category: 'Oscillators', color: '#3b82f6', overlay: false },
  { key: 'williamsR', name: 'Williams %R (14)', category: 'Oscillators', color: '#ec4899', overlay: false },
  { key: 'roc', name: 'Rate of Change (12)', category: 'Oscillators', color: '#14b8a6', overlay: false },

  // Volatility & Volume
  { key: 'atr', name: 'Average True Range (14)', category: 'Volatility & Volume', color: '#eab308', overlay: false },
  { key: 'obv', name: 'On-Balance Volume (OBV)', category: 'Volatility & Volume', color: '#60a5fa', overlay: false },
  { key: 'adx', name: 'ADX Trend Strength (14)', category: 'Volatility & Volume', color: '#f43f5e', overlay: false },
  { key: 'mfi', name: 'Money Flow Index (14)', category: 'Volatility & Volume', color: '#10b981', overlay: false },
]

export default function Charts() {
  const { selectedSymbol, setSelectedSymbol, timeframe, setTimeframe, updatePrice } = useStore()

  // Safely extract symbol string from store
  const currentSymbol = typeof selectedSymbol === 'object' && selectedSymbol !== null
    ? (selectedSymbol.symbol || 'BTCUSDT')
    : (selectedSymbol || 'BTCUSDT')

  // UI States
  const [symbolInput, setSymbolInput] = useState(currentSymbol)
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentOHLCV, setCurrentOHLCV] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [indicatorSearch, setIndicatorSearch] = useState('')
  const [indicatorCategory, setIndicatorCategory] = useState('All')
  const [chartReady, setChartReady] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState('select') // 'select' | 'trendline' | 'horizontal' | 'vertical' | 'fibonacci' | 'box' | 'measure' | 'text'
  const [drawings, setDrawings] = useState([])
  const [drawingStart, setDrawingStart] = useState(null)
  const [drawingPreview, setDrawingPreview] = useState(null)

  // Chart settings
  const [chartSettings, setChartSettings] = useState({
    showGrid: true,
    showVolume: true,
  })

  // Indicator active toggles
  const [indicators, setIndicators] = useState({
    sma20: false,
    ema9: true,
    ema21: false,
    bb: false,
    rsi: false,
    macd: false,
  })

  // DOM and Chart references
  const containerRef = useRef(null)
  const chartContainerRef = useRef(null)
  const overlayRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const indicatorSeriesMap = useRef({})
  const rawCandlesRef = useRef([])
  const latestCandleRef = useRef(null)
  const wsRef = useRef(null)
  const lastIndicatorUpdateRef = useRef(0)
  const indicatorsRef = useRef(indicators)

  useEffect(() => {
    indicatorsRef.current = indicators
  }, [indicators])

  useEffect(() => {
    setSymbolInput(currentSymbol)
    // Load drawings from localStorage for this symbol
    try {
      const saved = localStorage.getItem(`tradex_drawings_${currentSymbol}`)
      if (saved) {
        setDrawings(JSON.parse(saved))
      } else {
        setDrawings([])
      }
    } catch {
      setDrawings([])
    }
  }, [currentSymbol])

  // Save drawings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`tradex_drawings_${currentSymbol}`, JSON.stringify(drawings))
    } catch {}
  }, [drawings, currentSymbol])

  // Timeframes requested in requirements: 1m, 5m, 15m, 30m, 1H, 4H, 1D, 1W, 1M
  const targetLabels = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M']
  const displayTimeframes = timeframes.filter(tf => targetLabels.includes(tf.label))

  // Popular symbols for quick selector
  const popularSymbols = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto' },
    { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto' },
    { symbol: 'BNBUSDT', name: 'BNB', type: 'crypto' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', type: 'crypto' },
    { symbol: 'AVAXUSDT', name: 'Avalanche', type: 'crypto' },
    { symbol: 'RELIANCE.NS', name: 'Reliance', type: 'indian' },
    { symbol: 'TCS.NS', name: 'TCS', type: 'indian' },
    { symbol: 'INFY.NS', name: 'Infosys', type: 'indian' },
  ]

  // Helper to map computed indicator values to lightweight-charts data format
  const mapToSeriesData = useCallback((candles, values) => {
    const res = []
    if (!candles || !values) return res
    const count = Math.min(candles.length, values.length)
    for (let i = 0; i < count; i++) {
      const v = values[i]
      if (v !== null && v !== undefined && !isNaN(v)) {
        res.push({ time: candles[i].time, value: v })
      }
    }
    return res
  }, [])

  // Apply or update all indicators on the chart
  const applyIndicators = useCallback((candles, activeIndicators) => {
    if (!chartRef.current || !candles || candles.length === 0) return
    const chart = chartRef.current
    const closes = candles.map(c => c.close)
    const highs = candles.map(c => c.high)
    const lows = candles.map(c => c.low)
    const volumes = candles.map(c => c.volume || 1000)

    const hasSubPane = activeIndicators.rsi || activeIndicators.macd || activeIndicators.stochRsi || activeIndicators.cci || activeIndicators.atr || activeIndicators.obv || activeIndicators.mfi || activeIndicators.adx

    // Dynamic scale margins
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.08, bottom: hasSubPane ? 0.32 : 0.20 },
    })
    volumeSeriesRef.current?.priceScale().applyOptions({
      scaleMargins: { top: hasSubPane ? 0.68 : 0.80, bottom: hasSubPane ? 0.32 : 0 },
    })

    const updateLineSeries = (key, data, options) => {
      if (activeIndicators[key]) {
        if (!indicatorSeriesMap.current[key]) {
          indicatorSeriesMap.current[key] = chart.addLineSeries({
            lineWidth: 1.5,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            ...options,
          })
        }
        indicatorSeriesMap.current[key].setData(mapToSeriesData(candles, data))
      } else if (indicatorSeriesMap.current[key]) {
        try { chart.removeSeries(indicatorSeriesMap.current[key]) } catch {}
        delete indicatorSeriesMap.current[key]
      }
    }

    // 1. Moving Averages
    updateLineSeries('sma20', SMA(closes, 20), { color: '#eab308', title: 'SMA(20)' })
    updateLineSeries('sma50', SMA(closes, 50), { color: '#f59e0b', title: 'SMA(50)' })
    updateLineSeries('sma200', SMA(closes, 200), { color: '#ef4444', title: 'SMA(200)' })
    updateLineSeries('ema9', EMA(closes, 9), { color: '#38bdf8', title: 'EMA(9)' })
    updateLineSeries('ema21', EMA(closes, 21), { color: '#ec4899', title: 'EMA(21)' })
    updateLineSeries('ema50', EMA(closes, 50), { color: '#8b5cf6', title: 'EMA(50)' })
    updateLineSeries('ema200', EMA(closes, 200), { color: '#f97316', title: 'EMA(200)' })
    updateLineSeries('wma20', WMA(closes, 20), { color: '#10b981', title: 'WMA(20)' })
    updateLineSeries('hma20', HMA(closes, 20), { color: '#06b6d4', title: 'HMA(20)' })

    // 2. VWAP
    updateLineSeries('vwap', VWAP(highs, lows, closes, volumes), { color: '#fbbf24', title: 'VWAP', lineWidth: 2 })

    // 3. Supertrend
    if (activeIndicators.supertrend) {
      const st = Supertrend(highs, lows, closes, 10, 3)
      const stData = st.map(s => s.value)
      updateLineSeries('supertrend', stData, { color: '#22c55e', title: 'Supertrend', lineWidth: 2 })
    } else {
      updateLineSeries('supertrend', null)
    }

    // 4. Bollinger Bands
    if (activeIndicators.bb) {
      const bb = BollingerBands(closes, 20, 2)
      updateLineSeries('bbUpper', bb.upper, { color: '#22d3ee', lineStyle: 2, title: 'BB Up' })
      updateLineSeries('bbMiddle', bb.middle, { color: '#64748b', lineStyle: 1, title: 'BB Mid' })
      updateLineSeries('bbLower', bb.lower, { color: '#22d3ee', lineStyle: 2, title: 'BB Low' })
    } else {
      ;['bbUpper', 'bbMiddle', 'bbLower'].forEach(k => updateLineSeries(k, null))
    }

    // 5. Keltner Channels
    if (activeIndicators.keltner) {
      const kc = KeltnerChannels(highs, lows, closes, 20, 2)
      updateLineSeries('kcUpper', kc.upper, { color: '#a78bfa', lineStyle: 2, title: 'KC Up' })
      updateLineSeries('kcLower', kc.lower, { color: '#a78bfa', lineStyle: 2, title: 'KC Low' })
    } else {
      ;['kcUpper', 'kcLower'].forEach(k => updateLineSeries(k, null))
    }

    // 6. Donchian Channels
    if (activeIndicators.donchian) {
      const dc = DonchianChannels(highs, lows, closes, 20)
      updateLineSeries('dcUpper', dc.upper, { color: '#fb7185', lineStyle: 2, title: 'DC Up' })
      updateLineSeries('dcLower', dc.lower, { color: '#fb7185', lineStyle: 2, title: 'DC Low' })
    } else {
      ;['dcUpper', 'dcLower'].forEach(k => updateLineSeries(k, null))
    }

    // 7. Parabolic SAR
    updateLineSeries('psar', ParabolicSAR(highs, lows), { color: '#cbd5e1', lineStyle: 3, title: 'PSAR' })

    // 8. RSI (Sub-pane)
    if (activeIndicators.rsi) {
      if (!indicatorSeriesMap.current.rsi) {
        indicatorSeriesMap.current.rsi = chart.addLineSeries({
          color: '#a855f7',
          lineWidth: 2,
          priceScaleId: 'rsi',
          title: 'RSI(14)',
          priceLineVisible: false,
          autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
        })
        try {
          indicatorSeriesMap.current.rsi.createPriceLine({ price: 70, color: 'rgba(239, 68, 68, 0.45)', lineWidth: 1, lineStyle: 2, title: '70' })
          indicatorSeriesMap.current.rsi.createPriceLine({ price: 30, color: 'rgba(34, 197, 94, 0.45)', lineWidth: 1, lineStyle: 2, title: '30' })
        } catch {}
      }
      chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.72, bottom: 0.02 } })
      indicatorSeriesMap.current.rsi.setData(mapToSeriesData(candles, RSI(closes, 14)))
    } else if (indicatorSeriesMap.current.rsi) {
      try { chart.removeSeries(indicatorSeriesMap.current.rsi) } catch {}
      delete indicatorSeriesMap.current.rsi
    }

    // 9. MACD (Sub-pane)
    if (activeIndicators.macd) {
      if (!indicatorSeriesMap.current.macdLine) {
        indicatorSeriesMap.current.macdLine = chart.addLineSeries({ color: '#38bdf8', lineWidth: 1.5, priceScaleId: 'macd', title: 'MACD' })
        indicatorSeriesMap.current.macdSignal = chart.addLineSeries({ color: '#f97316', lineWidth: 1.5, priceScaleId: 'macd', title: 'Signal' })
        indicatorSeriesMap.current.macdHist = chart.addHistogramSeries({ priceScaleId: 'macd', title: 'Hist' })
      }
      chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.82, bottom: 0.02 } })
      const macdRes = MACD(closes, 12, 26, 9)
      indicatorSeriesMap.current.macdLine.setData(mapToSeriesData(candles, macdRes.macd))
      indicatorSeriesMap.current.macdSignal.setData(mapToSeriesData(candles, macdRes.signal))
      const histData = []
      for (let i = 0; i < candles.length; i++) {
        const h = macdRes.histogram[i]
        if (h !== null && h !== undefined && !isNaN(h)) {
          histData.push({ time: candles[i].time, value: h, color: h >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)' })
        }
      }
      indicatorSeriesMap.current.macdHist.setData(histData)
    } else {
      ;['macdLine', 'macdSignal', 'macdHist'].forEach(k => {
        if (indicatorSeriesMap.current[k]) {
          try { chart.removeSeries(indicatorSeriesMap.current[k]) } catch {}
          delete indicatorSeriesMap.current[k]
        }
      })
    }

    // 10. StochRSI
    if (activeIndicators.stochRsi) {
      if (!indicatorSeriesMap.current.stochK) {
        indicatorSeriesMap.current.stochK = chart.addLineSeries({ color: '#06b6d4', lineWidth: 1.5, priceScaleId: 'stoch', title: 'Stoch %K' })
        indicatorSeriesMap.current.stochD = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5, priceScaleId: 'stoch', title: 'Stoch %D' })
      }
      chart.priceScale('stoch').applyOptions({ scaleMargins: { top: 0.75, bottom: 0.02 } })
      const stoch = StochRSI(closes, 14, 14, 3, 3)
      indicatorSeriesMap.current.stochK.setData(mapToSeriesData(candles, stoch.k))
      indicatorSeriesMap.current.stochD.setData(mapToSeriesData(candles, stoch.d))
    } else {
      ;['stochK', 'stochD'].forEach(k => {
        if (indicatorSeriesMap.current[k]) {
          try { chart.removeSeries(indicatorSeriesMap.current[k]) } catch {}
          delete indicatorSeriesMap.current[k]
        }
      })
    }

    // 11. CCI
    if (activeIndicators.cci) {
      if (!indicatorSeriesMap.current.cci) {
        indicatorSeriesMap.current.cci = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1.5, priceScaleId: 'cci', title: 'CCI(20)' })
      }
      chart.priceScale('cci').applyOptions({ scaleMargins: { top: 0.78, bottom: 0.02 } })
      indicatorSeriesMap.current.cci.setData(mapToSeriesData(candles, CCI(highs, lows, closes, 20)))
    } else if (indicatorSeriesMap.current.cci) {
      try { chart.removeSeries(indicatorSeriesMap.current.cci) } catch {}
      delete indicatorSeriesMap.current.cci
    }

    // 12. ATR
    if (activeIndicators.atr) {
      if (!indicatorSeriesMap.current.atr) {
        indicatorSeriesMap.current.atr = chart.addLineSeries({ color: '#eab308', lineWidth: 1.5, priceScaleId: 'atr', title: 'ATR(14)' })
      }
      chart.priceScale('atr').applyOptions({ scaleMargins: { top: 0.82, bottom: 0.02 } })
      indicatorSeriesMap.current.atr.setData(mapToSeriesData(candles, ATR(highs, lows, closes, 14)))
    } else if (indicatorSeriesMap.current.atr) {
      try { chart.removeSeries(indicatorSeriesMap.current.atr) } catch {}
      delete indicatorSeriesMap.current.atr
    }

    // 13. OBV
    if (activeIndicators.obv) {
      if (!indicatorSeriesMap.current.obv) {
        indicatorSeriesMap.current.obv = chart.addLineSeries({ color: '#60a5fa', lineWidth: 1.5, priceScaleId: 'obv', title: 'OBV' })
      }
      chart.priceScale('obv').applyOptions({ scaleMargins: { top: 0.80, bottom: 0.02 } })
      indicatorSeriesMap.current.obv.setData(mapToSeriesData(candles, OBV(closes, volumes)))
    } else if (indicatorSeriesMap.current.obv) {
      try { chart.removeSeries(indicatorSeriesMap.current.obv) } catch {}
      delete indicatorSeriesMap.current.obv
    }
  }, [mapToSeriesData])

  // Toggle single indicator
  const toggleIndicator = (key) => {
    setIndicators(prev => {
      const next = { ...prev, [key]: !prev[key] }
      if (rawCandlesRef.current && rawCandlesRef.current.length > 0) {
        applyIndicators(rawCandlesRef.current, next)
      }
      return next
    })
  }

  // Handle symbol change submit
  const handleSymbolSubmit = (e) => {
    if (e) e.preventDefault()
    const clean = symbolInput.trim().toUpperCase()
    if (!clean) return
    setIsSymbolDropdownOpen(false)

    if (clean !== currentSymbol) {
      setSelectedSymbol({
        symbol: clean,
        name: clean,
        type: clean.includes('.NS') || clean.includes('.BO') ? 'indian' : 'crypto',
      })
    }
  }

  const selectQuickSymbol = (item) => {
    setSymbolInput(item.symbol)
    setIsSymbolDropdownOpen(false)
    setSelectedSymbol(item)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  const handleZoomIn = () => {
    const timeScale = chartRef.current?.timeScale()
    if (!timeScale) return
    const logicalRange = timeScale.getVisibleLogicalRange()
    if (logicalRange) {
      const delta = (logicalRange.to - logicalRange.from) * 0.15
      timeScale.setVisibleLogicalRange({ from: logicalRange.from + delta, to: logicalRange.to - delta })
    }
  }

  const handleZoomOut = () => {
    const timeScale = chartRef.current?.timeScale()
    if (!timeScale) return
    const logicalRange = timeScale.getVisibleLogicalRange()
    if (logicalRange) {
      const delta = (logicalRange.to - logicalRange.from) * 0.15
      timeScale.setVisibleLogicalRange({ from: logicalRange.from - delta, to: logicalRange.to + delta })
    }
  }

  const handleResetZoom = () => {
    chartRef.current?.timeScale().fitContent()
  }

  // Drawing mouse handlers on SVG Overlay
  const getCoordinates = (e) => {
    if (!overlayRef.current) return { x: 0, y: 0 }
    const rect = overlayRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleOverlayMouseDown = (e) => {
    if (activeTool === 'select') return
    const coords = getCoordinates(e)

    if (activeTool === 'horizontal') {
      const newD = {
        id: Date.now().toString(),
        type: 'horizontal',
        y: coords.y,
        color: '#f59e0b',
        price: currentOHLCV?.close || 'Target',
      }
      setDrawings(prev => [...prev, newD])
      setActiveTool('select')
      return
    }

    if (activeTool === 'vertical') {
      const newD = {
        id: Date.now().toString(),
        type: 'vertical',
        x: coords.x,
        color: '#a855f7',
      }
      setDrawings(prev => [...prev, newD])
      setActiveTool('select')
      return
    }

    if (activeTool === 'text') {
      const text = prompt('Enter annotation text:')
      if (text) {
        const newD = {
          id: Date.now().toString(),
          type: 'text',
          x: coords.x,
          y: coords.y,
          text,
          color: '#ffffff',
        }
        setDrawings(prev => [...prev, newD])
      }
      setActiveTool('select')
      return
    }

    // Two-point tools: trendline, fibonacci, box, measure
    if (!drawingStart) {
      setDrawingStart(coords)
      setDrawingPreview({ ...coords, endX: coords.x, endY: coords.y, type: activeTool })
    } else {
      // Finish two-point tool
      const newD = {
        id: Date.now().toString(),
        type: activeTool,
        x1: drawingStart.x,
        y1: drawingStart.y,
        x2: coords.x,
        y2: coords.y,
        color: activeTool === 'fibonacci' ? '#06b6d4' : activeTool === 'box' ? '#3b82f6' : '#38bdf8',
      }
      setDrawings(prev => [...prev, newD])
      setDrawingStart(null)
      setDrawingPreview(null)
      setActiveTool('select')
    }
  }

  const handleOverlayMouseMove = (e) => {
    if (!drawingStart || activeTool === 'select') return
    const coords = getCoordinates(e)
    setDrawingPreview(prev => ({ ...prev, endX: coords.x, endY: coords.y }))
  }

  const undoDrawing = () => {
    setDrawings(prev => prev.slice(0, -1))
  }

  const clearDrawings = () => {
    setDrawings([])
    setDrawingStart(null)
    setDrawingPreview(null)
  }

  // Initialize TradingView Lightweight Chart in useEffect
  useEffect(() => {
    if (!chartContainerRef.current) return
    const container = chartContainerRef.current

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0f' },
        textColor: '#9ca3af',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: chartSettings.showGrid ? '#1e293b' : 'transparent' },
        horzLines: { color: chartSettings.showGrid ? '#1e293b' : 'transparent' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#475569', width: 1, style: 3, labelBackgroundColor: '#1e293b' },
        horzLine: { color: '#475569', width: 1, style: 3, labelBackgroundColor: '#1e293b' },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.08, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth || 800,
      height: container.clientHeight || 550,
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries
    setChartReady(true)

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        if (latestCandleRef.current) setCurrentOHLCV(latestCandleRef.current)
        return
      }
      const candleData = param.seriesData.get(candlestickSeries)
      if (candleData) {
        const volData = param.seriesData.get(volumeSeries)
        setCurrentOHLCV({
          time: param.time,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData ? volData.value : (latestCandleRef.current?.volume || 0),
        })
      } else if (latestCandleRef.current) {
        setCurrentOHLCV(latestCandleRef.current)
      }
    })

    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth, height: container.clientHeight })
      }
    }
    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current) {
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) chartRef.current.applyOptions({ width, height })
      }
    })
    resizeObserver.observe(container)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      chart.remove()
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
      indicatorSeriesMap.current = {}
    }
  }, [])

  // Update chart options when chartSettings change
  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      grid: {
        vertLines: { color: chartSettings.showGrid ? '#1e293b' : 'transparent' },
        horzLines: { color: chartSettings.showGrid ? '#1e293b' : 'transparent' },
      },
    })
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: chartSettings.showVolume })
    }
  }, [chartSettings])

  // Fetch historical data & connect WebSocket on symbol/timeframe change
  useEffect(() => {
    if (!chartReady || !candlestickSeriesRef.current || !volumeSeriesRef.current) return

    let isCancelled = false
    setLoading(true)

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setWsConnected(false)
    }

    const cleanSymbol = currentSymbol.trim().toUpperCase()
    const apiInterval = (timeframe === '1M' ? '1M' : timeframe.toLowerCase())
    const isCrypto = !cleanSymbol.includes('.NS') && !cleanSymbol.includes('.BO')

    const loadData = async () => {
      try {
        let klines = []
        if (isCrypto) {
          klines = await api.getCryptoKlines(cleanSymbol, apiInterval, 500)
        } else {
          klines = await api.getIndianStockKlines(cleanSymbol, apiInterval === '1m' ? '1d' : apiInterval)
        }

        if (isCancelled) return

        if (klines && klines.length > 0) {
          rawCandlesRef.current = klines
          candlestickSeriesRef.current?.setData(klines)

          const volumeData = klines.map(k => ({
            time: k.time,
            value: k.volume,
            color: k.close >= k.open ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
          }))
          volumeSeriesRef.current?.setData(volumeData)

          const latest = klines[klines.length - 1]
          latestCandleRef.current = latest
          setCurrentOHLCV(latest)

          updatePrice(cleanSymbol, {
            price: latest.close,
            change: latest.close - latest.open,
            changePercent: latest.open ? ((latest.close - latest.open) / latest.open) * 100 : 0,
            high: latest.high,
            low: latest.low,
            volume: latest.volume,
          })

          applyIndicators(klines, indicatorsRef.current)
          chartRef.current?.timeScale().fitContent()
        }
      } catch (err) {
        console.error('Error fetching historical klines:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }

      if (!isCancelled && isCrypto) {
        try {
          const ws = BinanceWS.connectKline(cleanSymbol, apiInterval, (candle) => {
            if (isCancelled) return
            setWsConnected(true)

            candlestickSeriesRef.current?.update(candle)
            volumeSeriesRef.current?.update({
              time: candle.time,
              value: candle.volume,
              color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
            })

            latestCandleRef.current = candle
            setCurrentOHLCV(candle)

            updatePrice(cleanSymbol, {
              price: candle.close,
              change: candle.close - candle.open,
              changePercent: candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0,
              high: candle.high,
              low: candle.low,
              volume: candle.volume,
            })

            const candles = rawCandlesRef.current
            if (candles.length > 0) {
              const lastIdx = candles.length - 1
              if (candles[lastIdx].time === candle.time) {
                candles[lastIdx] = candle
              } else if (candle.time > candles[lastIdx].time) {
                candles.push(candle)
                if (candles.length > 600) candles.shift()
              }
            }

            const now = Date.now()
            if (now - lastIndicatorUpdateRef.current > 1000) {
              lastIndicatorUpdateRef.current = now
              applyIndicators(candles, indicatorsRef.current)
            }
          })
          wsRef.current = ws
        } catch (wsErr) {
          console.error('Error connecting BinanceWS:', wsErr)
        }
      }
    }

    loadData()

    return () => {
      isCancelled = true
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
        setWsConnected(false)
      }
    }
  }, [chartReady, currentSymbol, timeframe, updatePrice, applyIndicators])

  // Currency helper
  const currency = (currentSymbol.includes('.NS') || currentSymbol.includes('.BO')) ? 'INR' : 'USD'
  const candleOpen = currentOHLCV?.open || 0
  const candleClose = currentOHLCV?.close || 0
  const change = currentOHLCV ? candleClose - candleOpen : 0
  const changePercent = currentOHLCV && candleOpen ? (change / candleOpen) * 100 : 0
  const isUp = change >= 0

  const activeIndicatorCount = Object.values(indicators).filter(Boolean).length

  const filteredModalIndicators = ALL_INDICATORS.filter(ind => {
    const matchesCat = indicatorCategory === 'All' || ind.category === indicatorCategory
    const matchesSearch = ind.name.toLowerCase().includes(indicatorSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#0a0a0f] text-gray-200 select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-3 bg-[#0a0a0f]'
          : 'w-full rounded-xl border border-gray-800/80 shadow-2xl p-3'
      }`}
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 180px)',
        minHeight: '560px',
      }}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800/60">
        {/* Left Section: Symbol Selector & Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol Selector Input with Dropdown */}
          <div className="relative">
            <form onSubmit={handleSymbolSubmit} className="flex items-center">
              <div className="relative flex items-center">
                <TrendingUp className="w-4 h-4 text-primary-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                  onFocus={() => setIsSymbolDropdownOpen(true)}
                  placeholder="BTCUSDT / RELIANCE.NS"
                  className="pl-8 pr-3 py-1.5 bg-dark-900 border border-gray-700 hover:border-gray-600 focus:border-primary-500 rounded-lg text-xs font-bold text-white w-36 uppercase tracking-wider focus:outline-none transition-all shadow-inner"
                />
              </div>
            </form>

            {isSymbolDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSymbolDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-60 bg-dark-900 border border-gray-800 rounded-xl shadow-2xl z-40 overflow-hidden divide-y divide-gray-800/60 max-h-80 overflow-y-auto">
                  <div className="p-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-dark-950/60">
                    Popular Pairs & Stocks
                  </div>
                  {popularSymbols.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => selectQuickSymbol(item)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-dark-800 transition-colors ${
                        item.symbol === currentSymbol ? 'bg-primary-500/10 text-primary-400 font-bold' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{item.symbol}</span>
                        <span className="text-[10px] text-gray-500">{item.name}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.type === 'crypto' ? 'bg-amber-500/10 text-amber-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center bg-dark-900 border border-gray-800 rounded-lg p-0.5">
            {displayTimeframes.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf.label)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeframe === tf.label
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Real-time Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-dark-900 border border-gray-800">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-gray-400">{wsConnected ? 'Live Tick Feed' : 'Historical'}</span>
          </div>
        </div>

        {/* Right Section: Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          {/* Indicator Catalog Modal Button (20+ Indicators) */}
          <button
            onClick={() => setShowIndicatorModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-primary-500/15 border-primary-500/40 text-primary-400 hover:bg-primary-500/25 transition-all shadow-sm"
            title="Open 20+ Technical Indicators Catalog"
          >
            <Activity className="w-3.5 h-3.5 text-primary-400" />
            <span className="font-semibold">Indicators ({activeIndicatorCount})</span>
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-dark-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-dark-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-dark-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Reset Zoom / Fit View"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Settings Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showSettings
                  ? 'bg-primary-500/15 border-primary-500/40 text-primary-400'
                  : 'bg-dark-900 border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800'
              }`}
              title="Chart Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 mt-1.5 w-48 bg-dark-900 border border-gray-800 rounded-xl shadow-2xl z-40 p-2 text-xs">
                  <div className="font-semibold text-gray-400 px-2 py-1 mb-1">Display Settings</div>
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-dark-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chartSettings.showGrid}
                      onChange={(e) => setChartSettings({ ...chartSettings, showGrid: e.target.checked })}
                      className="rounded border-gray-700 text-primary-600 bg-dark-900"
                    />
                    <span>Grid Lines</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-dark-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chartSettings.showVolume}
                      onChange={(e) => setChartSettings({ ...chartSettings, showVolume: e.target.checked })}
                      className="rounded border-gray-700 text-primary-600 bg-dark-900"
                    />
                    <span>Volume Histogram</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-dark-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OHLCV Data Bar */}
      <div className="flex flex-wrap items-center justify-between gap-y-1 py-1.5 px-1 text-xs font-mono border-b border-gray-800/40">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-bold text-white text-sm">{currentSymbol}</span>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-sans">O:</span>
            <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {currentOHLCV ? formatCurrency(currentOHLCV.open, currency) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-sans">H:</span>
            <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {currentOHLCV ? formatCurrency(currentOHLCV.high, currency) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-sans">L:</span>
            <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {currentOHLCV ? formatCurrency(currentOHLCV.low, currency) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-sans">C:</span>
            <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {currentOHLCV ? formatCurrency(currentOHLCV.close, currency) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-sans">V:</span>
            <span className="text-gray-300 font-semibold">
              {currentOHLCV ? formatNumber(currentOHLCV.volume, 2) : '—'}
            </span>
          </div>

          {currentOHLCV && (
            <div className={`flex items-center gap-1 font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{isUp ? '+' : ''}{change.toFixed(2)}</span>
              <span>({isUp ? '+' : ''}{changePercent.toFixed(2)}%)</span>
            </div>
          )}
        </div>

        {/* Active Indicators Quick Pills */}
        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {ALL_INDICATORS.filter(ind => indicators[ind.key]).map(ind => (
            <button
              key={ind.key}
              onClick={() => toggleIndicator(ind.key)}
              className="px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 bg-dark-900 border-gray-700 hover:border-red-500/50 text-gray-300 hover:text-red-400 transition-colors"
              title="Click to remove"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ind.color }} />
              <span>{ind.name}</span>
              <X className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Area with Floating Left Drawing Tools & Chart */}
      <div className="relative flex-1 w-full mt-1 flex overflow-hidden rounded-lg">
        {/* Left Vertical Drawing Toolbar */}
        <div className="w-10 bg-dark-950/90 border-r border-gray-800/70 flex flex-col items-center py-2 gap-1.5 z-20">
          {/* Pointer Tool */}
          <button
            onClick={() => { setActiveTool('select'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'select'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Cursor / Pan (Pointer)"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Trendline Tool */}
          <button
            onClick={() => { setActiveTool('trendline'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'trendline'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Trendline (Click 2 points)"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          {/* Horizontal Support/Resistance Line */}
          <button
            onClick={() => { setActiveTool('horizontal'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'horizontal'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Horizontal Price Level (Click price)"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Vertical Time Marker */}
          <button
            onClick={() => { setActiveTool('vertical'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'vertical'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Vertical Time Marker (Click timestamp)"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Fibonacci Retracement */}
          <button
            onClick={() => { setActiveTool('fibonacci'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'fibonacci'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Fibonacci Retracement (Click High then Low)"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Rectangle Supply/Demand Zone */}
          <button
            onClick={() => { setActiveTool('box'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'box'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Rectangle Supply/Demand Zone"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Measurement Tool */}
          <button
            onClick={() => { setActiveTool('measure'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'measure'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Measure Price Range & Delta"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Text Annotation */}
          <button
            onClick={() => { setActiveTool('text'); setDrawingStart(null); }}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'text'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Text Note / Annotation"
          >
            <Type className="w-4 h-4" />
          </button>

          <div className="w-6 border-b border-gray-800 my-1" />

          {/* Undo Drawing */}
          <button
            onClick={undoDrawing}
            disabled={drawings.length === 0}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo Last Drawing"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Clear All Drawings */}
          <button
            onClick={clearDrawings}
            disabled={drawings.length === 0}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-dark-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Clear All Drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chart Canvas & SVG Overlay */}
        <div className="relative flex-1 h-full overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-[#0a0a0f]/75 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400 font-mono">
                  Loading {currentSymbol} ({timeframe})...
                </span>
              </div>
            </div>
          )}

          {/* Active drawing hint banner */}
          {activeTool !== 'select' && (
            <div className="absolute top-2 left-3 z-20 bg-primary-950/90 border border-primary-500/50 text-primary-300 text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 backdrop-blur-sm">
              <span className="font-semibold uppercase tracking-wider text-[11px]">{activeTool} mode:</span>
              <span>{drawingStart ? 'Click second point to finish' : 'Click on chart to place'}</span>
              <button
                onClick={() => { setActiveTool('select'); setDrawingStart(null); }}
                className="ml-2 hover:text-white font-bold"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Interactive SVG Drawing Overlay */}
          <svg
            ref={overlayRef}
            onMouseDown={handleOverlayMouseDown}
            onMouseMove={handleOverlayMouseMove}
            className={`absolute inset-0 w-full h-full z-10 ${
              activeTool !== 'select' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            {/* Render saved drawings */}
            {drawings.map((d) => {
              if (d.type === 'trendline') {
                return (
                  <g key={d.id}>
                    <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={d.color || '#38bdf8'} strokeWidth={2} strokeDasharray="none" />
                    <circle cx={d.x1} cy={d.y1} r={3} fill="#38bdf8" />
                    <circle cx={d.x2} cy={d.y2} r={3} fill="#38bdf8" />
                  </g>
                )
              }
              if (d.type === 'horizontal') {
                return (
                  <g key={d.id}>
                    <line x1={0} y1={d.y} x2="100%" y2={d.y} stroke={d.color || '#f59e0b'} strokeWidth={1.5} strokeDasharray="4 4" />
                    <text x={12} y={d.y - 4} fill={d.color || '#f59e0b'} fontSize={10} fontFamily="monospace" fontWeight="bold">
                      PRICE LEVEL {d.price ? `(${d.price})` : ''}
                    </text>
                  </g>
                )
              }
              if (d.type === 'vertical') {
                return (
                  <g key={d.id}>
                    <line x1={d.x} y1={0} x2={d.x} y2="100%" stroke={d.color || '#a855f7'} strokeWidth={1.5} strokeDasharray="4 4" />
                    <text x={d.x + 4} y={20} fill={d.color || '#a855f7'} fontSize={10} fontFamily="monospace" fontWeight="bold">
                      TIME MARKER
                    </text>
                  </g>
                )
              }
              if (d.type === 'fibonacci') {
                const minY = Math.min(d.y1, d.y2)
                const maxY = Math.max(d.y1, d.y2)
                const height = maxY - minY
                const levels = [
                  { pct: 0, label: '0.0% (High)', color: '#ef4444' },
                  { pct: 0.236, label: '23.6%', color: '#f97316' },
                  { pct: 0.382, label: '38.2%', color: '#eab308' },
                  { pct: 0.5, label: '50.0% (Mid)', color: '#22c55e' },
                  { pct: 0.618, label: '61.8% (Golden)', color: '#06b6d4' },
                  { pct: 0.786, label: '78.6%', color: '#8b5cf6' },
                  { pct: 1.0, label: '100.0% (Low)', color: '#3b82f6' },
                ]
                return (
                  <g key={d.id}>
                    <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#64748b" strokeWidth={1} strokeDasharray="2 2" />
                    {levels.map((lvl, idx) => {
                      const y = d.y1 < d.y2 ? d.y1 + height * lvl.pct : d.y2 + height * (1 - lvl.pct)
                      return (
                        <g key={idx}>
                          <line x1={Math.min(d.x1, d.x2)} y1={y} x2={Math.max(d.x1, d.x2) + 200} y2={y} stroke={lvl.color} strokeWidth={1.5} />
                          <text x={Math.min(d.x1, d.x2) + 6} y={y - 3} fill={lvl.color} fontSize={10} fontFamily="monospace" fontWeight="bold">
                            Fib {lvl.label}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                )
              }
              if (d.type === 'box') {
                const x = Math.min(d.x1, d.x2)
                const y = Math.min(d.y1, d.y2)
                const w = Math.abs(d.x2 - d.x1)
                const h = Math.abs(d.y2 - d.y1)
                return (
                  <g key={d.id}>
                    <rect x={x} y={y} width={w} height={h} fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth={1.5} />
                    <text x={x + 6} y={y + 14} fill="#38bdf8" fontSize={10} fontFamily="sans-serif" fontWeight="bold">
                      SUPPLY / DEMAND ZONE
                    </text>
                  </g>
                )
              }
              if (d.type === 'measure') {
                const dy = d.y2 - d.y1
                const isPositive = dy < 0
                return (
                  <g key={d.id}>
                    <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth={2} />
                    <rect
                      x={Math.min(d.x1, d.x2)}
                      y={Math.min(d.y1, d.y2)}
                      width={Math.abs(d.x2 - d.x1)}
                      height={Math.abs(d.y2 - d.y1)}
                      fill={isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                      stroke={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={Math.max(d.x1, d.x2) + 6}
                      y={(d.y1 + d.y2) / 2}
                      fill={isPositive ? '#22c55e' : '#ef4444'}
                      fontSize={11}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {isPositive ? '▲ +' : '▼ -'}{Math.abs(Math.round(dy))}px
                    </text>
                  </g>
                )
              }
              if (d.type === 'text') {
                return (
                  <g key={d.id}>
                    <rect x={d.x - 4} y={d.y - 14} width={d.text.length * 8 + 8} height={20} fill="#1e293b" rx={4} stroke="#475569" />
                    <text x={d.x} y={d.y} fill="#f8fafc" fontSize={11} fontWeight="bold" fontFamily="sans-serif">
                      {d.text}
                    </text>
                  </g>
                )
              }
              return null
            })}

            {/* Active tool preview while dragging */}
            {drawingPreview && (
              <g opacity={0.75}>
                {drawingPreview.type === 'trendline' && (
                  <line x1={drawingPreview.x} y1={drawingPreview.y} x2={drawingPreview.endX} y2={drawingPreview.endY} stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" />
                )}
                {drawingPreview.type === 'box' && (
                  <rect
                    x={Math.min(drawingPreview.x, drawingPreview.endX)}
                    y={Math.min(drawingPreview.y, drawingPreview.endY)}
                    width={Math.abs(drawingPreview.endX - drawingPreview.x)}
                    height={Math.abs(drawingPreview.endY - drawingPreview.y)}
                    fill="rgba(56, 189, 248, 0.2)"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                  />
                )}
                {drawingPreview.type === 'fibonacci' && (
                  <line x1={drawingPreview.x} y1={drawingPreview.y} x2={drawingPreview.endX} y2={drawingPreview.endY} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 4" />
                )}
              </g>
            )}
          </svg>

          {/* Actual Lightweight Charts Canvas Container */}
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* 20+ Technical Indicators Catalog Modal */}
      {showIndicatorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary-400" />
                <h3 className="text-base font-bold text-white">Technical Indicators Catalog (20+ Available)</h3>
              </div>
              <button
                onClick={() => setShowIndicatorModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Category Filter */}
            <div className="p-4 border-b border-gray-800/80 bg-dark-950/60 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={indicatorSearch}
                  onChange={(e) => setIndicatorSearch(e.target.value)}
                  placeholder="Search indicators (e.g. RSI, EMA, Bollinger, VWAP)..."
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Moving Averages', 'Trend & Bands', 'Oscillators', 'Volatility & Volume'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setIndicatorCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-colors ${
                      indicatorCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-900 text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicators List */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredModalIndicators.map((ind) => {
                const isActive = !!indicators[ind.key]
                return (
                  <button
                    key={ind.key}
                    onClick={() => toggleIndicator(ind.key)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-sm'
                        : 'bg-dark-900/60 border-gray-800 text-gray-300 hover:bg-dark-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ind.color }} />
                      <div>
                        <div className="text-xs font-bold text-white">{ind.name}</div>
                        <div className="text-[10px] text-gray-500">{ind.category} • {ind.overlay ? 'Chart Overlay' : 'Sub-pane'}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isActive ? 'bg-primary-600 border-primary-500 text-white' : 'border-gray-700 bg-dark-900'
                    }`}>
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-800 bg-dark-950 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Active indicators: <strong className="text-primary-400">{activeIndicatorCount}</strong> selected
              </span>
              <button
                onClick={() => setShowIndicatorModal(false)}
                className="btn-primary py-1.5 px-4 text-xs font-semibold"
              >
                Apply to Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
