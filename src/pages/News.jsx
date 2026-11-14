import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Filter, Clock, Tag } from 'lucide-react'

// Realistic fallback news for graceful offline/development preview
const FALLBACK_NEWS = [
  {
    id: 'crypto-1',
    title: 'Bitcoin Breaks Resistance Above $92,000 as Institutional ETF Inflows Surge',
    body: 'Bitcoin continues its aggressive rally toward new highs driven by persistent spot ETF capital inflows and renewed corporate treasury allocations across major global markets.',
    source: 'CoinDesk',
    url: 'https://www.coindesk.com',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    category: 'crypto',
    tags: ['BTC', 'ETFs', 'Institutional'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18m ago
    sentiment: 'positive',
  },
  {
    id: 'crypto-2',
    title: 'Ethereum Layer-2 Total Value Locked Reaches New All-Time Peak',
    body: 'Active addresses and fee throughput across Arbitrum, Optimism, and Base climbed to record levels as gas optimization upgrades drive explosive decentralized finance adoption.',
    source: 'CoinTelegraph',
    url: 'https://cointelegraph.com',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=600&q=80',
    category: 'crypto',
    tags: ['ETH', 'Layer2', 'DeFi'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
    sentiment: 'positive',
  },
  {
    id: 'crypto-3',
    title: 'Global Regulators Evaluate Unified Framework for Liquid Staking Derivatives',
    body: 'Financial watchdogs initiate policy discussions to classify decentralized staking yields and establish standardized risk disclosure rules for institutional custodians.',
    source: 'Bloomberg Crypto',
    url: 'https://www.bloomberg.com/crypto',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80',
    category: 'crypto',
    tags: ['Regulation', 'Staking', 'Policy'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
    sentiment: 'neutral',
  },
  {
    id: 'crypto-4',
    title: 'Derivatives Flash Crash Flushes $280M Longs Amid Sudden Volatility Spike',
    body: 'Over-leveraged long contracts were liquidated across top perpetual exchanges as altcoins experienced a sharp retracement following an unexpected macro data release.',
    source: 'Decrypt',
    url: 'https://decrypt.co',
    imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
    category: 'crypto',
    tags: ['Altcoins', 'Liquidations', 'Derivatives'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(), // 3.5h ago
    sentiment: 'negative',
  },
  {
    id: 'crypto-5',
    title: 'Solana DEX Volume Flips Major Rivals Driven by High-Speed Micro-Transactions',
    body: 'On-chain metrics reveal unprecedented decentralized trading volume on Solana, driven by automated liquidity protocols and low-latency execution advantages.',
    source: 'The Block',
    url: 'https://theblock.co',
    imageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80',
    category: 'crypto',
    tags: ['SOL', 'DEX', 'Trading'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(), // 5h ago
    sentiment: 'positive',
  },
  {
    id: 'crypto-6',
    title: 'Mining Difficulty Jumps 4.2% as Hashrate Maintains Historic Trajectory',
    body: 'Bitcoin network mining difficulty reached a fresh benchmark difficulty adjustment, demonstrating strong miner capital investment ahead of upcoming difficulty windows.',
    source: 'CryptoSlate',
    url: 'https://cryptoslate.com',
    imageUrl: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=600&q=80',
    category: 'crypto',
    tags: ['Mining', 'Hashrate', 'BTC'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8h ago
    sentiment: 'neutral',
  },
  {
    id: 'indian-1',
    title: 'Nifty 50 Rally Eyes 25,000 Mark as FII Inflows Resume Across Blue Chips',
    body: 'Technical momentum indicates strong support levels with heavy institutional buying in heavyweights. Market breadth remains favorable backed by steady domestic mutual fund inflows.',
    source: 'TradeX Analysis',
    url: 'https://www.nseindia.com',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    category: 'indian',
    tags: ['NIFTY', 'Technical', 'FII'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
    sentiment: 'positive',
  },
  {
    id: 'indian-2',
    title: 'Banking Sector Surge: HDFC Bank, ICICI Bank Lead Financial Index Gains',
    body: 'Private sector lenders post robust net interest margins and declining credit costs. Brokerages upgrade sector outlook citing healthy credit growth and solid capital adequacy.',
    source: 'Economic Times',
    url: 'https://economictimes.indiatimes.com',
    imageUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=600&q=80',
    category: 'indian',
    tags: ['Banking', 'HDFCBANK', 'ICICIBANK'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(), // 1.5h ago
    sentiment: 'positive',
  },
  {
    id: 'indian-3',
    title: 'IT Sector Quarterly Outlook: TCS and Infosys Deal Pipelines in Focus',
    body: 'Indian software bellwethers prepare for upcoming earnings updates with cloud transformation and enterprise generative AI pilots driving large contract deal bookings.',
    source: 'MoneyControl',
    url: 'https://www.moneycontrol.com',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    category: 'indian',
    tags: ['IT', 'TCS', 'INFY'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(), // 2.5h ago
    sentiment: 'neutral',
  },
  {
    id: 'indian-4',
    title: 'RBI MPC Stance: Policy Rates Held Steady with Focus on Core Inflation Balance',
    body: 'The Monetary Policy Committee voted unanimously to keep the repo rate unchanged, reinforcing stable bond yields and providing clarity for debt and equity market participants.',
    source: 'LiveMint',
    url: 'https://www.livemint.com',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
    category: 'indian',
    tags: ['RBI', 'Economy', 'Policy'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 250).toISOString(), // 4h ago
    sentiment: 'neutral',
  },
  {
    id: 'indian-5',
    title: 'Auto Sector Slides Following Muted Commercial Vehicle Dispatch Figures',
    body: 'Automotive shares faced selling pressure as monthly retail sales volumes registered moderate growth, missing street estimates on sluggish rural demand trends.',
    source: 'Business Standard',
    url: 'https://www.business-standard.com',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    category: 'indian',
    tags: ['Auto', 'TATAMOTORS', 'Sales'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 370).toISOString(), // 6h ago
    sentiment: 'negative',
  },
  {
    id: 'indian-6',
    title: 'Pharma Stocks Advance as Sun Pharma and Dr. Reddy Bag FDA Approvals',
    body: 'Healthcare equities outperformed with generic drug majors receiving final therapeutic approvals from the US FDA, opening substantial market potential for export sales.',
    source: 'TradeX Analysis',
    url: 'https://www.nseindia.com',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    category: 'indian',
    tags: ['Pharma', 'SUNPHARMA', 'DRREDDY'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 430).toISOString(), // 7h ago
    sentiment: 'positive',
  },
]

// Calculate relative time using Date math
function getRelativeTime(timestamp) {
  if (!timestamp) return 'Just now'
  const past = new Date(timestamp).getTime()
  if (isNaN(past)) return 'Recently'

  const now = Date.now()
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000))

  if (diffInSeconds < 60) {
    return 'Just now'
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}d ago`
  }
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

export default function News() {
  const [news, setNews] = useState([])
  const [category, setCategory] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [categoryCounts, setCategoryCounts] = useState({
    all: 0,
    crypto: 0,
    indian: 0,
  })

  // Fetch news using api.getNews(category)
  const fetchNews = async (cat = category, showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await api.getNews(cat)
      const newsArray = Array.isArray(data) ? data : []

      if (newsArray.length > 0) {
        setNews(newsArray)

        // If fetching 'all', compute counts for all categories
        if (cat === 'all') {
          setCategoryCounts({
            all: newsArray.length,
            crypto: newsArray.filter((n) => (n.category || '').toLowerCase() === 'crypto').length,
            indian: newsArray.filter((n) => (n.category || '').toLowerCase() === 'indian').length,
          })
        } else {
          setCategoryCounts((prev) => ({
            ...prev,
            [cat]: newsArray.length,
          }))
        }
      } else {
        // Fallback for demonstration if API returns empty
        const fallbackFiltered = cat === 'all'
          ? FALLBACK_NEWS
          : FALLBACK_NEWS.filter((n) => (n.category || '').toLowerCase() === cat.toLowerCase())

        setNews(fallbackFiltered)
        setCategoryCounts({
          all: FALLBACK_NEWS.length,
          crypto: FALLBACK_NEWS.filter((n) => n.category === 'crypto').length,
          indian: FALLBACK_NEWS.filter((n) => n.category === 'indian').length,
        })
      }
      setLastRefreshed(new Date())
    } catch (error) {
      console.warn('api.getNews failed, using market fallback data:', error)
      const fallbackFiltered = cat === 'all'
        ? FALLBACK_NEWS
        : FALLBACK_NEWS.filter((n) => (n.category || '').toLowerCase() === cat.toLowerCase())

      setNews(fallbackFiltered)
      setCategoryCounts({
        all: FALLBACK_NEWS.length,
        crypto: FALLBACK_NEWS.filter((n) => n.category === 'crypto').length,
        indian: FALLBACK_NEWS.filter((n) => n.category === 'indian').length,
      })
      setLastRefreshed(new Date())
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch news on mount & when category tab changes
  useEffect(() => {
    fetchNews(category)
  }, [category])

  // Auto-refresh news every 5 minutes (300,000 ms)
  useEffect(() => {
    const FIVE_MINUTES = 5 * 60 * 1000
    const intervalId = setInterval(() => {
      fetchNews(category, true)
    }, FIVE_MINUTES)

    return () => clearInterval(intervalId)
  }, [category])

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchNews(category, true)
  }

  // Filter news by sentiment
  const filteredNews = news.filter((item) => {
    if (sentimentFilter === 'all') return true
    return (item.sentiment || '').toLowerCase() === sentimentFilter.toLowerCase()
  })

  // Sentiment distribution calculations
  const totalInCurrentCategory = news.length
  const positiveCount = news.filter((n) => (n.sentiment || '').toLowerCase() === 'positive').length
  const negativeCount = news.filter((n) => (n.sentiment || '').toLowerCase() === 'negative').length
  const neutralCount = news.filter((n) => (n.sentiment || '').toLowerCase() === 'neutral').length

  const positivePercent = totalInCurrentCategory > 0 ? Math.round((positiveCount / totalInCurrentCategory) * 100) : 0
  const negativePercent = totalInCurrentCategory > 0 ? Math.round((negativeCount / totalInCurrentCategory) * 100) : 0
  const neutralPercent = totalInCurrentCategory > 0 ? Math.round((neutralCount / totalInCurrentCategory) * 100) : 0

  // Category Tabs Configuration
  const categoryTabs = [
    { id: 'all', label: 'All', count: categoryCounts.all },
    { id: 'crypto', label: 'Crypto', count: categoryCounts.crypto },
    { id: 'indian', label: 'Indian Market', count: categoryCounts.indian },
  ]

  // Sentiment Filter Options Configuration
  const sentimentOptions = [
    { id: 'all', label: 'All', count: totalInCurrentCategory },
    { id: 'positive', label: 'Positive', count: positiveCount, icon: TrendingUp },
    { id: 'negative', label: 'Negative', count: negativeCount, icon: TrendingDown },
    { id: 'neutral', label: 'Neutral', count: neutralCount, icon: Minus },
  ]

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Market News & Intelligence</h1>
              <p className="text-xs text-gray-400">
                Curated real-time financial headlines, sentiment indicators, and market developments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 bg-dark-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Updated {getRelativeTime(lastRefreshed)}</span>
            </div>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3.5 active:scale-95 transition-all"
            title="Refresh news feed (Auto-refreshes every 5m)"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-gray-300 ${
                loading || isRefreshing ? 'animate-spin text-primary-400' : ''
              }`}
            />
            <span className="font-medium">
              {loading || isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Market Sentiment Bar & Aggregator Overview */}
      <div className="card bg-dark-800/70 border border-gray-800/60 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Aggregated Market Sentiment
            </span>
            <span className="text-xs text-gray-500">
              ({totalInCurrentCategory} articles in current view)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Bullish {positivePercent}% ({positiveCount})</span>
            </span>
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Minus className="w-3.5 h-3.5" />
              <span>Neutral {neutralPercent}% ({neutralCount})</span>
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Bearish {negativePercent}% ({negativeCount})</span>
            </span>
          </div>
        </div>

        {/* Visual Progress Ratio Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-dark-950 border border-gray-800/60">
          <div
            style={{ width: `${positivePercent}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Bullish: ${positivePercent}%`}
          />
          <div
            style={{ width: `${neutralPercent}%` }}
            className="bg-yellow-500 transition-all duration-500"
            title={`Neutral: ${neutralPercent}%`}
          />
          <div
            style={{ width: `${negativePercent}%` }}
            className="bg-red-500 transition-all duration-500"
            title={`Bearish: ${negativePercent}%`}
          />
        </div>
      </div>

      {/* Filter Toolbar: Category Tabs & Sentiment Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center p-1 bg-dark-900 border border-gray-800 rounded-xl space-x-1 overflow-x-auto">
          {categoryTabs.map((tab) => {
            const isActive = category === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                    isActive
                      ? 'bg-primary-700/80 text-white'
                      : 'bg-dark-800 text-gray-400 border border-gray-700/40'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sentiment Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-medium">Sentiment:</span>
          </div>

          {sentimentOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = sentimentFilter === opt.id

            if (opt.id === 'all') {
              return (
                <button
                  key={opt.id}
                  onClick={() => setSentimentFilter(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gray-200 text-dark-950 font-semibold shadow-sm'
                      : 'bg-dark-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[11px] opacity-75">({opt.count})</span>
                </button>
              )
            }

            if (opt.id === 'positive') {
              return (
                <button
                  key={opt.id}
                  onClick={() => setSentimentFilter(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm ring-1 ring-emerald-500'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Positive</span>
                  <span className="text-[11px] opacity-80">({opt.count})</span>
                </button>
              )
            }

            if (opt.id === 'negative') {
              return (
                <button
                  key={opt.id}
                  onClick={() => setSentimentFilter(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-red-600 text-white font-semibold shadow-sm ring-1 ring-red-500'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-red-400" />
                  <span>Negative</span>
                  <span className="text-[11px] opacity-80">({opt.count})</span>
                </button>
              )
            }

            // Neutral
            return (
              <button
                key={opt.id}
                onClick={() => setSentimentFilter(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-yellow-600 text-white font-semibold shadow-sm ring-1 ring-yellow-500'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-yellow-400" />
                <span>Neutral</span>
                <span className="text-[11px] opacity-80">({opt.count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content: Loading Skeletons, Empty State, or News Grid */}
      {loading ? (
        /* Loading Skeleton State */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="card bg-dark-800/60 border border-gray-800/60 rounded-xl p-4 flex flex-col justify-between animate-pulse"
            >
              <div>
                {/* Source & Sentiment Skeleton */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="h-5 w-20 bg-dark-700/70 rounded-full" />
                  <div className="h-5 w-16 bg-dark-700/70 rounded-full" />
                </div>

                {/* Thumbnail Skeleton */}
                <div className="w-full h-44 bg-dark-700/40 rounded-lg mb-3.5" />

                {/* Title Skeleton */}
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-dark-700/80 rounded w-5/6" />
                  <div className="h-4 bg-dark-700/80 rounded w-3/4" />
                </div>

                {/* Body Preview Skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-dark-700/50 rounded w-full" />
                  <div className="h-3 bg-dark-700/50 rounded w-11/12" />
                  <div className="h-3 bg-dark-700/50 rounded w-4/5" />
                </div>
              </div>

              <div>
                {/* Tags Skeleton */}
                <div className="flex gap-2 pt-3 border-t border-gray-800/60 mb-3.5">
                  <div className="h-4 w-12 bg-dark-700/40 rounded" />
                  <div className="h-4 w-14 bg-dark-700/40 rounded" />
                  <div className="h-4 w-10 bg-dark-700/40 rounded" />
                </div>

                {/* Footer Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-dark-700/50 rounded" />
                  <div className="h-3 w-20 bg-dark-700/50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        /* "No news found" Empty State */
        <div className="card p-12 text-center flex flex-col items-center justify-center my-6 max-w-md mx-auto border-dashed border-gray-800">
          <div className="w-16 h-16 rounded-2xl bg-dark-700/50 border border-gray-700/60 flex items-center justify-center text-gray-400 mb-4">
            <Newspaper className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1.5">No news found</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-sm leading-relaxed">
            No articles match your current category and sentiment selection. Try switching category tabs or clearing sentiment filters.
          </p>
          <div className="flex items-center gap-3">
            {(category !== 'all' || sentimentFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategory('all')
                  setSentimentFilter('all')
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={handleManualRefresh}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Feed</span>
            </button>
          </div>
        </div>
      ) : (
        /* News Grid Layout (2-3 columns responsive) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNews.map((item) => {
            const sentiment = (item.sentiment || 'neutral').toLowerCase()
            const tagsList = Array.isArray(item.tags)
              ? item.tags
              : typeof item.tags === 'string'
              ? item.tags.split(',').map((t) => t.trim())
              : []

            return (
              <div
                key={item.id || item.title}
                className="card-hover group flex flex-col justify-between p-4 bg-dark-800/80 backdrop-blur-sm border border-gray-800/50 rounded-xl hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
              >
                {/* Card Top Section */}
                <div>
                  {/* Badges Header: Source Name Badge & Sentiment Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="badge bg-dark-700/80 text-gray-300 border border-gray-700 font-medium truncate max-w-[150px]">
                      {item.source || (item.category === 'crypto' ? 'Crypto Market' : 'Indian Market')}
                    </span>

                    {/* Sentiment Badge: Positive, Negative, or Neutral */}
                    {sentiment === 'positive' && (
                      <span className="badge-green gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Positive
                      </span>
                    )}
                    {sentiment === 'negative' && (
                      <span className="badge-red gap-1">
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        Negative
                      </span>
                    )}
                    {sentiment !== 'positive' && sentiment !== 'negative' && (
                      <span className="badge-yellow gap-1">
                        <Minus className="w-3 h-3 text-yellow-400" />
                        Neutral
                      </span>
                    )}
                  </div>

                  {/* Optional Image Thumbnail */}
                  {item.imageUrl && (
                    <div className="relative w-full h-44 overflow-hidden rounded-lg bg-dark-900 mb-3 border border-gray-800/50">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Hide container gracefully on broken image links
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.style.display = 'none'
                          }
                        }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Title (font-semibold, text-white) */}
                  <h3 className="font-semibold text-white text-base leading-snug line-clamp-2 group-hover:text-primary-300 transition-colors mb-2">
                    {item.title}
                  </h3>

                  {/* Body Preview (2-3 lines, text-gray-400) */}
                  <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed mb-3">
                    {item.body}
                  </p>
                </div>

                {/* Card Bottom Section */}
                <div>
                  {/* Tags as small pills */}
                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3.5 pt-3 border-t border-gray-800/60">
                      <Tag className="w-3 h-3 text-gray-500" />
                      {tagsList.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-dark-900/90 text-gray-400 border border-gray-800"
                        >
                          #{tag}
                        </span>
                      ))}
                      {tagsList.length > 3 && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          +{tagsList.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Published Time & Read More Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/40 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{getRelativeTime(item.publishedAt)}</span>
                    </div>

                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                      onClick={(e) => {
                        if (!item.url || item.url === '#') {
                          e.preventDefault()
                        }
                      }}
                    >
                      <span>Read more</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
