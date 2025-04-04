import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar as MuiAppBar, Box, Grid, IconButton, Toolbar } from '@mui/material';
import classnames from 'classnames';
import { styled } from '@mui/material/styles';

import Sidebar from 'components/SideBar';
// import LanguageSwitch from 'components/languageSwitch/LanguageSwitch';
import { ReactComponent as CaretLeftIcon } from 'assets/icons/carret-left.svg';
import MenuIcon from '@mui/icons-material/Menu';

import { sidebarList } from 'utils/staticValues';

import palette from 'theme/palette';
import styles from 'layouts/mainLayout/mainLayout.module.scss';
import PageLoading from 'components/PageLoading'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import { prefixer } from 'stylis'
import { useSelector } from 'react-redux'
import { selectDirection } from 'store/app/appSlice'

const drawerWidth = 240
const defaultBackground = 'none'

export const BackgroundContext = React.createContext(defaultBackground)

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [loading] = useState(false)
  const [value, setVal] = useState({ background: defaultBackground, isWhite: false })
  const [open, setOpen] = useState(true)
  const direction = useSelector(selectDirection)

  const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin]
  })

  const cacheLtr = createCache({
    key: 'muiltr',
    stylisPlugins: []
  })

  useEffect(() => {
    if (pathname === '/') {
      navigate('/dashboard')
    }
  }, [])

  return (
    <BackgroundContext.Provider value={[value, setVal]}>
      <Box
        className={classnames([styles.container])}
        sx={{ backgroundImage: `url(${value.background})`, backgroundColor: '#FFFFFF' }}>
        <>
          <AppBar position="fixed" open={open} sx={{ backgroundColor: palette.variables.lightPurple }}>
            <Toolbar>
              <Box item className={styles.logoContainerFull} dir="ltr">
                <Grid
                  container
                  justifyContent="space-between"
                  alignItems="center"
                  wrap="nowrap"
                  style={{ textAlign: 'center', padding: '0 16px' }}>
                  <Grid item alignItems="center" sx={{ display: 'flex' }}>
                    <IconButton
                      color="inherit"
                      aria-label="open drawer"
                      onClick={() => setOpen(true)}
                      edge="start"
                      sx={{ mr: 2, height: 32, ...(open && { display: 'none' }) }}>
                      <MenuIcon color="inherit" />
                    </IconButton>
                    <CaretLeftIcon
                      className={classnames([{ [styles.isWhiteCaret]: value.isWhite }])}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(-1)}
                    />
                  </Grid>
                  <Grid item>
                    <b>Enviornment: {`${ process.env.REACT_APP_ENV || 'N/A' }`.toUpperCase()}</b>
                  </Grid>
                </Grid> 
              </Box>
            </Toolbar>
          </AppBar>
          <Sidebar items={sidebarList} open={open} setOpen={setOpen} />
        </>
        <Main className={styles.contentContainerAdmin} open={open}>
          {!loading ? (
            <Box dir={direction}>
              <CacheProvider value={direction === 'rtl' ? cacheRtl : cacheLtr}>
                <Outlet />
              </CacheProvider>
            </Box>
          ) : (
            <PageLoading loading={loading} />
          )}
        </Main>
      </Box>
    </BackgroundContext.Provider>
  )
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    // height: '100vh',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth + 40}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      })
    })
  })
);

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));
