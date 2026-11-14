import { Router } from 'express'
import { getDb } from '../db/setup.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/history', (req, res) => {
  const db = getDb()
  const trades = db.prepare('SELECT * FROM paper_trades ORDER BY created_at DESC LIMIT 200').all()
  const account = db.prepare('SELECT * FROM paper_account WHERE id = 1').get()
  res.json({ trades, balance: account.balance, initialBalance: account.initial_balance })
})

router.get('/positions', (req, res) => {
  const db = getDb()
  const positions = db.prepare("SELECT * FROM paper_trades WHERE status = 'open' ORDER BY created_at DESC").all()
  res.json(positions)
})

router.post('/', (req, res) => {
  const db = getDb()
  const { symbol, type, side, quantity, price, strategy } = req.body
  const id = randomUUID()
  const account = db.prepare('SELECT * FROM paper_account WHERE id = 1').get()
  const cost = quantity * price

  if (side === 'buy' && cost > account.balance) {
    return res.status(400).json({ error: 'Insufficient balance' })
  }

  db.prepare('INSERT INTO paper_trades (id, symbol, type, side, quantity, entry_price, strategy) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, symbol, type, side, quantity, price, strategy || null)

  if (side === 'buy') {
    db.prepare('UPDATE paper_account SET balance = balance - ? WHERE id = 1').run(cost)
  }

  const updatedAccount = db.prepare('SELECT * FROM paper_account WHERE id = 1').get()
  res.json({ id, balance: updatedAccount.balance })
})

router.post('/close/:id', (req, res) => {
  const db = getDb()
  const { exitPrice } = req.body
  const trade = db.prepare('SELECT * FROM paper_trades WHERE id = ?').get(req.params.id)
  if (!trade) return res.status(404).json({ error: 'Trade not found' })
  if (trade.status === 'closed') return res.status(400).json({ error: 'Trade already closed' })

  const pnl = trade.side === 'buy'
    ? (exitPrice - trade.entry_price) * trade.quantity
    : (trade.entry_price - exitPrice) * trade.quantity

  db.prepare('UPDATE paper_trades SET exit_price = ?, pnl = ?, status = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(exitPrice, pnl, 'closed', req.params.id)

  const returnAmount = trade.quantity * exitPrice
  db.prepare('UPDATE paper_account SET balance = balance + ? WHERE id = 1').run(trade.side === 'buy' ? returnAmount : trade.quantity * trade.entry_price + pnl)

  const account = db.prepare('SELECT * FROM paper_account WHERE id = 1').get()
  res.json({ pnl, balance: account.balance })
})

router.post('/reset', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM paper_trades').run()
  db.prepare('UPDATE paper_account SET balance = 100000 WHERE id = 1').run()
  res.json({ balance: 100000, message: 'Paper trading account reset successfully' })
})

export default router
