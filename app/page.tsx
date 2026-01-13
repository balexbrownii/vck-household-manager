import ParentDashboard from './components/dashboard/parent-dashboard'
import TopNav from './components/nav/top-nav'

export default function Home() {
  return (
    <>
      <TopNav />
      <main className="parent-page">
        <div className="parent-content">
          <ParentDashboard />
        </div>
      </main>
    </>
  )
}
