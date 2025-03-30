import { Route, BrowserRouter, Routes, Navigate } from 'react-router'
import { Login } from './pages/Login'
import { Topics } from './pages/Topics'

export function Router() {
  function PrivateRoute({ children }: { children: React.ReactNode }) {
    const isAuth = localStorage.getItem('account')
    return isAuth ? children : <Navigate to="/" />
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
      </Routes>
    </BrowserRouter>
  )
}
