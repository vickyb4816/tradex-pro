import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Screener from './pages/Screener'
import Charts from './pages/Charts'
import Strategies from './pages/Strategies'
import PineEditor from './pages/PineEditor'
import Chatbot from './pages/Chatbot'
import PaperTrade from './pages/PaperTrade'
import News from './pages/News'
import AlgoTrade from './pages/AlgoTrade'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/screener" element={<Screener />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/pine-editor" element={<PineEditor />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/paper-trade" element={<PaperTrade />} />
        <Route path="/news" element={<News />} />
        <Route path="/algo-trade" element={<AlgoTrade />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
