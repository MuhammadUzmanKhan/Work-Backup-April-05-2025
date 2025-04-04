import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import { Box, Drawer, ListItemButton, List, IconButton, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import { ReactComponent as Logo } from 'assets/images/illustrations/logo-default.svg'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import palette from 'theme/palette'
import { useDispatch } from 'react-redux'
import { userSignOut } from 'store/actions/user'
import { useTranslation } from 'react-i18next'
import BaseModel from './modal/BaseModal'

const Sidebar = ({ items, open, setOpen }) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)

  const theme = useTheme()
  return (
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box'
        }
      }}
      variant="persistent"
      anchor="left"
      open={open}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ListItemButton component={NavLink} to="/dashboard" sx={{ maxHeight: 70 }}>
          <Logo /> <Box ml={1}>{t('sidebar.daleel')}</Box>
        </ListItemButton>
        <IconButton
          sx={{ height: 'max-content' }}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(false)
          }}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      <List disablePadding>
        <Box>
          {items?.map((item) => (
            <ListItemButton key={item.id} component={NavLink} to={item.to} sx={{ maxHeight: 70 }}>
              <Typography sx={{ padding: 5 }} variant="body1" color={palette.variables.darkPurple}>
                {t(`sidebar.${item.name.toLowerCase()}`)}
              </Typography>
            </ListItemButton>
          ))}
          <ListItemButton onClick={() => setModalOpen(true)} sx={{ maxHeight: 70 }}>
            <Typography sx={{ padding: 5 }} variant="body1" color={palette.variables.darkPurple}>
              {t('sidebar.logout')}
            </Typography>
          </ListItemButton>
        </Box>
      </List>
      <BaseModel
        text={t('logoutConfirmation')}
        handleClose={() => setModalOpen(false)}
        handleSuccess={() => {
          dispatch(userSignOut())
          setModalOpen(false)
        }}
        open={modalOpen}
      />
    </Drawer>
  )
}

export default Sidebar

Sidebar.propTypes = {
  items: PropTypes.array,
  showFooter: PropTypes.bool,
  open: PropTypes.bool,
  setOpen: PropTypes.func
}
