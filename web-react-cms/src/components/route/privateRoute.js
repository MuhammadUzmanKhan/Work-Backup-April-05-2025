import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { currentAuthenticatedUser } from 'store/actions/user';
import { roleBasedRoutes } from 'utils/staticValues'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { getPermissions } from 'store/actions/permissions'
import { setStateValue } from 'store/reducers/permissions'

export const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch()
  const [allow, setAllow] = useState(true)
  const location = useLocation()

  const { permissions } = useSelector((state) => state.permissions)

  const [user, setUser] = useState()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const auth = async () => {
      const permissions = await dispatch(getPermissions())
      if (typeof permissions.payload === 'string') {
        dispatch(setStateValue({ type: 'permissions', data: [] }))
      } else {
        dispatch(setStateValue({ type: 'permissions', data: permissions.payload }))
      }
      const user = await currentAuthenticatedUser()
      setUser(user)
      setLoading(false)
    }
    auth()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  
    if (permissions?.length) {
      let flag = false
      roleBasedRoutes.forEach((r) => {
        const _key = Object.keys(r)[0]

        if (r[_key]?.reg?.test(location.pathname)) {
          document.title = (r[_key]?.title && `${r[_key]?.title} | `) + 'Daleel'
          const all = r[_key]?.permission?.map((p) => p.split(':')[0] + ':all')

          const notAllow = !permissions?.find(
            (per) =>
              all.find((p) => p === per) ||
              r[_key]?.permission?.find((p) => p === per) ||
              per === 'admin:all'
          )
          setAllow(!notAllow)
          flag = true
        }
      })
      if (!flag) {
        setAllow(true)
      }
    }
    if (location.pathname === '/dashboard') {
      document.title = `Dashboard | Daleel`
    } else if (location.pathname === '/settings' || location.pathname === '/activity') {
      document.title = `Daleel`
    }
  }, [location, permissions])
  return loading ? (
    <span>Loading...</span>
  ) : user && user !== null ? (
    allow ? (
      children
    ) : (
      <Navigate to="/dashboard" state={{ from: location }} replace />
    )
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  )
}

