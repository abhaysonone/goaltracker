import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useDataStore } from './store/dataStore'
import { LoginPage } from './pages/LoginPage'
import { AppLayout } from './components/layout/AppLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminGoals } from './pages/admin/AdminGoals'
import { AdminAssignments } from './pages/admin/AdminAssignments'
import { AdminEmployees } from './pages/admin/AdminEmployees'
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard'
import { EmployeeGoals } from './pages/employee/EmployeeGoals'
import { EmployeeHistory } from './pages/employee/EmployeeHistory'

function useCurrentUser() {
  const currentUserId = useAuthStore((s) => s.currentUserId)
  return useDataStore((s) => s.users.find((u) => u.id === currentUserId))
}

function RequireRole({ role, children }: { role: 'admin' | 'employee'; children: ReactElement }) {
  const user = useCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
  }
  return children
}

export default function App() {
  const initialized = useAuthStore((s) => s.initialized)
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const loaded = useDataStore((s) => s.loaded)
  const fetchAll = useDataStore((s) => s.fetchAll)
  const reset = useDataStore((s) => s.reset)
  const user = useCurrentUser()

  useEffect(() => {
    if (!initialized) return
    if (currentUserId) {
      fetchAll().catch((err: unknown) => console.error('Failed to load data', err))
    } else {
      reset()
    }
  }, [initialized, currentUserId, fetchAll, reset])

  if (!initialized || (currentUserId && !loaded)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-text-secondary">
        Loading…
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AppLayout role="admin" />
          </RequireRole>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="goals" element={<AdminGoals />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="employees" element={<AdminEmployees />} />
      </Route>

      <Route
        path="/employee"
        element={
          <RequireRole role="employee">
            <AppLayout role="employee" />
          </RequireRole>
        }
      >
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="goals" element={<EmployeeGoals />} />
        <Route path="history" element={<EmployeeHistory />} />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard') : '/login'}
            replace
          />
        }
      />
    </Routes>
  )
}
