import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import {
  Settings as SettingsIcon,
  Globe,
  Moon,
  Sun,
  Bell,
  Shield,
  Palette,
  Monitor,
  Save,
  RotateCcw,
  Key,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Volume2,
  VolumeX,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Check,
  X
} from 'lucide-react'
import { timezones } from '../utils/helpers'

// Custom Toggle Switch Component with Smooth Translate Animation
function ToggleSwitch({ checked, onChange, disabled = false, id, label }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-label={label || 'Toggle switch'}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 ${
        checked ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function Settings() {
  const {
    theme,
    toggleTheme,
    timezone,
    setTimezone,
    activeMarket,
    setActiveMarket,
    timeframe,
    setTimeframe,
    algoConfig,
    setAlgoConfig,
    paperHistory,
    resetPaperTrading,
    clearAlgoLogs,
    clearChat
  } = useStore()

  // Notification settings state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('tradex_notifications')
      return saved ? JSON.parse(saved) : {
        priceAlerts: true,
        tradeNotifications: true,
        newsUpdates: true,
        sound: false
      }
    } catch {
      return { priceAlerts: true, tradeNotifications: true, newsUpdates: true, sound: false }
    }
  })

  // Trading settings state
  const [tradingSettings, setTradingSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tradex_trading_settings')
      return saved ? JSON.parse(saved) : {
        defaultOrderType: 'MARKET',
        riskPerTrade: 2,
        defaultPositionSize: 10000,
        autoStopLoss: true,
        stopLossPercent: 2.0
      }
    } catch {
      return {
        defaultOrderType: 'MARKET',
        riskPerTrade: 2,
        defaultPositionSize: 10000,
        autoStopLoss: true,
        stopLossPercent: 2.0
      }
    }
  })

  // API Keys state
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('tradex_broker_keys')
      const parsed = saved ? JSON.parse(saved) : {}
      return {
        broker: parsed.broker || algoConfig?.broker || 'binance',
        apiKey: parsed.apiKey || algoConfig?.apiKey || '',
        secretKey: parsed.secretKey || algoConfig?.secretKey || ''
      }
    } catch {
      return {
        broker: algoConfig?.broker || 'binance',
        apiKey: algoConfig?.apiKey || '',
        secretKey: algoConfig?.secretKey || ''
      }
    }
  })

  // Visibility toggles for keys
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  // Reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  // File input ref for settings import
  const fileInputRef = useRef(null)

  // Helper to trigger toast
  const triggerToast = (title, message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ title, message, type })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  // Update notification preference
  const handleNotificationToggle = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem('tradex_notifications', JSON.stringify(updated))
      return updated
    })
    triggerToast('Preference Updated', `${key.replace(/([A-Z])/g, ' $1').trim()} updated`)
  }

  // Update trading settings helper
  const handleTradingSettingChange = (field, value) => {
    setTradingSettings(prev => {
      const updated = { ...prev, [field]: value }
      localStorage.setItem('tradex_trading_settings', JSON.stringify(updated))
      return updated
    })
  }

  // Save API keys
  const handleSaveApiKeys = (e) => {
    if (e) e.preventDefault()
    setAlgoConfig({
      broker: apiKeys.broker,
      apiKey: apiKeys.apiKey,
      secretKey: apiKeys.secretKey
    })
    localStorage.setItem('tradex_broker_keys', JSON.stringify(apiKeys))
    triggerToast('API Keys Saved', 'Broker keys securely stored in your local browser storage.')
  }

  // Save All Settings
  const handleSaveAllSettings = () => {
    localStorage.setItem('tradex_notifications', JSON.stringify(notifications))
    localStorage.setItem('tradex_trading_settings', JSON.stringify(tradingSettings))
    localStorage.setItem('tradex_broker_keys', JSON.stringify(apiKeys))
    setAlgoConfig({
      broker: apiKeys.broker,
      apiKey: apiKeys.apiKey,
      secretKey: apiKeys.secretKey
    })
    triggerToast('All Settings Saved', 'Your preferences and configurations have been successfully saved.')
  }

  // Clear application cache
  const handleClearCache = () => {
    try {
      localStorage.removeItem('tradex_chart_cache')
      localStorage.removeItem('tradex_screener_cache')
      localStorage.removeItem('tradex_news_cache')
      clearAlgoLogs()
      triggerToast('Cache Cleared', 'Application temporary cache and strategy logs have been cleared.')
    } catch (err) {
      triggerToast('Clear Failed', 'Failed to clear local cache.', 'error')
    }
  }

  // Export trade history
  const handleExportTradeHistory = () => {
    try {
      const historyData = paperHistory && paperHistory.length > 0
        ? paperHistory
        : [
            {
              id: 'sample-1',
              symbol: 'BTCUSDT',
              type: 'BUY',
              price: 64250.00,
              quantity: 0.15,
              total: 9637.50,
              timestamp: new Date().toISOString(),
              status: 'FILLED',
              note: 'Sample trade history export'
            }
          ]

      const jsonStr = JSON.stringify(historyData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tradex-trade-history-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      triggerToast('History Exported', `Downloaded ${historyData.length} trade record(s) to JSON.`)
    } catch (err) {
      triggerToast('Export Failed', 'Unable to export trade history.', 'error')
    }
  }

  // Import settings from JSON
  const handleImportSettings = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.notifications) {
          setNotifications(data.notifications)
          localStorage.setItem('tradex_notifications', JSON.stringify(data.notifications))
        }
        if (data.tradingSettings) {
          setTradingSettings(data.tradingSettings)
          localStorage.setItem('tradex_trading_settings', JSON.stringify(data.tradingSettings))
        }
        if (data.timezone) {
          setTimezone(data.timezone)
        }
        if (data.timeframe) {
          setTimeframe(data.timeframe)
        }
        if (data.activeMarket) {
          setActiveMarket(data.activeMarket)
        }
        triggerToast('Settings Imported', 'Custom configuration restored successfully.')
      } catch (err) {
        triggerToast('Import Error', 'Invalid settings JSON configuration file.', 'error')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  // Reset all settings to factory default
  const handleResetAllSettings = () => {
    const defaultNotifications = {
      priceAlerts: true,
      tradeNotifications: true,
      newsUpdates: true,
      sound: false
    }
    const defaultTrading = {
      defaultOrderType: 'MARKET',
      riskPerTrade: 2,
      defaultPositionSize: 10000,
      autoStopLoss: true,
      stopLossPercent: 2.0
    }
    const defaultKeys = {
      broker: 'binance',
      apiKey: '',
      secretKey: ''
    }

    setNotifications(defaultNotifications)
    setTradingSettings(defaultTrading)
    setApiKeys(defaultKeys)

    localStorage.removeItem('tradex_notifications')
    localStorage.removeItem('tradex_trading_settings')
    localStorage.removeItem('tradex_broker_keys')

    setTimezone('Asia/Kolkata')
    setTimeframe('1h')
    setActiveMarket('crypto')
    setAlgoConfig(defaultKeys)
    resetPaperTrading()
    clearAlgoLogs()
    clearChat()

    setShowResetConfirm(false)
    triggerToast('Settings Reset', 'All settings and paper trading data reset to factory defaults.')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-dark-800/95 backdrop-blur-xl border border-primary-500/30 rounded-xl shadow-2xl shadow-primary-500/10 text-white animate-fadeIn max-w-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{toast.title}</p>
            <p className="text-xs text-gray-400 truncate">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportSettings}
        accept=".json"
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-800/60">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
            <div className="w-9 h-9 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure system preferences, broker integrations, notifications, and trading rules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAllSettings}
            className="btn-primary flex items-center gap-2 text-sm shadow-lg shadow-primary-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save All</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================
            CARD 1: General Settings
            ========================================= */}
        <div className="card flex flex-col justify-between">
          <div>
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">General Settings</h2>
                <p className="text-xs text-gray-400">Display, timezone, and environment preferences</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Theme: Dark/Light Toggle */}
              <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-400" />
                    )}
                    <label htmlFor="theme-toggle" className="text-sm font-medium text-white cursor-pointer">
                      Theme
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">
                    Switch between Dark mode and Light mode
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-400 capitalize">
                    {theme}
                  </span>
                  <ToggleSwitch
                    id="theme-toggle"
                    label="Toggle dark/light theme"
                    checked={theme === 'dark'}
                    onChange={() => {
                      toggleTheme()
                      triggerToast('Theme Switched', `Active theme is now ${theme === 'dark' ? 'light' : 'dark'}.`)
                    }}
                  />
                </div>
              </div>

              {/* Timezone: Dropdown selector */}
              <div className="py-2 border-b border-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <label className="text-sm font-medium text-white">Timezone</label>
                  </div>
                  <span className="text-xs text-primary-400 font-mono font-medium">
                    {timezone}
                  </span>
                </div>
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value)
                    triggerToast('Timezone Updated', `Timezone set to ${e.target.value}`)
                  }}
                  className="select-field w-full text-sm"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value} className="bg-dark-900 text-white">
                      {tz.label} ({tz.value})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Synchronizes chart timestamps and real-time trade event logs
                </p>
              </div>

              {/* Default Market: Indian/Crypto Radio buttons */}
              <div className="py-2 border-b border-gray-800/50">
                <label className="text-sm font-medium text-white block mb-2">
                  Default Market
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => {
                      setActiveMarket('crypto')
                      triggerToast('Market Changed', 'Default market set to Crypto.')
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      activeMarket === 'crypto'
                        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300 ring-1 ring-yellow-500/30'
                        : 'bg-dark-900 border-gray-700/60 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultMarket"
                      value="crypto"
                      checked={activeMarket === 'crypto'}
                      onChange={() => setActiveMarket('crypto')}
                      className="accent-yellow-500 cursor-pointer"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span>₿</span> Crypto
                      </p>
                      <p className="text-[11px] text-gray-400">24/7 Global Trading</p>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setActiveMarket('indian')
                      triggerToast('Market Changed', 'Default market set to Indian Stocks.')
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      activeMarket === 'indian'
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 ring-1 ring-orange-500/30'
                        : 'bg-dark-900 border-gray-700/60 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultMarket"
                      value="indian"
                      checked={activeMarket === 'indian'}
                      onChange={() => setActiveMarket('indian')}
                      className="accent-orange-500 cursor-pointer"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span>🇮🇳</span> Indian
                      </p>
                      <p className="text-[11px] text-gray-400">NSE & BSE Equities</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Default Timeframe: Dropdown */}
              <div className="py-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Default Timeframe</label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-500/15 text-primary-400 border border-primary-500/20">
                    {timeframe.toUpperCase()}
                  </span>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => {
                    setTimeframe(e.target.value)
                    triggerToast('Timeframe Updated', `Default chart timeframe set to ${e.target.value}`)
                  }}
                  className="select-field w-full text-sm"
                >
                  <option value="1m">1 Minute (1m)</option>
                  <option value="3m">3 Minutes (3m)</option>
                  <option value="5m">5 Minutes (5m)</option>
                  <option value="15m">15 Minutes (15m)</option>
                  <option value="30m">30 Minutes (30m)</option>
                  <option value="1h">1 Hour (1h)</option>
                  <option value="2h">2 Hours (2h)</option>
                  <option value="4h">4 Hours (4h)</option>
                  <option value="1d">1 Day (1D)</option>
                  <option value="1w">1 Week (1W)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Initial resolution applied when opening charts and screener analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            CARD 2: Notification Settings
            ========================================= */}
        <div className="card flex flex-col justify-between">
          <div>
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Notification Settings</h2>
                <p className="text-xs text-gray-400">Configure alerts, sound effects, and updates</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Price Alerts */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/60 border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-white">Price Alerts</p>
                  <p className="text-xs text-gray-400">
                    Instant alerts when watchlist symbols cross specified thresholds
                  </p>
                </div>
                <ToggleSwitch
                  id="notify-price-alerts"
                  label="Toggle price alerts"
                  checked={notifications.priceAlerts}
                  onChange={() => handleNotificationToggle('priceAlerts')}
                />
              </div>

              {/* Trade Notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/60 border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-white">Trade Notifications</p>
                  <p className="text-xs text-gray-400">
                    Order execution, fill notices, and auto stop-loss triggers
                  </p>
                </div>
                <ToggleSwitch
                  id="notify-trades"
                  label="Toggle trade notifications"
                  checked={notifications.tradeNotifications}
                  onChange={() => handleNotificationToggle('tradeNotifications')}
                />
              </div>

              {/* News Updates */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/60 border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-white">News Updates</p>
                  <p className="text-xs text-gray-400">
                    Real-time market news headlines and crypto breaking alerts
                  </p>
                </div>
                <ToggleSwitch
                  id="notify-news"
                  label="Toggle news updates"
                  checked={notifications.newsUpdates}
                  onChange={() => handleNotificationToggle('newsUpdates')}
                />
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-900/60 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-dark-800 text-gray-400">
                    {notifications.sound ? (
                      <Volume2 className="w-4 h-4 text-primary-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Sound</p>
                    <p className="text-xs text-gray-400">
                      Audio feedback for order execution and alert triggers
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  id="notify-sound"
                  label="Toggle notification sound"
                  checked={notifications.sound}
                  onChange={() => handleNotificationToggle('sound')}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
            <span>Browser notification permission</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Enabled
            </span>
          </div>
        </div>

        {/* =========================================
            CARD 3: Trading Settings
            ========================================= */}
        <div className="card flex flex-col justify-between">
          <div>
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Trading Settings</h2>
                <p className="text-xs text-gray-400">Order execution defaults and risk management</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Default Order Type: Market/Limit dropdown */}
              <div className="py-2 border-b border-gray-800/50">
                <label className="text-sm font-medium text-white block mb-1.5">
                  Default Order Type
                </label>
                <select
                  value={tradingSettings.defaultOrderType}
                  onChange={(e) => handleTradingSettingChange('defaultOrderType', e.target.value)}
                  className="select-field w-full text-sm"
                >
                  <option value="MARKET">Market Order (Immediate Execution)</option>
                  <option value="LIMIT">Limit Order (Specify Target Price)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pre-selected order type on trade placement cards
                </p>
              </div>

              {/* Risk per Trade: Percentage slider (1-5%) */}
              <div className="py-2 border-b border-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-sm font-medium text-white block">
                      Risk per Trade
                    </label>
                    <p className="text-xs text-gray-400">
                      Maximum account equity risked on a single position
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary-500/15 text-primary-400 border border-primary-500/30 font-mono">
                    {tradingSettings.riskPerTrade}%
                  </span>
                </div>
                <div className="space-y-1">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={tradingSettings.riskPerTrade}
                    onChange={(e) => handleTradingSettingChange('riskPerTrade', parseFloat(e.target.value))}
                    className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500 px-0.5">
                    <span>1% Conservative</span>
                    <span>3% Balanced</span>
                    <span>5% Aggressive</span>
                  </div>
                </div>
              </div>

              {/* Default Position Size: Input */}
              <div className="py-2 border-b border-gray-800/50">
                <label className="text-sm font-medium text-white block mb-1.5">
                  Default Position Size
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">
                    {activeMarket === 'indian' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={tradingSettings.defaultPositionSize}
                    onChange={(e) => handleTradingSettingChange('defaultPositionSize', Number(e.target.value))}
                    placeholder="10000"
                    className="input-field pl-8 text-sm font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Initial capital allocated when creating new paper trade orders
                </p>
              </div>

              {/* Auto Stop-Loss: Toggle + Percentage Input */}
              <div className="py-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">Auto Stop-Loss</p>
                    <p className="text-xs text-gray-400">
                      Automatically attach protective stop-loss to newly opened trades
                    </p>
                  </div>
                  <ToggleSwitch
                    id="auto-sl-toggle"
                    label="Toggle auto stop loss"
                    checked={tradingSettings.autoStopLoss}
                    onChange={(val) => handleTradingSettingChange('autoStopLoss', val)}
                  />
                </div>

                {tradingSettings.autoStopLoss && (
                  <div className="flex items-center gap-3 pt-2">
                    <label className="text-xs text-gray-300 flex-shrink-0">
                      Stop-Loss Trigger:
                    </label>
                    <div className="relative w-36">
                      <input
                        type="number"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={tradingSettings.stopLossPercent}
                        onChange={(e) => handleTradingSettingChange('stopLossPercent', parseFloat(e.target.value) || 0)}
                        className="input-field pr-7 text-sm font-mono py-1.5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                        %
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">below entry price</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            CARD 4: API Keys
            ========================================= */}
        <div className="card flex flex-col justify-between">
          <div>
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">API Keys</h2>
                <p className="text-xs text-gray-400">Connect your trading broker and algorithmic exchange</p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKeys} className="space-y-4">
              {/* Broker Selection */}
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5">
                  Broker / Exchange
                </label>
                <select
                  value={apiKeys.broker}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, broker: e.target.value }))}
                  className="select-field w-full text-sm"
                >
                  <option value="Binance">Binance (Crypto Spot & Futures)</option>
                  <option value="Fyers">Fyers (API v3 - Indian Stocks NSE/BSE)</option>
                  <option value="CoinDCX">CoinDCX (Indian Crypto Exchange)</option>
                  <option value="Delta Exchange">Delta Exchange (Crypto Derivatives)</option>
                </select>
              </div>

              {/* Broker API Key */}
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5">
                  Broker API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeys.apiKey}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter broker API public key"
                    className="input-field pr-10 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Broker Secret Key */}
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5">
                  Broker Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={apiKeys.secretKey}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="Enter broker API secret key"
                    className="input-field pr-10 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-3 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-300">Security Warning</p>
                  <p className="text-amber-200/90 leading-relaxed">
                    Keys are stored locally. Never share your API keys.
                  </p>
                </div>
              </div>

              {/* Save Keys button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm shadow-md shadow-primary-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Keys</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* =========================================
            CARD 5: Data & Storage
            ========================================= */}
        <div className="card flex flex-col justify-between">
          <div>
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Data & Storage</h2>
                <p className="text-xs text-gray-400">Manage local data, backups, and cache storage</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Clear Cache button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-dark-900/60 border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-gray-400" />
                    Clear Cache
                  </p>
                  <p className="text-xs text-gray-400">
                    Purges cached market quotes, candle history, and algo logs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="btn-secondary text-xs flex items-center justify-center gap-1.5 sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache</span>
                </button>
              </div>

              {/* Export Trade History button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-dark-900/60 border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Export Trade History
                  </p>
                  <p className="text-xs text-gray-400">
                    Download complete paper trading logs and records in JSON format
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTradeHistory}
                  className="btn-secondary text-xs flex items-center justify-center gap-1.5 sm:self-center"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export History</span>
                </button>
              </div>

              {/* Import Settings button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-dark-900/60 border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-400" />
                    Import Settings
                  </p>
                  <p className="text-xs text-gray-400">
                    Restore application preferences and trading rules from JSON backup
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs flex items-center justify-center gap-1.5 sm:self-center"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import Settings</span>
                </button>
              </div>

              {/* Reset All Settings button (with confirmation) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-red-500/5 border border-red-500/20">
                <div>
                  <p className="text-sm font-medium text-red-400 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-red-400" />
                    Reset All Settings
                  </p>
                  <p className="text-xs text-gray-400">
                    Restore all options, reset paper balance, and clear saved keys
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="btn-danger text-xs flex items-center justify-center gap-1.5 sm:self-center shadow-md shadow-red-600/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            CARD 6: About
            ========================================= */}
        <div className="card flex flex-col justify-between">
          <div>
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">About</h2>
                <p className="text-xs text-gray-400">Version, project metadata, and architecture stack</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* App Version Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary-900/30 via-purple-900/20 to-dark-900 border border-primary-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-wide">
                      TradeX Pro
                    </span>
                    <span className="badge-blue text-[11px] font-mono">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Built with ❤️ for Indian & Crypto traders
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Tech Stack Badges */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                  Tech Stack & Engine
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge-blue">React 18</span>
                  <span className="badge-yellow">Vite 6</span>
                  <span className="badge-blue">Tailwind CSS</span>
                  <span className="badge-green">Zustand</span>
                  <span className="badge-yellow">Lightweight Charts</span>
                  <span className="badge-green">Node.js & Express</span>
                  <span className="badge-blue">WebSocket Feed</span>
                  <span className="badge-yellow">Better-SQLite3</span>
                  <span className="badge-green">Lucide React</span>
                </div>
              </div>

              {/* Status information */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-dark-900/60 border border-gray-800">
                  <span className="text-gray-500 block mb-0.5">Environment</span>
                  <span className="text-gray-200 font-medium">Production Ready</span>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-900/60 border border-gray-800">
                  <span className="text-gray-500 block mb-0.5">License</span>
                  <span className="text-gray-200 font-medium">Proprietary / MIT</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-800/60 text-center text-[11px] text-gray-500">
            TradeX Pro v1.0.0 • High-Performance Multi-Asset Trading Terminal
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset All Settings */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-800 border border-gray-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset All Settings?</h3>
                <p className="text-xs text-gray-400">This action cannot be reversed</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              This will restore all general configurations, notification preferences, trading rules, and stored broker API keys to their default states. Your paper trading balance and trade history will also be reset.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllSettings}
                className="btn-danger text-sm flex items-center gap-1.5 shadow-lg shadow-red-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yes, Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
