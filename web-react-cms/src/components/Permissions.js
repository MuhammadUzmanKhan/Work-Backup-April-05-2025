import React from 'react'
import { useSelector } from 'react-redux'

export const Permissions = ({ children, permission }) => {
  const { permissions } = useSelector((state) => state.permissions)
  const [all] = React.useState(permission.split(':')[0] + ':all')
  return permissions?.find((per) => per === all || per === permission || per === 'admin:all')
    ? children
    : null
}
