import Sidebar from './Sidebar'
import Header from './Header'
import { useStore } from '../../store/useStore'

export default function Layout({ children }) {
  const { sidebarOpen } = useStore()

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
        <Header />
        <main className="p-4 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
