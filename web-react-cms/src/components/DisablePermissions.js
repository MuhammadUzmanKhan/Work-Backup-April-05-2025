import React from 'react'
import { useSelector } from 'react-redux'
import { failureToast } from 'utils'

export const DisablePermissions = ({ children, permission, disable }) => {
  const { permissions } = useSelector((state) => state.permissions)
  const [all] = React.useState(permission.split(':')[0] + ':all')
  // const [write] = React.useState(permission.split(':')[0] === 'write')
  const shouldDisable = !permissions?.find(
    (per) => per === all || per === permission || per === 'admin:all'
  )
  // const isPublish =
  //   write &&
  //   shouldDisable &&
  //   permissions?.find(
  //     (per) => per === 'publish:all' || per === `publish:${permission.split(':')[1]}`
  //   )
  return shouldDisable && disable ? (
    <div onClick={() => shouldDisable && failureToast('You do not have permissions.')}>
      <div style={{ pointerEvents: 'none', opacity: 0.5 }}>{children}</div>
    </div>
  ) : (
    children
  )
}
