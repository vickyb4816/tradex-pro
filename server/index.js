import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import { setupDatabase, getDb } from './db/setup.js'
import marketRoutes from './routes/market.js'
import screenerRoutes from './routes/screener.js'
import newsRoutes from './routes/news.js'
import paperTradeRoutes from './routes/paperTrade.js'
import chatbotRoutes from './routes/chatbot.js'
import algoTradeRoutes from './routes/algoTrade.js'
import backtestRoutes from './routes/backtest.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files in production
const distPath = join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// Setup database
setupDatabase()

// API Routes
app.use('/api/indian', marketRoutes)
app.use('/api/screener', screenerRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/paper-trade', paperTradeRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/algo', algoTradeRoutes)
app.use('/api/backtest', backtestRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

// WebSocket server for live data
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket')

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      if (data.type === 'subscribe') {
        ws.subscribedSymbols = data.symbols || []
      }
    } catch (e) {}
  })

  ws.on('close', () => console.log('Client disconnected'))
})

// Broadcast price updates to all clients
export function broadcastPrice(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data))
    }
  })
}

server.listen(PORT, () => {
  console.log(`\n🚀 TradeX Pro Server running on http://localhost:${PORT}`)
  console.log(`📊 WebSocket available at ws://localhost:${PORT}/ws`)
  console.log(`⏰ Started at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`)
})
