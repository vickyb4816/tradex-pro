import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Save, FileCode, Download, Upload, Trash2, Copy, RotateCcw, Code2 } from 'lucide-react'

// Default sample Pine-like script
const DEFAULT_RSI_SCRIPT = `// TradeX Pine Script Editor
// Write your custom indicator or strategy

//@version=1
indicator("My Custom RSI Strategy", overlay=false)

// Input parameters
length = input(14, "RSI Length")
overbought = input(70, "Overbought Level")
oversold = input(30, "Oversold Level")

// Calculate RSI
rsi_value = rsi(close, length)

// Plot
plot(rsi_value, "RSI", color.blue, 2)
hline(overbought, "Overbought", color.red)
hline(oversold, "Oversold", color.green)

// Strategy signals
if rsi_value < oversold
    strategy.entry("Long", strategy.long)
if rsi_value > overbought
    strategy.close("Long")

// Background color
bgcolor(rsi_value < oversold ? color.green : rsi_value > overbought ? color.red : na, 90)`

// Pre-saved script library
const PRESET_SCRIPTS = [
  {
    id: 'rsi',
    name: 'RSI Strategy',
    type: 'Strategy',
    category: 'Oscillator',
    description: 'Relative Strength Index with overbought/oversold entry and exit signals',
    code: DEFAULT_RSI_SCRIPT,
  },
  {
    id: 'macd',
    name: 'MACD Strategy',
    type: 'Strategy',
    category: 'Trend Following',
    description: 'Moving Average Convergence Divergence crossover with histogram filter',
    code: `// TradeX Pine Script Editor
// MACD Trend Following Strategy

//@version=1
indicator("MACD Strategy", overlay=false)

// Input parameters
fast_length = input(12, "Fast EMA Length")
slow_length = input(26, "Slow EMA Length")
signal_length = input(9, "Signal Smoothing")

// Calculate MACD
fast_ma = ema(close, fast_length)
slow_ma = ema(close, slow_length)
macd_line = fast_ma - slow_ma
signal_line = ema(macd_line, signal_length)
hist = macd_line - signal_line

// Plot
plot(macd_line, "MACD", color.blue, 2)
plot(signal_line, "Signal", color.orange, 1)
plot(hist, "Histogram", hist >= 0 ? color.green : color.red, 1, style=plot.style_histogram)
hline(0, "Zero Line", color.gray)

// Strategy signals
if crossover(macd_line, signal_line)
    strategy.entry("MACD Long", strategy.long)
if crossunder(macd_line, signal_line)
    strategy.close("MACD Long")`,
  },
  {
    id: 'ema-cross',
    name: 'EMA Cross',
    type: 'Strategy',
    category: 'Moving Average',
    description: 'Classic Golden Cross (50 EMA / 200 EMA) and Death Cross trend signals',
    code: `// TradeX Pine Script Editor
// Exponential Moving Average Cross Strategy

//@version=1
indicator("EMA Cross", overlay=true)

// Input parameters
fast_len = input(50, "Fast EMA Length")
slow_len = input(200, "Slow EMA Length")

// Calculate EMAs
ema_fast = ema(close, fast_len)
ema_slow = ema(close, slow_len)

// Plot
plot(ema_fast, "Fast EMA", color.yellow, 2)
plot(ema_slow, "Slow EMA", color.purple, 2)

// Strategy signals
if crossover(ema_fast, ema_slow)
    strategy.entry("Golden Cross Long", strategy.long)
if crossunder(ema_fast, ema_slow)
    strategy.entry("Death Cross Short", strategy.short)

// Visual shapes on chart
plotshape(crossover(ema_fast, ema_slow), style=shape.triangleup, location=location.belowbar, color=color.green, text="BUY")
plotshape(crossunder(ema_fast, ema_slow), style=shape.triangledown, location=location.abovebar, color=color.red, text="SELL")`,
  },
  {
    id: 'volume-profile',
    name: 'Volume Profile',
    type: 'Indicator',
    category: 'Volume',
    description: 'Calculates Point of Control (POC), Value Area High (VAH), and Value Area Low (VAL)',
    code: `// TradeX Pine Script Editor
// Volume Profile & Point of Control (POC)

//@version=1
indicator("Volume Profile", overlay=true)

// Input parameters
rows = input(24, "Row Resolution")
va_percent = input(70, "Value Area %")
lookback = input(100, "Lookback Bars")

// Calculations
poc_price = ta.poc(close, volume, lookback)
vah_price = ta.vah(close, volume, va_percent)
val_price = ta.val(close, volume, va_percent)

// Plot
hline(poc_price, "POC", color.red, 2)
hline(vah_price, "VAH", color.blue, 1)
hline(val_price, "VAL", color.blue, 1)

// Strategy signals
if low <= poc_price and close > poc_price and volume > sma(volume, 20)
    strategy.entry("POC Bounce Long", strategy.long)`,
  },
]

// Sample simulated bars for Data Window
const generateSimulatedData = (scriptType = 'rsi') => {
  const baseTime = new Date('2026-11-14T15:30:00')
  const basePrice = 91450.0
  const rows = []

  const rsiValues = [28.4, 29.8, 34.2, 41.5, 48.0, 52.3, 58.7, 63.4, 69.1, 74.8, 71.2, 65.0, 54.2, 48.6, 38.1]
  const macdValues = [
    { macd: -14.2, sig: -18.5, hist: 4.3, cross: 'Bullish Cross' },
    { macd: -8.5, sig: -15.1, hist: 6.6, cross: 'None' },
    { macd: 2.1, sig: -9.8, hist: 11.9, cross: 'None' },
    { macd: 12.4, sig: -3.2, hist: 15.6, cross: 'None' },
    { macd: 24.8, sig: 4.5, hist: 20.3, cross: 'None' },
    { macd: 31.0, sig: 12.1, hist: 18.9, cross: 'None' },
    { macd: 28.5, sig: 18.2, hist: 10.3, cross: 'None' },
    { macd: 20.1, sig: 21.0, hist: -0.9, cross: 'Bearish Cross' },
    { macd: 11.4, sig: 18.5, hist: -7.1, cross: 'None' },
    { macd: 3.2, sig: 14.1, hist: -10.9, cross: 'None' },
  ]
  const emaValues = [
    { fast: 91100, slow: 90800, signal: 'Bullish' },
    { fast: 91220, slow: 90850, signal: 'Bullish' },
    { fast: 91350, slow: 90910, signal: 'Bullish' },
    { fast: 91480, slow: 90980, signal: 'Golden Cross (Buy)' },
    { fast: 91550, slow: 91060, signal: 'Bullish' },
    { fast: 91490, slow: 91140, signal: 'Bullish' },
    { fast: 91380, slow: 91210, signal: 'Neutral' },
    { fast: 91240, slow: 91270, signal: 'Death Cross (Sell)' },
    { fast: 91120, slow: 91310, signal: 'Bearish' },
    { fast: 90980, slow: 91340, signal: 'Bearish' },
  ]

  for (let i = 0; i < 10; i++) {
    const t = new Date(baseTime.getTime() - i * 15 * 60 * 1000)
    const timeStr = t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    const priceVariance = (Math.sin(i * 0.7) * 450) + (i * 45)
    const close = +(basePrice - priceVariance).toFixed(2)
    const open = +(close + (i % 2 === 0 ? -120 : 150)).toFixed(2)
    const high = +(Math.max(open, close) + 65).toFixed(2)
    const low = +(Math.min(open, close) - 55).toFixed(2)
    const volume = Math.floor(1200 + Math.abs(Math.sin(i)) * 3400)

    let indicatorData = {}
    if (scriptType.toLowerCase().includes('macd')) {
      const m = macdValues[i % macdValues.length]
      indicatorData = {
        primary: `MACD: ${m.macd >= 0 ? '+' : ''}${m.macd.toFixed(2)}`,
        secondary: `Sig: ${m.sig >= 0 ? '+' : ''}${m.sig.toFixed(2)}`,
        tertiary: `Hist: ${m.hist >= 0 ? '+' : ''}${m.hist.toFixed(2)}`,
        signal: m.cross !== 'None' ? m.cross : (m.hist >= 0 ? 'Bullish' : 'Bearish'),
        signalColor: m.cross.includes('Bullish') ? 'emerald' : m.cross.includes('Bearish') ? 'red' : 'gray'
      }
    } else if (scriptType.toLowerCase().includes('ema')) {
      const e = emaValues[i % emaValues.length]
      indicatorData = {
        primary: `EMA50: ${e.fast.toLocaleString()}`,
        secondary: `EMA200: ${e.slow.toLocaleString()}`,
        tertiary: `Diff: ${(e.fast - e.slow >= 0 ? '+' : '')}${(e.fast - e.slow).toLocaleString()}`,
        signal: e.signal,
        signalColor: e.signal.includes('Golden') ? 'emerald' : e.signal.includes('Death') ? 'red' : e.signal === 'Bullish' ? 'emerald' : 'red'
      }
    } else if (scriptType.toLowerCase().includes('volume')) {
      const poc = 91200
      const vah = 91800
      const val = 90600
      indicatorData = {
        primary: `POC: ${poc.toLocaleString()}`,
        secondary: `VAH: ${vah.toLocaleString()}`,
        tertiary: `VAL: ${val.toLocaleString()}`,
        signal: close > vah ? 'Above VA' : close < val ? 'Below VA' : 'Inside VA',
        signalColor: close > vah ? 'emerald' : close < val ? 'red' : 'blue'
      }
    } else {
      // Default RSI
      const rsi = rsiValues[i % rsiValues.length]
      const signal = rsi < 30 ? 'Long Entry' : rsi > 70 ? 'Long Exit' : 'Hold'
      const signalColor = rsi < 30 ? 'emerald' : rsi > 70 ? 'red' : 'gray'
      indicatorData = {
        primary: `RSI: ${rsi.toFixed(2)}`,
        secondary: `OB: 70 / OS: 30`,
        tertiary: rsi < 30 ? 'Oversold (<30)' : rsi > 70 ? 'Overbought (>70)' : 'Neutral (30-70)',
        signal,
        signalColor
      }
    }

    rows.push({
      time: timeStr,
      open,
      high,
      low,
      close,
      volume,
      ...indicatorData
    })
  }

  return rows
}

export default function PineEditor() {
  const [scriptName, setScriptName] = useState('My Custom RSI Strategy')
  const [code, setCode] = useState(DEFAULT_RSI_SCRIPT)
  const [selectedScriptId, setSelectedScriptId] = useState('rsi')
  const [activeTab, setActiveTab] = useState('output') // 'output' | 'errors' | 'dataWindow'
  const [scriptStatus, setScriptStatus] = useState('Ready')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [isCompiling, setIsCompiling] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [compileErrors, setCompileErrors] = useState([])
  const [copied, setCopied] = useState(false)
  const [saveToast, setSaveToast] = useState(false)

  // Custom user-saved scripts
  const [customScripts, setCustomScripts] = useState(() => {
    try {
      const saved = localStorage.getItem('pine_custom_scripts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Simulated output logs
  const [logs, setLogs] = useState([
    { time: '15:30:10', type: 'info', text: 'Pine Script Editor initialized. Compiler runtime v1.0.4 ready.' },
    { time: '15:30:10', type: 'info', text: 'Monaco engine loaded with syntax highlighting for Pine Script.' },
    { time: '15:30:12', type: 'success', text: 'Loaded initial script: "My Custom RSI Strategy". Click "Run" to compile and execute backtest.' },
  ])

  // Simulated indicator data window rows
  const [dataRows, setDataRows] = useState(() => generateSimulatedData('rsi'))

  // Save custom scripts to local storage
  const persistCustomScripts = (scripts) => {
    setCustomScripts(scripts)
    try {
      localStorage.setItem('pine_custom_scripts', JSON.stringify(scripts))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }

  // Monaco Editor Mount
  const handleEditorDidMount = useCallback((editor) => {
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column
      })
    })
  }, [])

  // Compilation & Run logic
  const handleRun = useCallback(() => {
    setIsCompiling(true)
    setScriptStatus('Compiling...')

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false })

    setTimeout(() => {
      // Syntax & bracket validation
      const lines = code.split('\n')
      const errors = []
      const stack = []

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i]
        const lineContent = rawLine.split('//')[0] // ignore comments

        for (let j = 0; j < lineContent.length; j++) {
          const ch = lineContent[j]
          if (ch === '(' || ch === '[' || ch === '{') {
            stack.push({ ch, line: i + 1, col: j + 1 })
          } else if (ch === ')' || ch === ']' || ch === '}') {
            const last = stack.pop()
            const expected = ch === ')' ? '(' : ch === ']' ? '[' : '{'
            if (!last || last.ch !== expected) {
              errors.push({
                line: i + 1,
                col: j + 1,
                snippet: rawLine.trim(),
                message: `Syntax error: Mismatched closing '${ch}' without opening '${expected}'`
              })
              break
            }
          }
        }
        if (errors.length > 0) break
      }

      if (stack.length > 0 && errors.length === 0) {
        const unclosed = stack.pop()
        errors.push({
          line: unclosed.line,
          col: unclosed.col,
          snippet: lines[unclosed.line - 1]?.trim() || '',
          message: `Syntax error: Unclosed bracket '${unclosed.ch}'`
        })
      }

      // Check for empty code
      if (!code.trim()) {
        errors.push({
          line: 1,
          col: 1,
          snippet: '',
          message: 'Script is empty. Please enter Pine Script code.'
        })
      }

      setIsCompiling(false)

      if (errors.length > 0) {
        setCompileErrors(errors)
        setScriptStatus('Compilation failed')
        setActiveTab('errors')
        setLogs(prev => [
          ...prev,
          { time: timeStr, type: 'error', text: `[ERROR] Compilation failed: ${errors[0].message} at line ${errors[0].line}:${errors[0].col}` },
          { time: timeStr, type: 'error', text: `[ERROR] 1 compilation error found. Execution aborted.` }
        ])
      } else {
        setCompileErrors([])
        setScriptStatus('Script compiled successfully')
        setActiveTab('output')

        // Generate updated data window rows matching current script
        const generated = generateSimulatedData(scriptName)
        setDataRows(generated)

        setLogs(prev => [
          ...prev,
          { time: timeStr, type: 'info', text: `Compiling "${scriptName}" (version 1)...` },
          { time: timeStr, type: 'info', text: `Parsed AST: 0 syntax warnings, 0 type errors.` },
          { time: timeStr, type: 'success', text: `Script compiled successfully in 38ms.` },
          { time: timeStr, type: 'info', text: `Calculated indicator buffers across 500 historical bars on BTC/USDT.` },
          { time: timeStr, type: 'success', text: `Simulated Backtest: 24 Trades | Win Rate: 66.7% | Profit Factor: 2.31 | Net Return: +21.4%` },
        ])
      }
    }, 450)
  }, [code, scriptName])

  // Save current script
  const handleSave = useCallback(() => {
    const existingIndex = customScripts.findIndex(s => s.name.toLowerCase() === scriptName.trim().toLowerCase())
    let updated
    if (existingIndex >= 0) {
      updated = [...customScripts]
      updated[existingIndex] = {
        ...updated[existingIndex],
        code,
        updatedAt: new Date().toISOString()
      }
    } else {
      const newCustom = {
        id: 'custom-' + Date.now(),
        name: scriptName.trim() || 'Untitled Script',
        type: code.includes('strategy.') ? 'Strategy' : 'Indicator',
        category: 'Custom',
        description: 'User created script',
        code,
        updatedAt: new Date().toISOString()
      }
      updated = [newCustom, ...customScripts]
      setSelectedScriptId(newCustom.id)
    }

    persistCustomScripts(updated)
    setScriptStatus('Script saved')
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2000)

    const now = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [
      ...prev,
      { time: now, type: 'success', text: `Saved script "${scriptName}" successfully.` }
    ])
  }, [code, scriptName, customScripts])

  // New script template
  const handleNew = useCallback(() => {
    const newName = 'Untitled Script'
    const newCode = `// TradeX Pine Script Editor
// New Custom Indicator

//@version=1
indicator("${newName}", overlay=true)

// Input parameters
length = input(20, "Period")

// Calculations
basis = sma(close, length)

// Plot
plot(basis, "SMA", color.blue, 2)
`
    setScriptName(newName)
    setCode(newCode)
    setSelectedScriptId('new')
    setScriptStatus('New script created')
    setCompileErrors([])
  }, [])

  // Load a script by ID or item
  const handleLoadScript = useCallback((item) => {
    setScriptName(item.name)
    setCode(item.code)
    setSelectedScriptId(item.id)
    setScriptStatus('Loaded ' + item.name)
    setCompileErrors([])

    // Update simulated data for data window
    setDataRows(generateSimulatedData(item.name))

    const now = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [
      ...prev,
      { time: now, type: 'info', text: `Loaded script "${item.name}" into editor.` }
    ])
  }, [])

  // Handle dropdown selection
  const handleDropdownSelect = (e) => {
    const val = e.target.value
    if (!val) return
    const all = [...PRESET_SCRIPTS, ...customScripts]
    const found = all.find(s => s.id === val)
    if (found) {
      handleLoadScript(found)
    }
  }

  // Copy code to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  // Reset to original preset code
  const handleReset = useCallback(() => {
    const preset = PRESET_SCRIPTS.find(s => s.id === selectedScriptId)
    if (preset) {
      setCode(preset.code)
      setScriptName(preset.name)
      setScriptStatus('Reset to default preset')
    } else {
      setCode(DEFAULT_RSI_SCRIPT)
      setScriptName('My Custom RSI Strategy')
      setSelectedScriptId('rsi')
      setScriptStatus('Reset to default RSI')
    }
    setCompileErrors([])
  }, [selectedScriptId])

  // Download script as file
  const handleDownload = useCallback(() => {
    const safeName = (scriptName || 'script').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeName}.pine`
    link.click()
    URL.revokeObjectURL(url)
  }, [code, scriptName])

  // Upload script from local file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
        setCode(content)
        setScriptName(cleanName)
        setSelectedScriptId('custom-uploaded-' + Date.now())
        setScriptStatus(`Loaded from ${file.name}`)
        setCompileErrors([])
        const now = new Date().toLocaleTimeString('en-US', { hour12: false })
        setLogs(prev => [
          ...prev,
          { time: now, type: 'info', text: `Imported file "${file.name}" into editor.` }
        ])
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Delete script
  const handleDelete = useCallback(() => {
    const isCustom = customScripts.some(s => s.id === selectedScriptId)
    if (isCustom) {
      const updated = customScripts.filter(s => s.id !== selectedScriptId)
      persistCustomScripts(updated)
      handleLoadScript(PRESET_SCRIPTS[0])
    } else {
      // Clear code
      setCode('// Script cleared\n')
      setScriptStatus('Editor cleared')
    }
  }, [customScripts, selectedScriptId, handleLoadScript])

  // Filter scripts for sidebar
  const filteredPresets = PRESET_SCRIPTS.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredCustom = customScripts.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lineCount = code.split('\n').length
  const charCount = code.length

  return (
    <div className="h-[calc(100vh-5.5rem)] min-h-[640px] flex flex-col gap-2 overflow-hidden text-gray-100">
      {/* 1. Top Toolbar */}
      <div className="card !p-2.5 flex items-center justify-between gap-3 flex-shrink-0 shadow-lg border-gray-800/80">
        {/* Left: Script icon & Editable Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-md">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0 text-primary-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={scriptName}
              onChange={(e) => {
                setScriptName(e.target.value)
                setScriptStatus('Modified')
              }}
              placeholder="Script name..."
              className="w-full bg-dark-900/90 border border-gray-700/60 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Center: Load Dropdown & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Load Dropdown */}
          <div className="relative hidden sm:block">
            <select
              value={selectedScriptId}
              onChange={handleDropdownSelect}
              className="select-field !py-1.5 !px-3 text-xs bg-dark-900 border-gray-700 text-gray-200 pr-8"
              title="Load script from library"
            >
              <optgroup label="Preset Scripts">
                {PRESET_SCRIPTS.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                ))}
              </optgroup>
              {customScripts.length > 0 && (
                <optgroup label="My Custom Scripts">
                  {customScripts.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* New Button */}
          <button
            onClick={handleNew}
            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 hover:border-gray-600"
            title="Create new script"
          >
            <FileCode className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden md:inline">New</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 hover:border-primary-500/50 hover:text-primary-400"
            title="Save script to local library"
          >
            <Save className="w-3.5 h-3.5 text-primary-400" />
            <span>Save</span>
          </button>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isCompiling}
            className="btn-primary !py-1.5 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary-900/30"
            title="Compile and simulate Pine Script"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling...' : 'Run'}</span>
          </button>
        </div>

        {/* Right: Auxiliary Utility Buttons */}
        <div className="flex items-center gap-1 border-l border-gray-800 pl-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors relative"
            title="Copy script code"
          >
            {copied ? (
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            title="Reset code to original preset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            title="Download script as .pine file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Upload Button */}
          <button
            onClick={() => document.getElementById('pine-file-upload')?.click()}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            title="Upload .pine script file"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            id="pine-file-upload"
            type="file"
            accept=".pine,.txt,.js"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Clear / Delete Button */}
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete custom script or clear editor"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Library Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors ml-1 ${isSidebarOpen ? 'text-primary-400 bg-primary-500/15' : 'text-gray-400 hover:text-white hover:bg-dark-700'}`}
            title={isSidebarOpen ? 'Collapse script library' : 'Expand script library'}
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace (Sidebar + Editor + Console) */}
      <div className="flex-1 flex gap-2 min-h-0 overflow-hidden">
        {/* 4. Script Library Sidebar (Collapsible) */}
        <aside
          className={`card !p-0 flex flex-col transition-all duration-300 ease-in-out border-gray-800/80 overflow-hidden ${
            isSidebarOpen ? 'w-64 min-w-[16rem]' : 'w-10 min-w-[2.5rem]'
          }`}
        >
          {isSidebarOpen ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-gray-800/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Script Library</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-gray-500 hover:text-white rounded hover:bg-dark-700 transition-colors"
                  title="Collapse Sidebar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* Search input */}
              <div className="p-2 border-b border-gray-800/50">
                <div className="relative">
                  <svg className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scripts..."
                    className="w-full bg-dark-900 border border-gray-800 rounded-md pl-8 pr-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Script List Scroll Area */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* Presets */}
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5">
                    Pre-saved Scripts
                  </div>
                  <div className="space-y-1">
                    {filteredPresets.map((script) => {
                      const isActive = selectedScriptId === script.id
                      return (
                        <button
                          key={script.id}
                          onClick={() => handleLoadScript(script)}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-all flex flex-col gap-1 border ${
                            isActive
                              ? 'bg-primary-600/15 border-primary-500/40 text-white shadow-sm'
                              : 'border-transparent hover:bg-dark-800/70 text-gray-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold truncate">{script.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                script.type === 'Strategy'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                              }`}
                            >
                              {script.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 line-clamp-1">{script.description}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Scripts */}
                {customScripts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
                      <span>My Custom Scripts</span>
                      <span className="text-gray-600">({customScripts.length})</span>
                    </div>
                    <div className="space-y-1">
                      {filteredCustom.map((script) => {
                        const isActive = selectedScriptId === script.id
                        return (
                          <div
                            key={script.id}
                            className={`group w-full p-2 rounded-lg text-xs transition-all flex items-center justify-between border ${
                              isActive
                                ? 'bg-primary-600/15 border-primary-500/40 text-white'
                                : 'border-transparent hover:bg-dark-800/70 text-gray-300 hover:text-white'
                            }`}
                          >
                            <button
                              onClick={() => handleLoadScript(script)}
                              className="text-left flex-1 min-w-0 pr-2"
                            >
                              <div className="font-semibold truncate">{script.name}</div>
                              <span className="text-[10px] text-gray-400">Custom Script</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const updated = customScripts.filter(s => s.id !== script.id)
                                persistCustomScripts(updated)
                                if (selectedScriptId === script.id) {
                                  handleLoadScript(PRESET_SCRIPTS[0])
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded transition-opacity"
                              title="Delete script"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed rail */
            <div className="flex flex-col items-center py-3 gap-3 h-full">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                title="Expand script library"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="w-6 h-[1px] bg-gray-800" />
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                title="Script Library"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* Center Panel: Editor (~60%) + Console (~30%) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-2">
          {/* 2. Monaco Editor Section (~60% height) */}
          <div className="flex-[6] min-h-[220px] bg-dark-900 border border-gray-800/80 rounded-xl overflow-hidden flex flex-col relative shadow-md">
            {/* Editor Mini Tab Bar */}
            <div className="h-8 bg-dark-950/90 border-b border-gray-800/80 px-3 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px] bg-dark-800/80 px-2.5 py-0.5 rounded border border-gray-700/50">
                  <FileCode className="w-3.5 h-3.5 text-primary-400" />
                  {scriptName}.pine
                </span>
                <span className="text-[10px] text-gray-500">v1 • Pine Script Mode</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span className="hidden sm:inline">Theme: vs-dark</span>
                <span className="hidden sm:inline">Font: JetBrains Mono</span>
                {saveToast && (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </span>
                )}
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 w-full min-h-0 relative">
              <Editor
                height="100%"
                width="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  setCode(val || '')
                  setScriptStatus('Modified')
                }}
                onMount={handleEditorDidMount}
                options={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  fontSize: 13,
                  lineHeight: 20,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  renderLineHighlight: 'all',
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  padding: { top: 8, bottom: 8 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                }}
              />
            </div>
          </div>

          {/* 3. Output/Console Panel (~30% height) */}
          <div className="flex-[4] min-h-[170px] bg-dark-900 border border-gray-800/80 rounded-xl overflow-hidden flex flex-col shadow-md">
            {/* Panel Header & Tabs */}
            <div className="h-9 bg-dark-950/90 border-b border-gray-800/80 px-3 flex items-center justify-between text-xs select-none flex-shrink-0">
              <div className="flex items-center gap-1">
                {/* Tab: Output */}
                <button
                  onClick={() => setActiveTab('output')}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === 'output'
                      ? 'bg-dark-800 text-primary-400 border border-primary-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Output</span>
                </button>

                {/* Tab: Errors */}
                <button
                  onClick={() => setActiveTab('errors')}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === 'errors'
                      ? 'bg-dark-800 text-red-400 border border-red-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Errors</span>
                  {compileErrors.length > 0 && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.2 rounded-full font-bold border border-red-500/30">
                      {compileErrors.length}
                    </span>
                  )}
                </button>

                {/* Tab: Data Window */}
                <button
                  onClick={() => setActiveTab('dataWindow')}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === 'dataWindow'
                      ? 'bg-dark-800 text-emerald-400 border border-emerald-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Data Window</span>
                </button>
              </div>

              {/* Panel Actions / Meta */}
              <div className="flex items-center gap-2">
                {activeTab === 'output' && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear Output
                  </button>
                )}
                <div className="text-[11px] text-gray-500 font-mono">
                  Runtime: Engine v1.0
                </div>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-auto p-3 text-xs font-mono min-h-0 bg-dark-950/40">
              {/* Output Tab Content */}
              {activeTab === 'output' && (
                <div className="space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 italic py-4 text-center">Output console is empty. Click "Run" to compile.</div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-gray-600 select-none flex-shrink-0">[{log.time}]</span>
                        <span
                          className={`break-all ${
                            log.type === 'error'
                              ? 'text-red-400 font-semibold'
                              : log.type === 'success'
                              ? 'text-emerald-400 font-medium'
                              : log.type === 'warn'
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Errors Tab Content */}
              {activeTab === 'errors' && (
                <div>
                  {compileErrors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                      <svg className="w-8 h-8 text-emerald-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm font-semibold text-gray-200">No compilation errors</div>
                      <div className="text-xs text-gray-500 mt-1">Pine Script syntax and balance are fully valid.</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-red-300">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-red-400">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Compilation failed with {compileErrors.length} error(s)</span>
                        </div>
                        {compileErrors.map((err, i) => (
                          <div key={i} className="mt-2 text-xs border-t border-red-500/20 pt-2">
                            <div className="font-semibold text-red-200">
                              Line {err.line}, Column {err.col}: {err.message}
                            </div>
                            {err.snippet && (
                              <div className="mt-1 bg-dark-900/80 p-1.5 rounded border border-gray-800 font-mono text-gray-300">
                                <code>{err.snippet}</code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Data Window Tab Content (Simulated Indicator Values) */}
              {activeTab === 'dataWindow' && (
                <div className="h-full flex flex-col">
                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-800/60 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">Symbol:</span>
                      <span className="font-bold text-white text-xs">BTC/USDT (1h)</span>
                      <span className="badge-blue text-[10px]">Simulated Feed</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Active Indicator:</span>
                      <span className="font-semibold text-primary-400">{scriptName}</span>
                    </div>
                  </div>

                  {/* Table of bars */}
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 bg-dark-900/60">
                          <th className="py-1 px-2">Time</th>
                          <th className="py-1 px-2">Close</th>
                          <th className="py-1 px-2">High / Low</th>
                          <th className="py-1 px-2">Volume</th>
                          <th className="py-1 px-2">Primary Indicator</th>
                          <th className="py-1 px-2">Levels / Signal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {dataRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-dark-800/40 transition-colors">
                            <td className="py-1 px-2 text-gray-400">{row.time}</td>
                            <td className="py-1 px-2 font-semibold text-white">
                              ${row.close.toLocaleString()}
                            </td>
                            <td className="py-1 px-2 text-gray-400">
                              <span className="text-emerald-400">${row.high.toLocaleString()}</span> /{' '}
                              <span className="text-red-400">${row.low.toLocaleString()}</span>
                            </td>
                            <td className="py-1 px-2 text-gray-400">{row.volume.toLocaleString()}</td>
                            <td className="py-1 px-2 font-medium text-primary-300">
                              {row.primary}
                            </td>
                            <td className="py-1 px-2">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  row.signalColor === 'emerald'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                    : row.signalColor === 'red'
                                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                    : row.signalColor === 'blue'
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                    : 'bg-gray-700/30 text-gray-400 border border-gray-700/50'
                                }`}
                              >
                                {row.signal}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Status Bar at Bottom */}
      <footer className="h-7 bg-dark-900/90 border border-gray-800/80 rounded-lg px-3 flex items-center justify-between text-xs text-gray-400 select-none flex-shrink-0 shadow-inner">
        {/* Left: Position & Stats */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-gray-300">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline text-gray-500">|</span>
          <span className="hidden sm:inline">
            {lineCount} lines, {charCount} chars
          </span>
          <span className="hidden md:inline text-gray-500">|</span>
          <span className="hidden md:inline">Spaces: 4</span>
        </div>

        {/* Right: Script Status & Engine */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                scriptStatus.includes('successfully')
                  ? 'bg-emerald-400 animate-pulse'
                  : scriptStatus.includes('failed')
                  ? 'bg-red-400'
                  : scriptStatus === 'Compiling...'
                  ? 'bg-yellow-400 animate-spin'
                  : 'bg-primary-400'
              }`}
            />
            <span
              className={`font-medium ${
                scriptStatus.includes('successfully')
                  ? 'text-emerald-400'
                  : scriptStatus.includes('failed')
                  ? 'text-red-400'
                  : 'text-gray-300'
              }`}
            >
              {scriptStatus}
            </span>
          </div>

          <span className="hidden sm:inline text-gray-600">|</span>
          <span className="hidden sm:inline text-gray-400 font-mono">Pine Script v1</span>
          <span className="hidden md:inline text-gray-600">|</span>
          <span className="hidden md:inline text-gray-400">UTF-8</span>
        </div>
      </footer>
    </div>
  )
}
