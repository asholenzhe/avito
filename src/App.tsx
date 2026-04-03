import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ThemeBootstrap } from './components/ThemeBootstrap'
import { AdEditPage } from './pages/AdEditPage'
import { AdsListPage } from './pages/AdsListPage'
import { AdViewPage } from './pages/AdViewPage'

export default function App() {
  return (
    <>
      <ThemeBootstrap />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/ads" replace />} />
          <Route path="/ads" element={<AdsListPage />} />
          <Route path="/ads/:id" element={<AdViewPage />} />
          <Route path="/ads/:id/edit" element={<AdEditPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/ads" replace />} />
      </Routes>
    </>
  )
}
