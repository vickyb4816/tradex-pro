export const formatCurrency = (value, currency = 'INR') => {
  if (value === null || value === undefined) return '—'
  if (currency === 'INR') {
    return '₹' + Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: Number(value) < 10 ? 2 : 2,
      maximumFractionDigits: Number(value) < 10 ? 4 : 2,
    })
  }
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: Number(value) < 1 ? 4 : 2,
    maximumFractionDigits: Number(value) < 1 ? 6 : 2,
  })
}

export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(decimals) + 'B'
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
  return num.toFixed(decimals)
}

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '—'
  const sign = Number(value) >= 0 ? '+' : ''
  return sign + Number(value).toFixed(2) + '%'
}

export const getChangeColor = (value) => {
  const num = Number(value)
  if (num > 0) return 'text-emerald-400'
  if (num < 0) return 'text-red-400'
  return 'text-gray-400'
}

export const getChangeBg = (value) => {
  const num = Number(value)
  if (num > 0) return 'bg-emerald-500/10 border-emerald-500/20'
  if (num < 0) return 'bg-red-500/10 border-red-500/20'
  return 'bg-gray-500/10 border-gray-500/20'
}

export const timeframes = [
  { value: '1m', label: '1m' }, { value: '3m', label: '3m' }, { value: '5m', label: '5m' },
  { value: '15m', label: '15m' }, { value: '30m', label: '30m' }, { value: '1h', label: '1H' },
  { value: '2h', label: '2H' }, { value: '4h', label: '4H' }, { value: '6h', label: '6H' },
  { value: '8h', label: '8H' }, { value: '12h', label: '12H' }, { value: '1d', label: '1D' },
  { value: '3d', label: '3D' }, { value: '1w', label: '1W' }, { value: '1M', label: '1M' },
]

export const timezones = [
  { value: 'Asia/Kolkata', label: 'IST (India - UTC+5:30)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'EST (New York)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore)' },
  { value: 'Asia/Dubai', label: 'GST (Dubai)' },
]

// Accurate Indian Stock Market Hours (IST) check
export const isMarketOpen = () => {
  const now = new Date()
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  const ist = new Date(istString)
  const day = ist.getDay() // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false
  const hours = ist.getHours()
  const minutes = ist.getMinutes()
  const time = hours * 60 + minutes
  // 9:15 AM (555) to 3:30 PM (930)
  return time >= 555 && time <= 930
}

export const getMarketSessionInfo = () => {
  const now = new Date()
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  const ist = new Date(istString)
  const day = ist.getDay()
  const hours = ist.getHours()
  const minutes = ist.getMinutes()
  const totalMinutes = hours * 60 + minutes

  const isWeekday = day >= 1 && day <= 5
  const isOpen = isWeekday && totalMinutes >= 555 && totalMinutes <= 930

  let statusText = 'Market Closed'
  let nextSession = ''

  if (day === 0 || day === 6) {
    statusText = 'Market Closed (Weekend)'
    nextSession = 'Opens Monday at 09:15 AM IST'
  } else if (totalMinutes < 555) {
    const until = 555 - totalMinutes
    const h = Math.floor(until / 60)
    const m = until % 60
    statusText = 'Pre-Market (Closed)'
    nextSession = `Opens in ${h > 0 ? `${h}h ` : ''}${m}m (09:15 AM IST)`
  } else if (isOpen) {
    const left = 930 - totalMinutes
    const h = Math.floor(left / 60)
    const m = left % 60
    statusText = 'Market Open (Live)'
    nextSession = `Closes in ${h > 0 ? `${h}h ` : ''}${m}m (03:30 PM IST)`
  } else {
    statusText = 'Market Closed (After Hours)'
    nextSession = day === 5 ? 'Opens Monday at 09:15 AM IST' : 'Opens tomorrow at 09:15 AM IST'
  }

  return {
    isOpen,
    statusText,
    nextSession,
    istTime: ist.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    istDate: ist.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

// Popular Binance USDT-M Perpetual Futures symbols
export const cryptoSymbols = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', '1000PEPEUSDT',
  'SUIUSDT', 'NEARUSDT', 'AVAXUSDT', 'LINKUSDT', 'ADAUSDT', 'APTUSDT', 'ARBUSDT',
  'OPUSDT', 'TAOUSDT', 'WIFUSDT', 'FETUSDT', 'RENDERUSDT', 'ENAUSDT', 'INJUSDT',
  'SEIUSDT', 'TIAUSDT', 'STXUSDT', 'AAVEUSDT', 'MKRUSDT', 'DOTUSDT', 'MATICUSDT',
  'LTCUSDT', 'UNIUSDT', 'FILUSDT', 'SHIBUSDT', 'TRXUSDT', 'ETCUSDT', 'ICPUSDT',
  'XLMUSDT', 'ALGOUSDT', 'VETUSDT', 'FTMUSDT', 'SANDUSDT', 'MANAUSDT', 'GALAUSDT',
  'CRVUSDT', 'DYDXUSDT', 'PENDLEUSDT', 'JUPUSDT', 'ONDOUSDT', 'NOTUSDT', 'TONUSDT'
]

// Comprehensive NSE Stocks catalog across sectors
export const indianStocks = [
  // Banking & Financials
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Ltd', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking', marketCap: 'Large Cap' },
  { symbol: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking', marketCap: 'Mid Cap' },
  { symbol: 'FEDERALBNK.NS', name: 'Federal Bank Ltd', sector: 'Banking', marketCap: 'Mid Cap' },
  { symbol: 'IDFCFIRSTB.NS', name: 'IDFC First Bank', sector: 'Banking', marketCap: 'Mid Cap' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', sector: 'Financials', marketCap: 'Large Cap' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Ltd', sector: 'Financials', marketCap: 'Large Cap' },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance Ltd', sector: 'Financials', marketCap: 'Large Cap' },
  { symbol: 'CHOLAFIN.NS', name: 'Cholamandalam Inv', sector: 'Financials', marketCap: 'Large Cap' },
  { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance Ltd', sector: 'Financials', marketCap: 'Mid Cap' },
  { symbol: 'JIOFIN.NS', name: 'Jio Financial Services', sector: 'Financials', marketCap: 'Large Cap' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance', sector: 'Insurance', marketCap: 'Large Cap' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance', sector: 'Insurance', marketCap: 'Large Cap' },

  // Information Technology (IT)
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', marketCap: 'Large Cap' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT', marketCap: 'Large Cap' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT', marketCap: 'Large Cap' },
  { symbol: 'WIPRO.NS', name: 'Wipro Ltd', sector: 'IT', marketCap: 'Large Cap' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd', sector: 'IT', marketCap: 'Large Cap' },
  { symbol: 'LTIM.NS', name: 'LTIMindtree Ltd', sector: 'IT', marketCap: 'Large Cap' },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems Ltd', sector: 'IT', marketCap: 'Mid Cap' },
  { symbol: 'COFORGE.NS', name: 'Coforge Ltd', sector: 'IT', marketCap: 'Mid Cap' },
  { symbol: 'MPHASIS.NS', name: 'Mphasis Ltd', sector: 'IT', marketCap: 'Mid Cap' },
  { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi Ltd', sector: 'IT', marketCap: 'Mid Cap' },

  // Energy, Oil & Gas
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy', marketCap: 'Large Cap' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', sector: 'Energy', marketCap: 'Large Cap' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corp', sector: 'Energy', marketCap: 'Large Cap' },
  { symbol: 'IOC.NS', name: 'Indian Oil Corporation', sector: 'Energy', marketCap: 'Large Cap' },
  { symbol: 'GAIL.NS', name: 'GAIL (India) Ltd', sector: 'Energy', marketCap: 'Large Cap' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Ltd', sector: 'Energy', marketCap: 'Large Cap' },

  // Power & Infrastructure
  { symbol: 'NTPC.NS', name: 'NTPC Ltd', sector: 'Power', marketCap: 'Large Cap' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corp of India', sector: 'Power', marketCap: 'Large Cap' },
  { symbol: 'TATAPOWER.NS', name: 'Tata Power Company Ltd', sector: 'Power', marketCap: 'Large Cap' },
  { symbol: 'ADANIPOWER.NS', name: 'Adani Power Ltd', sector: 'Power', marketCap: 'Large Cap' },
  { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy Ltd', sector: 'Power', marketCap: 'Large Cap' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', marketCap: 'Large Cap' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Ltd', sector: 'Infrastructure', marketCap: 'Large Cap' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports & SEZ Ltd', sector: 'Infrastructure', marketCap: 'Large Cap' },
  { symbol: 'SIEMENS.NS', name: 'Siemens Ltd', sector: 'Capital Goods', marketCap: 'Large Cap' },
  { symbol: 'ABB.NS', name: 'ABB India Ltd', sector: 'Capital Goods', marketCap: 'Large Cap' },
  { symbol: 'BHEL.NS', name: 'Bharat Heavy Electricals', sector: 'Capital Goods', marketCap: 'Mid Cap' },

  // Automobiles
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Ltd', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Ltd', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'TVSMOTOR.NS', name: 'TVS Motor Company Ltd', sector: 'Automobile', marketCap: 'Large Cap' },
  { symbol: 'ASHOKLEY.NS', name: 'Ashok Leyland Ltd', sector: 'Automobile', marketCap: 'Mid Cap' },

  // FMCG & Consumer Goods
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Ltd', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Ltd', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'DABUR.NS', name: 'Dabur India Ltd', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'MARICO.NS', name: 'Marico Ltd', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'GODREJCP.NS', name: 'Godrej Consumer Products', sector: 'FMCG', marketCap: 'Large Cap' },
  { symbol: 'TITAN.NS', name: 'Titan Company Ltd', sector: 'Consumer', marketCap: 'Large Cap' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Consumer', marketCap: 'Large Cap' },
  { symbol: 'BERGEPAINT.NS', name: 'Berger Paints India Ltd', sector: 'Consumer', marketCap: 'Large Cap' },
  { symbol: 'TRENT.NS', name: 'Trent Ltd', sector: 'Retail', marketCap: 'Large Cap' },
  { symbol: 'ZOMATO.NS', name: 'Zomato Ltd', sector: 'Consumer Tech', marketCap: 'Large Cap' },

  // Healthcare & Pharmaceuticals
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Ltd', sector: 'Pharma', marketCap: 'Large Cap' },
  { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Laboratories", sector: 'Pharma', marketCap: 'Large Cap' },
  { symbol: 'CIPLA.NS', name: 'Cipla Ltd', sector: 'Pharma', marketCap: 'Large Cap' },
  { symbol: 'DIVISLAB.NS', name: "Divi's Laboratories Ltd", sector: 'Pharma', marketCap: 'Large Cap' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Ent', sector: 'Healthcare', marketCap: 'Large Cap' },
  { symbol: 'LUPIN.NS', name: 'Lupin Ltd', sector: 'Pharma', marketCap: 'Mid Cap' },
  { symbol: 'AUROPHARMA.NS', name: 'Aurobindo Pharma Ltd', sector: 'Pharma', marketCap: 'Large Cap' },
  { symbol: 'BIOCON.NS', name: 'Biocon Ltd', sector: 'Pharma', marketCap: 'Mid Cap' },

  // Metals & Mining
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Ltd', sector: 'Metals', marketCap: 'Large Cap' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Ltd', sector: 'Metals', marketCap: 'Large Cap' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Ltd', sector: 'Metals', marketCap: 'Large Cap' },
  { symbol: 'VEDL.NS', name: 'Vedanta Ltd', sector: 'Metals', marketCap: 'Large Cap' },
  { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel & Power', sector: 'Metals', marketCap: 'Large Cap' },
  { symbol: 'NMDC.NS', name: 'NMDC Ltd', sector: 'Metals', marketCap: 'Mid Cap' },

  // Cement & Materials
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd', sector: 'Cement', marketCap: 'Large Cap' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries Ltd', sector: 'Cement', marketCap: 'Large Cap' },
  { symbol: 'AMBUJACEM.NS', name: 'Ambuja Cements Ltd', sector: 'Cement', marketCap: 'Large Cap' },
  { symbol: 'SHREECEM.NS', name: 'Shree Cement Ltd', sector: 'Cement', marketCap: 'Large Cap' },

  // Telecom & Defense
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom', marketCap: 'Large Cap' },
  { symbol: 'BEL.NS', name: 'Bharat Electronics Ltd', sector: 'Defense', marketCap: 'Large Cap' },
  { symbol: 'HAL.NS', name: 'Hindustan Aeronautics Ltd', sector: 'Defense', marketCap: 'Large Cap' },
  { symbol: 'POLYCAB.NS', name: 'Polycab India Ltd', sector: 'Electricals', marketCap: 'Large Cap' },
  { symbol: 'HAVELLS.NS', name: 'Havells India Ltd', sector: 'Electricals', marketCap: 'Large Cap' },
  { symbol: 'DIXON.NS', name: 'Dixon Technologies Ltd', sector: 'Electronics', marketCap: 'Large Cap' },
  { symbol: 'BSE.NS', name: 'BSE Ltd', sector: 'Exchange', marketCap: 'Mid Cap' },
  { symbol: 'MCX.NS', name: 'Multi Commodity Exchange', sector: 'Exchange', marketCap: 'Mid Cap' },
  { symbol: 'CDSL.NS', name: 'Central Depository Services', sector: 'Exchange', marketCap: 'Mid Cap' },
  { symbol: 'IRCTC.NS', name: 'IRCTC Ltd', sector: 'Travel & Tourism', marketCap: 'Mid Cap' },
]

export const generateId = () => Math.random().toString(36).substr(2, 9)
