import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import {
  LayoutDashboard, Search, LineChart, Target, Code2, MessageSquare,
  Wallet, Newspaper, Bot, Settings, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/screener', icon: Search, label: 'Screener' },
  { path: '/charts', icon: LineChart, label: 'Charts' },
  { path: '/strategies', icon: Target, label: 'Strategies' },
  { path: '/pine-editor', icon: Code2, label: 'Pine Editor' },
  { path: '/chatbot', icon: MessageSquare, label: 'AI Advisor' },
  { path: '/paper-trade', icon: Wallet, label: 'Paper Trade' },
  { path: '/news', icon: Newspaper, label: 'News' },
  { path: '/algo-trade', icon: Bot, label: 'Algo Trade' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useStore()
  const location = useLocation()

  return (
    <aside className={`fixed left-0 top-0 h-full bg-dark-900/95 backdrop-blur-xl border-r border-gray-800/50 z-50 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-56' : 'w-16'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-gray-800/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && <span className="text-lg font-bold gradient-text">TradeX Pro</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive
                ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20'
                : 'text-gray-400 hover:text-white hover:bg-dark-800/80'}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-gray-800/50 text-gray-500 hover:text-white transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </aside>
  )
}
