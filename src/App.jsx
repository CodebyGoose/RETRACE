import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import ItemDetails from './pages/ItemDetails.jsx'
import ReportItem from './pages/ReportItem.jsx'
import Account from './pages/Account.jsx'
import Admin from './pages/Admin.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import MyClaims from './pages/MyClaims.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/items/:id" element={<ItemDetails />} />
          <Route path="/report" element={<ReportItem />} />
          <Route path="/account" element={<Account />} />
          <Route path="/account/reports" element={<Account />} />
          <Route path="/claims" element={<MyClaims />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  )
}
