import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { currentAuthenticatedUser } from 'store/actions/user';
// import { useDispatch } from 'react-redux'
// import { setLanguage } from 'store/app/appSlice'

export const PublicRoute = ({ children }) => {
  // const dispatch = useDispatch()
  const location = useLocation()
  const [user, setUser] = useState()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = async () => {
      const user = await currentAuthenticatedUser()
      setUser(user)
      setLoading(false)
    }
    auth()
  }, [])

  useEffect(() => {
    // dispatch(setLanguage('en'))
    if (location.pathname === '/login') {
      document.title = `Login | Daleel`
    }
    window.scrollTo(0, 0)
  }, [location])

  return loading ? (
    <span>Loading...</span>
  ) : user && user !== null ? (
    <Navigate to="/" state={{ from: location }} replace />
  ) : (
    children
  )
}

