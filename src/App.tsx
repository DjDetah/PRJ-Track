import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import WorkOrderList from './pages/work-orders/WorkOrderList'
import ProjectsList from './pages/projects/ProjectsList'
import { SettingsPage } from './pages/settings/SettingsPage'
import DailyPage from './pages/daily/DailyPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/work-orders" element={<WorkOrderList />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Add Work Orders Route Later */}
        </Route>
        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
