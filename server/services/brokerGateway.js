import axios from 'axios'
import crypto from 'crypto'

/**
 * TradeX Pro - Unified Broker API Gateway
 * Performs real, live authenticated handshake against official broker endpoints.
 * Never returns 'connected' if credentials are fake, expired, or rejected by the exchange.
 */
export async function verifyBrokerConnection({ broker, apiKey = '', secretKey = '', appId = '', accessToken = '', environment = 'global' }) {
  const normBroker = (broker || '').toLowerCase().trim()

  // 1. BINANCE (Spot & Futures)
  if (normBroker.includes('binance')) {
    if (!apiKey.trim() || !secretKey.trim()) {
      throw new Error('Binance requires both API Key and Secret Key.')
    }

    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}&recvWindow=5000`
    const signature = crypto
      .createHmac('sha256', secretKey.trim())
      .update(queryString)
      .digest('hex')

    const endpoint = environment === 'futures'
      ? 'https://fapi.binance.com/fapi/v2/account'
      : 'https://api.binance.com/api/v3/account'

    const startTime = Date.now()
    try {
      const response = await axios.get(`${endpoint}?${queryString}&signature=${signature}`, {
        headers: {
          'X-MBX-APIKEY': apiKey.trim(),
        },
        timeout: 6000,
      })

      const latency = `${Date.now() - startTime}ms`
      const data = response.data

      return {
        success: true,
        broker: 'Binance',
        status: 'connected',
        latency,
        accountType: data.accountType || (environment === 'futures' ? 'USDT-M Futures' : 'Spot & Margin'),
        canTrade: Boolean(data.canTrade || data.canTradeCustom),
        permissions: data.permissions || ['SPOT', 'FUTURES_READ', 'MARKET_DATA'],
        message: `Connected to Binance (${data.accountType || 'Spot'}) successfully! Verified with Binance servers.`,
      }
    } catch (err) {
      const status = err.response?.status
      const binanceError = err.response?.data
      if (binanceError && binanceError.msg) {
        throw new Error(`Binance API Rejected (${binanceError.code || status}): ${binanceError.msg}`)
      }
      if (status === 401) {
        throw new Error('Binance 401 Unauthorized: Invalid API-Key or Secret Key.')
      }
      throw new Error(err.message || 'Failed to reach Binance API servers.')
    }
  }

  // 2. FYERS (Fyers API v3 - Indian Stock Market)
  if (normBroker.includes('fyers')) {
    const fyersAppId = (appId || apiKey).trim()
    const fyersToken = (accessToken || secretKey).trim()

    if (!fyersAppId || !fyersToken) {
      throw new Error('Fyers requires App ID (e.g. XC12345-100) and Access Token.')
    }

    const startTime = Date.now()
    try {
      const response = await axios.get('https://api-t1.fyers.in/api/v3/profile', {
        headers: {
          Authorization: `${fyersAppId}:${fyersToken}`,
        },
        timeout: 6000,
      })

      const latency = `${Date.now() - startTime}ms`
      const resData = response.data

      if (resData.s !== 'ok' && resData.code !== 200) {
        throw new Error(`Fyers API Error (${resData.code}): ${resData.message || 'Authentication rejected'}`)
      }

      const userProfile = resData.data || {}
      return {
        success: true,
        broker: 'Fyers',
        status: 'connected',
        latency,
        accountType: 'Equity & Derivatives (NSE / BSE)',
        clientId: userProfile.fy_id || fyersAppId,
        clientName: userProfile.name || 'Verified Fyers User',
        permissions: ['Equity Cash', 'Equity F&O', 'Currency F&O', 'Commodity'],
        message: `Connected to Fyers successfully! Client: ${userProfile.name || userProfile.fy_id || fyersAppId}`,
      }
    } catch (err) {
      const fyersErr = err.response?.data
      if (fyersErr && fyersErr.message) {
        throw new Error(`Fyers API Rejected (${fyersErr.code || err.response?.status}): ${fyersErr.message}`)
      }
      if (err.response?.status === 400 || err.response?.status === 401) {
        throw new Error('Fyers Authentication Failed: Invalid App ID or Expired Access Token.')
      }
      throw new Error(err.message || 'Failed to reach Fyers API servers.')
    }
  }

  // 3. COINDCX (CoinDCX Indian Crypto Exchange)
  if (normBroker.includes('coindcx')) {
    if (!apiKey.trim() || !secretKey.trim()) {
      throw new Error('CoinDCX requires API Key and Secret Key.')
    }

    const timestamp = Date.now()
    const bodyStr = JSON.stringify({ timestamp })
    const signature = crypto
      .createHmac('sha256', secretKey.trim())
      .update(bodyStr)
      .digest('hex')

    const startTime = Date.now()
    try {
      const response = await axios.post('https://api.coindcx.com/exchange/v1/users/info', bodyStr, {
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-APIKEY': apiKey.trim(),
          'X-AUTH-SIGNATURE': signature,
        },
        timeout: 6000,
      })

      const latency = `${Date.now() - startTime}ms`
      const data = response.data

      return {
        success: true,
        broker: 'CoinDCX',
        status: 'connected',
        latency,
        accountType: 'CoinDCX Spot & Futures',
        clientId: data.coindcx_id || data.mobile_number || 'CoinDCX Trader',
        permissions: ['Spot Trading', 'INR Deposit/Withdrawal', 'Market Data'],
        message: `Connected to CoinDCX successfully! User ID: ${data.coindcx_id || 'Active'}`,
      }
    } catch (err) {
      const cdcxErr = err.response?.data
      if (cdcxErr && cdcxErr.message) {
        throw new Error(`CoinDCX API Rejected (${cdcxErr.code || err.response?.status}): ${cdcxErr.message}`)
      }
      if (err.response?.status === 401) {
        throw new Error('CoinDCX Authentication Failed: Invalid credentials or signature.')
      }
      throw new Error(err.message || 'Failed to reach CoinDCX API servers.')
    }
  }

  // 4. DELTA EXCHANGE (Delta Exchange India / Global)
  if (normBroker.includes('delta')) {
    if (!apiKey.trim() || !secretKey.trim()) {
      throw new Error('Delta Exchange requires API Key and Secret Key.')
    }

    const isIndia = environment === 'india' || normBroker.includes('india')
    const baseUrl = isIndia ? 'https://cdn.india.delta.exchange' : 'https://api.delta.exchange'
    const path = '/v2/wallet/balances'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signaturePayload = `GET${timestamp}${path}`
    const signature = crypto
      .createHmac('sha256', secretKey.trim())
      .update(signaturePayload)
      .digest('hex')

    const startTime = Date.now()
    try {
      const response = await axios.get(`${baseUrl}${path}`, {
        headers: {
          'api-key': apiKey.trim(),
          timestamp,
          signature,
          'User-Agent': 'TradeX-Pro/1.0',
        },
        timeout: 6000,
      })

      const latency = `${Date.now() - startTime}ms`
      const data = response.data

      if (data.success === false || data.error) {
        throw new Error(`Delta Exchange Rejected: ${data.error?.code || data.error?.message || 'Authentication failed'}`)
      }

      return {
        success: true,
        broker: isIndia ? 'Delta Exchange India' : 'Delta Exchange',
        status: 'connected',
        latency,
        accountType: isIndia ? 'Delta Exchange India (F&O / Crypto)' : 'Delta Exchange Global (Derivatives)',
        permissions: ['Futures & Options', 'Perpetuals', 'Wallet Balances'],
        message: `Connected to Delta Exchange successfully! Real-time wallet balances verified.`,
      }
    } catch (err) {
      const deltaErr = err.response?.data
      if (deltaErr && deltaErr.error) {
        const msg = typeof deltaErr.error === 'object' ? (deltaErr.error.message || deltaErr.error.code) : deltaErr.error
        throw new Error(`Delta Exchange API Rejected: ${msg}`)
      }
      if (err.response?.status === 401) {
        throw new Error('Delta Exchange 401 Unauthorized: Invalid API Key or Signature.')
      }
      throw new Error(err.message || 'Failed to reach Delta Exchange API servers.')
    }
  }

  throw new Error(`Unsupported broker provider: ${broker}. Supported brokers: Binance, Fyers, CoinDCX, Delta Exchange.`)
}
