// Technical Indicators Library - 22+ Advanced Technical Indicators

/**
 * 1. Simple Moving Average (SMA)
 */
export function SMA(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    result.push(sum / period)
  }
  return result
}

/**
 * 2. Exponential Moving Average (EMA)
 */
export function EMA(data, period) {
  const result = []
  const multiplier = 2 / (period + 1)
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = 0; i < period - 1; i++) result.push(null)
  result.push(ema)
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema
    result.push(ema)
  }
  return result
}

/**
 * 3. Weighted Moving Average (WMA)
 */
export function WMA(data, period) {
  const result = []
  const weightSum = (period * (period + 1)) / 2
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue }
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - period + 1 + j] * (j + 1)
    }
    result.push(sum / weightSum)
  }
  return result
}

/**
 * 4. Hull Moving Average (HMA)
 */
export function HMA(data, period) {
  const halfPeriod = Math.floor(period / 2)
  const sqrtPeriod = Math.floor(Math.sqrt(period))
  const wmaHalf = WMA(data, halfPeriod)
  const wmaFull = WMA(data, period)
  const diff = []
  for (let i = 0; i < data.length; i++) {
    if (wmaHalf[i] === null || wmaFull[i] === null) {
      diff.push(null)
    } else {
      diff.push(2 * wmaHalf[i] - wmaFull[i])
    }
  }
  const validDiff = diff.filter(v => v !== null)
  const hmaValid = WMA(validDiff, sqrtPeriod)
  const pad = data.length - hmaValid.length
  return [...Array(pad).fill(null), ...hmaValid]
}

/**
 * 5. Relative Strength Index (RSI)
 */
export function RSI(closes, period = 14) {
  const result = []
  const gains = [], losses = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? Math.abs(diff) : 0)
  }
  for (let i = 0; i < period; i++) result.push(null)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)))
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)))
  }
  return result
}

/**
 * 6. Moving Average Convergence Divergence (MACD)
 */
export function MACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEma = EMA(closes, fastPeriod)
  const slowEma = EMA(closes, slowPeriod)
  const macdLine = fastEma.map((f, i) => f !== null && slowEma[i] !== null ? f - slowEma[i] : null)
  const validMacd = macdLine.filter(v => v !== null)
  const signalLine = EMA(validMacd, signalPeriod)
  const padded = [...Array(macdLine.length - validMacd.length).fill(null)]
  const signal = [...padded, ...Array(validMacd.length - signalLine.length).fill(null), ...signalLine]
  const histogram = macdLine.map((m, i) => m !== null && signal[i] !== null ? m - signal[i] : null)
  return { macd: macdLine, signal, histogram }
}

/**
 * 7. Bollinger Bands (BB)
 */
export function BollingerBands(closes, period = 20, stdDev = 2) {
  const sma = SMA(closes, period)
  const upper = [], lower = []
  for (let i = 0; i < closes.length; i++) {
    if (sma[i] === null) { upper.push(null); lower.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += Math.pow(closes[j] - sma[i], 2)
    const std = Math.sqrt(sum / period)
    upper.push(sma[i] + stdDev * std)
    lower.push(sma[i] - stdDev * std)
  }
  return { upper, middle: sma, lower }
}

/**
 * 8. Volume Weighted Average Price (VWAP)
 */
export function VWAP(highs, lows, closes, volumes) {
  const result = []
  let cumVol = 0, cumTP = 0
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3
    cumTP += tp * (volumes[i] || 1)
    cumVol += (volumes[i] || 1)
    result.push(cumVol > 0 ? cumTP / cumVol : tp)
  }
  return result
}

/**
 * 9. Average True Range (ATR)
 */
export function ATR(highs, lows, closes, period = 14) {
  if (!closes || closes.length === 0) return []
  const tr = [highs[0] - lows[0]]
  for (let i = 1; i < closes.length; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])))
  }
  return SMA(tr, period)
}

/**
 * 10. Supertrend
 */
export function Supertrend(highs, lows, closes, period = 10, multiplier = 3) {
  const atr = ATR(highs, lows, closes, period)
  const result = []
  let supertrend = 0, upperBand = 0, lowerBand = 0, prevClose = closes[0]
  for (let i = 0; i < closes.length; i++) {
    if (atr[i] === null) { result.push({ value: null, direction: 1 }); continue }
    const hl2 = (highs[i] + lows[i]) / 2
    const newUpper = hl2 + multiplier * atr[i]
    const newLower = hl2 - multiplier * atr[i]
    upperBand = (newUpper < upperBand || prevClose > upperBand) ? newUpper : upperBand
    lowerBand = (newLower > lowerBand || prevClose < lowerBand) ? newLower : lowerBand
    if (supertrend === upperBand && closes[i] <= upperBand) supertrend = upperBand
    else if (supertrend === upperBand && closes[i] > upperBand) supertrend = lowerBand
    else if (supertrend === lowerBand && closes[i] >= lowerBand) supertrend = lowerBand
    else if (supertrend === lowerBand && closes[i] < lowerBand) supertrend = upperBand
    else supertrend = closes[i] > hl2 ? lowerBand : upperBand
    prevClose = closes[i]
    result.push({ value: supertrend, direction: supertrend === lowerBand ? 1 : -1 })
  }
  return result
}

/**
 * 11. Stochastic RSI (StochRSI)
 */
export function StochRSI(closes, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
  const rsi = RSI(closes, rsiPeriod)
  const validRsi = rsi.filter(v => v !== null)
  const k = []
  for (let i = 0; i < validRsi.length; i++) {
    if (i < stochPeriod - 1) { k.push(null); continue }
    const slice = validRsi.slice(i - stochPeriod + 1, i + 1)
    const min = Math.min(...slice), max = Math.max(...slice)
    k.push(max === min ? 50 : ((validRsi[i] - min) / (max - min)) * 100)
  }
  const kSmoothed = SMA(k.filter(v => v !== null), kPeriod)
  const dSmoothed = SMA(kSmoothed.filter(v => v !== null), dPeriod)
  return { k: kSmoothed, d: dSmoothed }
}

/**
 * 12. On-Balance Volume (OBV)
 */
export function OBV(closes, volumes) {
  const result = [volumes[0] || 0]
  for (let i = 1; i < closes.length; i++) {
    const vol = volumes[i] || 0
    if (closes[i] > closes[i - 1]) result.push(result[i - 1] + vol)
    else if (closes[i] < closes[i - 1]) result.push(result[i - 1] - vol)
    else result.push(result[i - 1])
  }
  return result
}

/**
 * 13. Average Directional Index (ADX)
 */
export function ADX(highs, lows, closes, period = 14) {
  const plusDM = [], minusDM = [], trArr = []
  for (let i = 1; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    trArr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])))
  }
  const smoothTR = EMA(trArr, period)
  const smoothPlusDM = EMA(plusDM, period)
  const smoothMinusDM = EMA(minusDM, period)
  const plusDI = smoothPlusDM.map((v, i) => v !== null && smoothTR[i] ? (v / smoothTR[i]) * 100 : null)
  const minusDI = smoothMinusDM.map((v, i) => v !== null && smoothTR[i] ? (v / smoothTR[i]) * 100 : null)
  const dx = plusDI.map((p, i) => p !== null && minusDI[i] !== null && (p + minusDI[i]) !== 0
    ? (Math.abs(p - minusDI[i]) / (p + minusDI[i])) * 100
    : null)
  const validDx = dx.filter(v => v !== null)
  const adx = EMA(validDx, period)
  return { adx, plusDI, minusDI }
}

/**
 * 14. Commodity Channel Index (CCI)
 */
export function CCI(highs, lows, closes, period = 20) {
  const result = []
  const tpArr = []
  for (let i = 0; i < closes.length; i++) {
    tpArr.push((highs[i] + lows[i] + closes[i]) / 3)
  }
  const smaTP = SMA(tpArr, period)
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || smaTP[i] === null) {
      result.push(null)
      continue
    }
    let meanDev = 0
    for (let j = i - period + 1; j <= i; j++) {
      meanDev += Math.abs(tpArr[j] - smaTP[i])
    }
    meanDev = meanDev / period
    const cci = meanDev === 0 ? 0 : (tpArr[i] - smaTP[i]) / (0.015 * meanDev)
    result.push(cci)
  }
  return result
}

/**
 * 15. Williams %R
 */
export function WilliamsR(highs, lows, closes, period = 14) {
  const result = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    const highSlice = highs.slice(i - period + 1, i + 1)
    const lowSlice = lows.slice(i - period + 1, i + 1)
    const highestHigh = Math.max(...highSlice)
    const lowestLow = Math.min(...lowSlice)
    const r = highestHigh === lowestLow ? -50 : ((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100
    result.push(r)
  }
  return result
}

/**
 * 16. Donchian Channels
 */
export function DonchianChannels(highs, lows, closes, period = 20) {
  const upper = [], middle = [], lower = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(null); middle.push(null); lower.push(null); continue
    }
    const hSlice = highs.slice(i - period + 1, i + 1)
    const lSlice = lows.slice(i - period + 1, i + 1)
    const u = Math.max(...hSlice)
    const l = Math.min(...lSlice)
    upper.push(u)
    lower.push(l)
    middle.push((u + l) / 2)
  }
  return { upper, middle, lower }
}

/**
 * 17. Keltner Channels
 */
export function KeltnerChannels(highs, lows, closes, period = 20, multiplier = 2) {
  const ema = EMA(closes, period)
  const atr = ATR(highs, lows, closes, period)
  const upper = [], lower = []
  for (let i = 0; i < closes.length; i++) {
    if (ema[i] === null || atr[i] === null) {
      upper.push(null); lower.push(null); continue
    }
    upper.push(ema[i] + multiplier * atr[i])
    lower.push(ema[i] - multiplier * atr[i])
  }
  return { upper, middle: ema, lower }
}

/**
 * 18. Parabolic SAR (PSAR)
 */
export function ParabolicSAR(highs, lows, step = 0.02, maxStep = 0.2) {
  if (highs.length < 2) return Array(highs.length).fill(null)
  const result = [lows[0]]
  let isBullish = highs[1] >= highs[0]
  let af = step
  let ep = isBullish ? highs[1] : lows[1]
  let sar = isBullish ? lows[0] : highs[0]

  for (let i = 1; i < highs.length; i++) {
    if (isBullish) {
      sar = sar + af * (ep - sar)
      if (i >= 2) sar = Math.min(sar, lows[i - 1], lows[i - 2])
      else sar = Math.min(sar, lows[i - 1])
      if (lows[i] < sar) {
        isBullish = false
        sar = ep
        af = step
        ep = lows[i]
      } else {
        if (highs[i] > ep) {
          ep = highs[i]
          af = Math.min(af + step, maxStep)
        }
      }
    } else {
      sar = sar - af * (sar - ep)
      if (i >= 2) sar = Math.max(sar, highs[i - 1], highs[i - 2])
      else sar = Math.max(sar, highs[i - 1])
      if (highs[i] > sar) {
        isBullish = true
        sar = ep
        af = step
        ep = highs[i]
      } else {
        if (lows[i] < ep) {
          ep = lows[i]
          af = Math.min(af + step, maxStep)
        }
      }
    }
    result.push(sar)
  }
  return result
}

/**
 * 19. Money Flow Index (MFI)
 */
export function MFI(highs, lows, closes, volumes, period = 14) {
  const result = []
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3)
  const rawMoneyFlow = tp.map((p, i) => p * (volumes[i] || 1))

  for (let i = 0; i < closes.length; i++) {
    if (i < period) { result.push(null); continue }
    let posFlow = 0, negFlow = 0
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posFlow += rawMoneyFlow[j]
      else if (tp[j] < tp[j - 1]) negFlow += rawMoneyFlow[j]
    }
    if (negFlow === 0) {
      result.push(100)
    } else {
      const mr = posFlow / negFlow
      result.push(100 - (100 / (1 + mr)))
    }
  }
  return result
}

/**
 * 20. Rate of Change (ROC)
 */
export function ROC(closes, period = 12) {
  const result = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { result.push(null); continue }
    const prev = closes[i - period]
    const roc = prev !== 0 ? ((closes[i] - prev) / prev) * 100 : 0
    result.push(roc)
  }
  return result
}

/**
 * 21. Ichimoku Cloud
 */
export function IchimokuCloud(highs, lows, closes, convPeriod = 9, basePeriod = 26, spanBPeriod = 52) {
  const highest = (arr, start, period) => Math.max(...arr.slice(Math.max(0, start - period + 1), start + 1))
  const lowest = (arr, start, period) => Math.min(...arr.slice(Math.max(0, start - period + 1), start + 1))
  const tenkan = [], kijun = [], senkouA = [], senkouB = [], chikou = []
  for (let i = 0; i < closes.length; i++) {
    const t = i >= convPeriod - 1 ? (highest(highs, i, convPeriod) + lowest(lows, i, convPeriod)) / 2 : null
    const k = i >= basePeriod - 1 ? (highest(highs, i, basePeriod) + lowest(lows, i, basePeriod)) / 2 : null
    tenkan.push(t); kijun.push(k)
    senkouA.push(t !== null && k !== null ? (t + k) / 2 : null)
    senkouB.push(i >= spanBPeriod - 1 ? (highest(highs, i, spanBPeriod) + lowest(lows, i, spanBPeriod)) / 2 : null)
    chikou.push(closes[i])
  }
  return { tenkan, kijun, senkouA, senkouB, chikou }
}

/**
 * 22. Standard Pivot Points
 */
export function PivotPoints(high, low, close) {
  const pp = (high + low + close) / 3
  const r1 = 2 * pp - low
  const s1 = 2 * pp - high
  const r2 = pp + (high - low)
  const s2 = pp - (high - low)
  const r3 = high + 2 * (pp - low)
  const s3 = low - 2 * (high - pp)
  return { pp, r1, s1, r2, s2, r3, s3 }
}
