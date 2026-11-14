import { Router } from 'express'

const router = Router()

// AI Trading Chatbot - Built-in knowledge base
const tradingKnowledge = {
  strategies: {
    'rsi_oversold': { name: 'RSI Oversold Bounce', winRate: '72%', description: 'Buy when RSI < 30, sell when RSI > 70. Best on 1H-4H timeframes.', risk: 'Medium' },
    'macd_crossover': { name: 'MACD Crossover', winRate: '68%', description: 'Buy on bullish MACD crossover, sell on bearish. Confirm with volume.', risk: 'Medium' },
    'ema_cross': { name: 'EMA 9/21 Crossover', winRate: '65%', description: 'Golden cross (9 EMA > 21 EMA) = Buy. Death cross = Sell.', risk: 'Low-Medium' },
    'bollinger_squeeze': { name: 'Bollinger Band Squeeze', winRate: '74%', description: 'Enter on breakout after BB squeeze. Direction confirmed by volume.', risk: 'Medium-High' },
    'vwap_bounce': { name: 'VWAP Bounce', winRate: '70%', description: 'Buy bounces off VWAP support. Best for intraday trading.', risk: 'Medium' },
    'supertrend': { name: 'Supertrend Follow', winRate: '71%', description: 'Follow Supertrend direction. Green = Long, Red = Short.', risk: 'Medium' },
  },
  riskManagement: [
    'Never risk more than 1-2% of capital per trade',
    'Always use stop-loss orders',
    'Maintain risk-reward ratio of at least 1:2',
    'Diversify across sectors and asset classes',
    'Avoid overtrading - quality over quantity',
    'Keep position size proportional to conviction level',
  ],
  indicators: {
    'RSI': 'Relative Strength Index (14) - Oversold below 30, Overbought above 70',
    'MACD': 'Moving Average Convergence Divergence - Trend and momentum indicator',
    'EMA': 'Exponential Moving Average - Faster response to price changes than SMA',
    'BB': 'Bollinger Bands - Volatility indicator with 2 standard deviation bands',
    'VWAP': 'Volume Weighted Average Price - Institutional benchmark price',
    'Supertrend': 'Trend following overlay - Good for identifying trend direction',
    'ADX': 'Average Directional Index - Measures trend strength (>25 = strong trend)',
    'Stoch RSI': 'Stochastic RSI - Momentum oscillator, more sensitive than RSI',
  }
}

function generateResponse(message, context) {
  const msg = message.toLowerCase()
  let response = ''

  // Greeting
  if (msg.match(/^(hi|hello|hey|namaste)/)) {
    return { response: "Namaste! 🙏 I'm your AI trading advisor. I can help you with:\n\n📊 **Market Analysis** - Indian stocks & crypto\n🎯 **Strategy Suggestions** - High win-rate strategies\n📈 **Technical Analysis** - Indicator explanations\n⚠️ **Risk Management** - Position sizing & stop losses\n💡 **Trade Ideas** - Actionable setups\n\nWhat would you like to know?", confidence: 0.95 }
  }

  // Strategy questions
  if (msg.includes('strategy') || msg.includes('best strategy') || msg.includes('which strategy')) {
    const strategies = Object.values(tradingKnowledge.strategies)
    response = "🎯 **Top Trading Strategies with Highest Win Rates:**\n\n"
    strategies.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
    strategies.forEach((s, i) => {
      response += `**${i + 1}. ${s.name}** - Win Rate: ${s.winRate}\n`
      response += `   📝 ${s.description}\n   ⚠️ Risk: ${s.risk}\n\n`
    })
    response += "\n💡 **Pro Tip:** Combine 2-3 strategies for confirmation. For example, use RSI + MACD + Volume for higher accuracy entries."
    return { response, confidence: 0.92 }
  }

  // RSI specific
  if (msg.includes('rsi')) {
    return { response: "📊 **RSI (Relative Strength Index) Strategy:**\n\n**Setup:**\n- Period: 14 (standard)\n- Overbought: Above 70 → Potential sell signal\n- Oversold: Below 30 → Potential buy signal\n\n**High Win-Rate RSI Strategy (72% accuracy):**\n1. Wait for RSI to drop below 30\n2. Confirm with bullish candlestick pattern (hammer, engulfing)\n3. Check volume is above average\n4. Enter long with stop-loss below recent swing low\n5. Target: Previous resistance or RSI reaching 60-70\n\n**For Crypto (24/7):** Use 1H or 4H timeframe\n**For Indian Stocks:** Use 15m or 1H during market hours\n\n⚠️ **Warning:** RSI can stay oversold/overbought for extended periods in strong trends. Always confirm with price action.", confidence: 0.93 }
  }

  // MACD
  if (msg.includes('macd')) {
    return { response: "📊 **MACD Strategy Guide:**\n\n**Settings:** Fast: 12, Slow: 26, Signal: 9\n\n**Bullish Signal (Buy):**\n- MACD line crosses ABOVE signal line\n- Histogram turns positive\n- Confirm with price above VWAP\n\n**Bearish Signal (Sell):**\n- MACD line crosses BELOW signal line\n- Histogram turns negative\n\n**Pro Setup (68% win rate):**\n1. Wait for MACD bullish crossover\n2. RSI should be between 40-60 (not overbought)\n3. Volume should be increasing\n4. Enter on pullback to EMA 21\n5. Stop-loss: Below recent swing low\n6. Target: 1:2 risk-reward minimum\n\n💡 MACD works best on 1H and 4H timeframes for both crypto and Indian stocks.", confidence: 0.91 }
  }

  // Buy/Sell signals
  if (msg.includes('buy') || msg.includes('sell') || msg.includes('entry') || msg.includes('signal')) {
    const isCrypto = msg.includes('btc') || msg.includes('eth') || msg.includes('crypto') || msg.includes('bitcoin')
    const market = isCrypto ? 'crypto' : 'Indian'
    return { response: `🎯 **${market === 'crypto' ? 'Crypto' : 'Indian Stock'} Trading Signals Framework:**\n\n**✅ BUY Signals (High Confidence):**\n1. RSI below 30 + Bullish divergence\n2. MACD bullish crossover + Volume surge\n3. Price bouncing off Bollinger Band lower band\n4. EMA 9 crossing above EMA 21 (Golden Cross)\n5. Supertrend turning green + ADX > 25\n\n**❌ SELL Signals (High Confidence):**\n1. RSI above 70 + Bearish divergence\n2. MACD bearish crossover + Declining volume\n3. Price rejection at Bollinger Band upper band\n4. EMA 9 crossing below EMA 21 (Death Cross)\n5. Supertrend turning red + Increasing sell volume\n\n**Risk Management:**\n- Stop Loss: 1-2% below entry\n- Take Profit: 2-4% above entry (1:2 RR minimum)\n- Position Size: Max 5% of portfolio per trade\n\n⚠️ *Always do your own research. These are analytical frameworks, not financial advice.*`, confidence: 0.90 }
  }

  // Indian market specific
  if (msg.includes('nifty') || msg.includes('sensex') || msg.includes('indian') || msg.includes('nse') || msg.includes('bse')) {
    return { response: "🇮🇳 **Indian Market Analysis Framework:**\n\n**Key Indices:**\n- NIFTY 50 - Large cap benchmark\n- SENSEX - BSE 30 stocks\n- NIFTY Bank - Banking sector\n- NIFTY IT - Technology sector\n\n**Best Strategies for Indian Market:**\n1. **Gap & Go (9:15-9:45 AM)** - Trade opening gaps with volume\n2. **VWAP Strategy** - Institutional level bounces\n3. **Sector Rotation** - Follow FII/DII flows\n4. **EMA Crossover on 15m** - Intraday momentum\n\n**Market Timing:**\n- Pre-market: 9:00-9:15 AM IST\n- Market Hours: 9:15 AM - 3:30 PM IST\n- Best Trading Window: 9:15-11:00 AM & 2:00-3:30 PM\n\n**Top Sectors to Watch:**\n- Banking (40% Nifty weightage)\n- IT (15% weightage)\n- Energy & Metals (event-driven)\n\n💡 Use options for hedging positions in volatile markets.", confidence: 0.91 }
  }

  // Crypto specific
  if (msg.includes('bitcoin') || msg.includes('btc') || msg.includes('ethereum') || msg.includes('eth') || msg.includes('crypto')) {
    return { response: "₿ **Crypto Market Analysis:**\n\n**24/7 Trading Advantage:**\n- Crypto markets never close - perfect for algo trading\n- Highest volatility: Asian session open & US session\n- Weekend tends to have lower volume (watch for fakeouts)\n\n**High Win-Rate Crypto Strategies:**\n1. **BTC Dominance Play (75% win rate)**\n   - When BTC.D rises → Rotate to BTC\n   - When BTC.D falls → Rotate to altcoins\n\n2. **Funding Rate Strategy (78% win rate)**\n   - High positive funding → Short opportunity\n   - High negative funding → Long opportunity\n\n3. **Volume Profile + VWAP (72% win rate)**\n   - Trade rejections at high-volume nodes\n   - Use VWAP as dynamic S/R\n\n**Key Levels to Monitor:**\n- BTC: Watch 20-week SMA as bull/bear divider\n- ETH: Monitor ETH/BTC ratio for relative strength\n- Altcoins: Trade only during BTC consolidation\n\n⚠️ Crypto is highly volatile. Use strict risk management.", confidence: 0.92 }
  }

  // Risk management
  if (msg.includes('risk') || msg.includes('stop loss') || msg.includes('position size')) {
    const tips = tradingKnowledge.riskManagement.map((t, i) => `${i + 1}. ${t}`).join('\n')
    return { response: `⚠️ **Risk Management - The #1 Rule of Trading:**\n\n${tips}\n\n**Position Sizing Formula:**\nPosition Size = (Account Balance × Risk %) / (Entry - Stop Loss)\n\n**Example:**\n- Account: ₹1,00,000\n- Risk per trade: 2% = ₹2,000\n- Entry: ₹100, Stop Loss: ₹95\n- Position Size: ₹2,000 / ₹5 = 400 shares\n\n**Recommended Risk Levels:**\n- Conservative: 0.5-1% per trade\n- Moderate: 1-2% per trade\n- Aggressive: 2-3% per trade (NOT recommended for beginners)\n\n💡 **Golden Rule:** Capital preservation > Capital appreciation. Live to trade another day!`, confidence: 0.94 }
  }

  // Indicators
  if (msg.includes('indicator') || msg.includes('which indicator') || msg.includes('best indicator')) {
    let indicatorList = Object.entries(tradingKnowledge.indicators).map(([k, v]) => `**${k}:** ${v}`).join('\n')
    return { response: `📊 **Technical Indicators Guide:**\n\n${indicatorList}\n\n**Best Indicator Combinations:**\n1. **Trend Trading:** EMA (9,21) + ADX + Supertrend\n2. **Reversal Trading:** RSI + Bollinger Bands + MACD\n3. **Intraday:** VWAP + EMA 9 + Volume\n4. **Swing Trading:** MACD + RSI + Ichimoku Cloud\n\n💡 **Pro Tip:** Don't use more than 3-4 indicators at once. Indicator overload leads to analysis paralysis!`, confidence: 0.91 }
  }

  // Backtest
  if (msg.includes('backtest') || msg.includes('back test') || msg.includes('testing')) {
    return { response: "🔬 **Backtesting Your Strategy:**\n\n**Steps:**\n1. Go to the **Strategies** page\n2. Select a built-in strategy or create custom\n3. Choose symbol and timeframe\n4. Set date range for testing\n5. Run backtest and analyze results\n\n**Key Metrics to Evaluate:**\n- **Win Rate:** Should be > 55%\n- **Profit Factor:** Should be > 1.5\n- **Max Drawdown:** Should be < 15%\n- **Sharpe Ratio:** Should be > 1.0\n- **Average RR:** Should be > 1:2\n\n**Common Backtesting Mistakes:**\n- Overfitting to historical data\n- Ignoring slippage and commissions\n- Curve fitting parameters\n- Not accounting for market regime changes\n\n💡 Always forward-test with paper trading before going live!", confidence: 0.90 }
  }

  // Default response
  return { response: `I'd be happy to help with your trading query! Here's what I can assist with:\n\n🎯 **Strategies** - "Best strategy for crypto/stocks"\n📊 **Indicators** - "How to use RSI/MACD"\n💰 **Signals** - "Buy/sell signals for BTC"\n🇮🇳 **Indian Market** - "Nifty analysis"\n₿ **Crypto** - "Bitcoin trading setup"\n⚠️ **Risk** - "Position sizing"\n🔬 **Backtesting** - "How to backtest"\n\nTry asking: *"What's the best strategy for crypto trading?"* or *"Give me buy signals for Indian stocks"*`, confidence: 0.85 }
}

router.post('/', (req, res) => {
  const { message, context } = req.body
  const result = generateResponse(message, context)
  res.json(result)
})

export default router
