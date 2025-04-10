import { Route, BrowserRouter, Routes, Navigate } from 'react-router'
import { Login } from './pages/Login'
import { Topics } from './pages/Topics'
import { Transfer } from './pages/Transfer'
import { doLogout, Profile } from './services/Web3Service'

export function Router() {
  function PrivateRoute({ children }: { children: React.ReactNode }) {
    const isAuth = localStorage.getItem('account')
    return isAuth ? children : <Navigate to="/" />
  }

  function ManagerRoute({ children }: { children: React.ReactNode }) {
    const isAuth = localStorage.getItem('account') !== null
    const isManager =
      parseInt(localStorage.getItem('profile') || '0') === Profile.MANAGER

    if (isAuth && isManager) {
      return children
    } else {
      doLogout()
      return <Navigate to="/" />
    }
  }

  function CouncilRoute({ children }: { children: React.ReactNode }) {
    const isAuth = localStorage.getItem('account') !== null
    const isResident =
      parseInt(localStorage.getItem('profile') || '0') === Profile.RESIDENT

    if (isAuth && !isResident) {
      return children
    } else {
      doLogout()
      return <Navigate to="/" />
    }
  }

  function ResidentRoute({ children }: { children: React.ReactNode }) {
    const isAuth = localStorage.getItem('account') !== null
    const isResident =
      parseInt(localStorage.getItem('profile') || '0') === Profile.RESIDENT

    if (isAuth && isResident) {
      return children
    } else {
      doLogout()
      return <Navigate to="/" />
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/topics"
          element={
            <PrivateRoute>
              <Topics />
            </PrivateRoute>
          }
        />
        <Route
          path="/transfer"
          element={
            <ManagerRoute>
              <Transfer />
            </ManagerRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
