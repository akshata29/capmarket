import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DashboardPage from '@/pages/DashboardPage'
import MeetingPage from '@/pages/MeetingPage'
import ClientsPage from '@/pages/ClientsPage'
import ClientProfilePage from '@/pages/ClientProfilePage'
import PortfolioPage from '@/pages/PortfolioPage'
import AdvisoryPage from '@/pages/AdvisoryPage'
import ClientAssistantPage from '@/pages/ClientAssistantPage'
import AuditPage from '@/pages/AuditPage'
import BacktestPage from '@/pages/BacktestPage'
import RebalancePage from '@/pages/RebalancePage'
import PortfolioWatchPage from '@/pages/PortfolioWatchPage'
import IntelFeedPage from '@/pages/IntelFeedPage'
import MarketRegimePage from '@/pages/MarketRegimePage'
import WorkflowPage from '@/pages/WorkflowPage'
import ArchitecturePage from '@/pages/ArchitecturePage'
import SettingsPage from '@/pages/SettingsPage'
import DemoPage from '@/pages/DemoPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="meetings" element={<MeetingPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<ClientProfilePage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="advisory" element={<AdvisoryPage />} />
        <Route path="assistant" element={<ClientAssistantPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="backtest" element={<BacktestPage />} />
        <Route path="rebalance" element={<RebalancePage />} />
        <Route path="watch" element={<PortfolioWatchPage />} />
        <Route path="intel-feed" element={<IntelFeedPage />} />
        <Route path="market-regime" element={<MarketRegimePage />} />
        <Route path="workflow" element={<WorkflowPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
