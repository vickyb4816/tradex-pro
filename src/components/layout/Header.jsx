import { useStore } from '../../store/useStore'
import { Bell, Search, Sun, Moon, Globe, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const { theme, toggleTheme, timezone, activeMarket, setActiveMarket, notifications } = useStore()
  const [time, setTime] = useState('')
  const [connected, setConnected] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { timeZone: timezone, hour12: true }))
    }, 1000)
    return () => clearInterval(timer)
  }, [timezone])

  return (
    <header className="h-14 bg-dark-900/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Left - Market Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex bg-dark-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveMarket('indian')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeMarket === 'indian' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🇮🇳 Indian
          </button>
          <button
            onClick={() => setActiveMarket('crypto')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeMarket === 'crypto' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            ₿ Crypto
          </button>
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search symbol..."
            className="pl-9 pr-4 py-1.5 bg-dark-800 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 w-64"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${connected ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-dark-800 px-2.5 py-1 rounded-full">
          <Globe className="w-3 h-3" />
          <span className="font-mono">{time}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
          )}
        </button>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
