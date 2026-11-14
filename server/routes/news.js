import { Router } from 'express'
import axios from 'axios'

const router = Router()

const NEWS_SOURCES = [
  { url: 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Trading,Technology,Blockchain', category: 'crypto' },
]

router.get('/', async (req, res) => {
  try {
    const { category = 'all' } = req.query
    const allNews = []

    // Crypto news from CryptoCompare
    try {
      const cryptoResp = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', { timeout: 5000 })
      if (cryptoResp.data?.Data) {
        allNews.push(...cryptoResp.data.Data.slice(0, 30).map(n => ({
          id: n.id,
          title: n.title,
          body: n.body?.substring(0, 200) + '...',
          source: n.source,
          url: n.url,
          imageUrl: n.imageurl,
          category: 'crypto',
          tags: n.categories?.split('|') || [],
          publishedAt: new Date(n.published_on * 1000).toISOString(),
          sentiment: n.title.toLowerCase().includes('bull') || n.title.toLowerCase().includes('surge') || n.title.toLowerCase().includes('rally') ? 'positive'
            : n.title.toLowerCase().includes('bear') || n.title.toLowerCase().includes('crash') || n.title.toLowerCase().includes('drop') ? 'negative' : 'neutral'
        })))
      }
    } catch (e) {}

    // Generate Indian market news placeholders based on current time
    const indianNews = [
      { id: 'in1', title: 'Nifty 50 Market Analysis - Key Levels to Watch', body: 'Technical analysis shows strong support levels. Market showing bullish momentum with FII inflows...', source: 'TradeX Analysis', category: 'indian', tags: ['NIFTY', 'Analysis'], sentiment: 'positive' },
      { id: 'in2', title: 'Banking Sector Outlook - HDFC Bank, ICICI Bank Lead', body: 'Banking stocks showing strength with improved NPA numbers and credit growth expectations...', source: 'TradeX Analysis', category: 'indian', tags: ['Banking', 'HDFC'], sentiment: 'positive' },
      { id: 'in3', title: 'IT Sector: TCS, Infosys Quarterly Results Preview', body: 'IT majors expected to report moderate growth amid global uncertainty. Deal pipeline remains strong...', source: 'TradeX Analysis', category: 'indian', tags: ['IT', 'TCS', 'INFY'], sentiment: 'neutral' },
      { id: 'in4', title: 'RBI Policy Impact on Markets', body: 'Reserve Bank of India monetary policy decision and its impact on equity and debt markets...', source: 'TradeX Analysis', category: 'indian', tags: ['RBI', 'Policy'], sentiment: 'neutral' },
      { id: 'in5', title: 'FII/DII Activity Tracker', body: 'Foreign institutional investors showing increased buying interest in Indian equities...', source: 'TradeX Analysis', category: 'indian', tags: ['FII', 'DII', 'Flows'], sentiment: 'positive' },
      { id: 'in6', title: 'Pharma Sector Rally - Sun Pharma, Dr Reddys', body: 'Pharma stocks gaining momentum on strong US FDA approvals and export growth...', source: 'TradeX Analysis', category: 'indian', tags: ['Pharma', 'SUNPHARMA'], sentiment: 'positive' },
    ].map(n => ({ ...n, url: '#', imageUrl: null, publishedAt: new Date().toISOString() }))

    allNews.push(...indianNews)

    // Filter by category
    const filtered = category === 'all' ? allNews : allNews.filter(n => n.category === category)

    // Sort by date
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    res.json(filtered)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news', details: error.message })
  }
})

export default router
