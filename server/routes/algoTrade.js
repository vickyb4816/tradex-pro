import { Router } from 'express'
import { getDb } from '../db/setup.js'

const router = Router()

let algoInterval = null
let algoEngine = null

router.post('/start', (req, res) => {
  const db = getDb()
  const { broker, apiKey, secretKey, strategy, symbol, market } = req.body

  if (!apiKey || !secretKey) {
    return res.status(400).json({ error: 'API Key and Secret Key are required' })
  }

  if (algoInterval) {
    return res.status(400).json({ error: 'Algo trading is already running' })
  }

  // Save config
  db.prepare('INSERT OR REPLACE INTO algo_config (id, broker, api_key, secret_key, strategy, symbol, is_running) VALUES (1, ?, ?, ?, ?, ?, 1)')
    .run(broker, apiKey, '***hidden***', strategy, symbol)

  // Log start
  db.prepare('INSERT INTO algo_logs (type, message, data) VALUES (?, ?, ?)')
    .run('INFO', `Algo trading started - ${strategy} on ${symbol}`, JSON.stringify({ broker, strategy, symbol, market }))

  // Start algo engine (simulated - in real implementation, connect to broker API)
  algoInterval = setInterval(() => {
    const timestamp = new Date().toISOString()
    const signals = generateSignal(strategy, symbol)

    db.prepare('INSERT INTO algo_logs (type, message, data) VALUES (?, ?, ?)')
      .run(signals.type, signals.message, JSON.stringify(signals.data))
  }, 30000) // Check every 30 seconds

  res.json({ status: 'running', message: `Algo trading started for ${symbol} using ${strategy}` })
})

router.post('/stop', (req, res) => {
  const db = getDb()

  if (algoInterval) {
    clearInterval(algoInterval)
    algoInterval = null
  }

  db.prepare('UPDATE algo_config SET is_running = 0 WHERE id = 1').run()
  db.prepare('INSERT INTO algo_logs (type, message) VALUES (?, ?)').run('INFO', 'Algo trading stopped by user')

  res.json({ status: 'stopped', message: 'Algo trading stopped' })
})

router.get('/status', (req, res) => {
  const db = getDb()
  const config = db.prepare('SELECT * FROM algo_config WHERE id = 1').get()
  const logs = db.prepare('SELECT * FROM algo_logs ORDER BY created_at DESC LIMIT 50').all()
  res.json({
    isRunning: !!algoInterval,
    config: config || {},
    logs,
  })
})

router.get('/logs', (req, res) => {
  const db = getDb()
  const { limit = 100 } = req.query
  const logs = db.prepare('SELECT * FROM algo_logs ORDER BY created_at DESC LIMIT ?').all(parseInt(limit))
  res.json(logs)
})

function generateSignal(strategy, symbol) {
  // Simulated signal generation - in production, this would analyze real-time data
  const random = Math.random()
  const price = 50000 + Math.random() * 10000 // Simulated price

  if (strategy === 'rsi_oversold') {
    const rsi = 20 + Math.random() * 60
    if (rsi < 30) return { type: 'SIGNAL', message: `BUY Signal - RSI: ${rsi.toFixed(1)} (Oversold)`, data: { action: 'BUY', rsi, price, symbol } }
    if (rsi > 70) return { type: 'SIGNAL', message: `SELL Signal - RSI: ${rsi.toFixed(1)} (Overbought)`, data: { action: 'SELL', rsi, price, symbol } }
    return { type: 'SCAN', message: `Scanning - RSI: ${rsi.toFixed(1)} (Neutral)`, data: { rsi, price, symbol } }
  }

  if (strategy === 'macd_crossover') {
    const macd = -2 + Math.random() * 4
    if (macd > 0.5) return { type: 'SIGNAL', message: `BUY Signal - MACD Bullish Crossover: ${macd.toFixed(2)}`, data: { action: 'BUY', macd, price, symbol } }
    if (macd < -0.5) return { type: 'SIGNAL', message: `SELL Signal - MACD Bearish Crossover: ${macd.toFixed(2)}`, data: { action: 'SELL', macd, price, symbol } }
    return { type: 'SCAN', message: `Scanning - MACD: ${macd.toFixed(2)} (No clear signal)`, data: { macd, price, symbol } }
  }

  return { type: 'SCAN', message: `Scanning ${symbol} - No actionable signal`, data: { price, symbol } }
}

export default router
