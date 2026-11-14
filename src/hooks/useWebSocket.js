import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore } from '../store/useStore'

export function useWebSocket(symbols = []) {
  const wsRef = useRef(null)
  const { updatePrice } = useStore()
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (symbols.length === 0) return

    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`)

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.s) {
          updatePrice(data.s, {
            symbol: data.s,
            price: parseFloat(data.c),
            change: parseFloat(data.P),
            volume: parseFloat(data.q),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            lastUpdate: Date.now(),
          })
        }
      } catch (e) {}
    }

    ws.onclose = () => {
      setConnected(false)
      setTimeout(connect, 5000)
    }

    ws.onerror = () => ws.close()
    wsRef.current = ws
  }, [symbols.join(','), updatePrice])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return { connected }
}

export function useBinanceKline(symbol, interval, onUpdate) {
  const wsRef = useRef(null)

  useEffect(() => {
    if (!symbol) return

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.k) {
          onUpdate({
            time: Math.floor(data.k.t / 1000),
            open: parseFloat(data.k.o),
            high: parseFloat(data.k.h),
            low: parseFloat(data.k.l),
            close: parseFloat(data.k.c),
            volume: parseFloat(data.k.v),
          })
        }
      } catch (e) {}
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [symbol, interval])

  return wsRef
}
