import ParentDashboard from './components/dashboard/parent-dashboard'
import TopNav from './components/nav/top-nav'

export default function Home() {
  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ParentDashboard />
        </div>
      </main>
    </>
  )
}
