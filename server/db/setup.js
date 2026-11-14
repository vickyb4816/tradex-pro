import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_FILE = join(__dirname, '..', '..', 'tradex-data.json')

class JSONDatabase {
  constructor(filePath) {
    this.filePath = filePath
    this.data = {
      paper_trades: [],
      paper_account: [{ id: 1, balance: 100000, initial_balance: 100000 }],
      algo_config: [{ id: 1, broker: '', api_key: '', secret_key: '', strategy: '', symbol: '', is_running: 0 }],
      algo_logs: [],
      pine_scripts: [],
      watchlist: []
    }
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8')
        const parsed = JSON.parse(raw)
        this.data = { ...this.data, ...parsed }
      } else {
        this.save()
      }
    } catch (e) {
      console.warn('⚠️ Could not load database file, using defaults:', e.message)
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (e) {
      console.error('❌ Error saving database:', e.message)
    }
  }

  pragma() {
    // No-op for WAL
  }

  exec(sql) {
    // Basic setup initialization
    if (!this.data.paper_account || this.data.paper_account.length === 0) {
      this.data.paper_account = [{ id: 1, balance: 100000, initial_balance: 100000 }]
    }
    this.save()
    return this
  }

  prepare(sql) {
    const trimmed = sql.trim().replace(/\s+/g, ' ')
    const self = this

    return {
      run(...params) {
        // Handle paper_trades INSERT
        if (/^INSERT INTO paper_trades/i.test(trimmed)) {
          const [id, symbol, type, side, quantity, entry_price, strategy] = params
          const newTrade = {
            id,
            symbol,
            type,
            side,
            quantity: Number(quantity),
            entry_price: Number(entry_price),
            exit_price: null,
            pnl: 0,
            status: 'open',
            strategy: strategy || null,
            created_at: new Date().toISOString(),
            closed_at: null
          }
          self.data.paper_trades.unshift(newTrade)
          self.save()
          return { changes: 1 }
        }

        // Handle paper_trades UPDATE close
        if (/^UPDATE paper_trades SET exit_price/i.test(trimmed)) {
          const [exitPrice, pnl, status, id] = params
          const trade = self.data.paper_trades.find(t => t.id === id)
          if (trade) {
            trade.exit_price = Number(exitPrice)
            trade.pnl = Number(pnl)
            trade.status = status
            trade.closed_at = new Date().toISOString()
            self.save()
            return { changes: 1 }
          }
          return { changes: 0 }
        }

        // Handle DELETE FROM paper_trades
        if (/^DELETE FROM paper_trades/i.test(trimmed)) {
          const count = self.data.paper_trades.length
          self.data.paper_trades = []
          self.save()
          return { changes: count }
        }

        // Handle paper_account UPDATE balance minus
        if (/^UPDATE paper_account SET balance = balance -/i.test(trimmed)) {
          const [amount] = params
          if (self.data.paper_account[0]) {
            self.data.paper_account[0].balance = Math.max(0, self.data.paper_account[0].balance - Number(amount))
            self.save()
            return { changes: 1 }
          }
        }

        // Handle paper_account UPDATE balance plus
        if (/^UPDATE paper_account SET balance = balance \+/i.test(trimmed)) {
          const [amount] = params
          if (self.data.paper_account[0]) {
            self.data.paper_account[0].balance = self.data.paper_account[0].balance + Number(amount)
            self.save()
            return { changes: 1 }
          }
        }

        // Handle paper_account RESET (balance = 100000)
        if (/^UPDATE paper_account SET balance = 100000/i.test(trimmed)) {
          if (self.data.paper_account[0]) {
            self.data.paper_account[0].balance = 100000
            self.save()
            return { changes: 1 }
          }
        }

        // Handle algo_config INSERT OR REPLACE
        if (/^INSERT OR REPLACE INTO algo_config/i.test(trimmed)) {
          const [broker, api_key, secret_key, strategy, symbol] = params
          self.data.algo_config = [{
            id: 1,
            broker,
            api_key,
            secret_key,
            strategy,
            symbol,
            is_running: 1
          }]
          self.save()
          return { changes: 1 }
        }

        // Handle algo_config UPDATE is_running = 0
        if (/^UPDATE algo_config SET is_running = 0/i.test(trimmed)) {
          if (self.data.algo_config[0]) {
            self.data.algo_config[0].is_running = 0
            self.save()
            return { changes: 1 }
          }
        }

        // Handle algo_logs INSERT
        if (/^INSERT INTO algo_logs/i.test(trimmed)) {
          const [type, message, data] = params
          const logEntry = {
            id: (self.data.algo_logs.length ? Math.max(...self.data.algo_logs.map(l => l.id || 0)) + 1 : 1),
            type,
            message,
            data: data || null,
            created_at: new Date().toISOString()
          }
          self.data.algo_logs.unshift(logEntry)
          // Keep max 500 logs
          if (self.data.algo_logs.length > 500) {
            self.data.algo_logs = self.data.algo_logs.slice(0, 500)
          }
          self.save()
          return { changes: 1 }
        }

        console.warn('Unhandled SQL run:', trimmed, params)
        return { changes: 0 }
      },

      get(...params) {
        // SELECT * FROM paper_account WHERE id = 1
        if (/FROM paper_account WHERE id = 1/i.test(trimmed)) {
          return self.data.paper_account[0] || { id: 1, balance: 100000, initial_balance: 100000 }
        }

        // SELECT * FROM paper_trades WHERE id = ?
        if (/FROM paper_trades WHERE id = \?/i.test(trimmed)) {
          const [id] = params
          return self.data.paper_trades.find(t => t.id === id) || null
        }

        // SELECT * FROM algo_config WHERE id = 1
        if (/FROM algo_config WHERE id = 1/i.test(trimmed)) {
          return self.data.algo_config[0] || null
        }

        console.warn('Unhandled SQL get:', trimmed, params)
        return null
      },

      all(...params) {
        // SELECT * FROM paper_trades ORDER BY created_at DESC LIMIT 200
        if (/FROM paper_trades.*ORDER BY created_at DESC/i.test(trimmed)) {
          if (/status = 'open'/i.test(trimmed)) {
            return self.data.paper_trades.filter(t => t.status === 'open')
          }
          return self.data.paper_trades.slice(0, 200)
        }

        // SELECT * FROM algo_logs ORDER BY created_at DESC LIMIT ? / 50
        if (/FROM algo_logs.*ORDER BY created_at DESC/i.test(trimmed)) {
          const limit = params[0] || 50
          return self.data.algo_logs.slice(0, Number(limit))
        }

        console.warn('Unhandled SQL all:', trimmed, params)
        return []
      }
    }
  }
}

let db = null

export function setupDatabase() {
  if (!db) {
    db = new JSONDatabase(DB_FILE)
    console.log('✅ Lightweight Database initialized (JSON storage at', DB_FILE, ')')
  }
  return db
}

export function getDb() {
  if (!db) setupDatabase()
  return db
}
