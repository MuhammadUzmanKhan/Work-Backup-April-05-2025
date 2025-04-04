import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HashRouter as Router } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
// import { CacheProvider } from '@emotion/react'
// import createCache from '@emotion/cache'
// import rtlPlugin from 'stylis-plugin-rtl'
import { Box } from '@mui/material'
// import { prefixer } from 'stylis'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { selectDirection, setLanguage } from 'store/app/appSlice'
import ThemeOptions from 'theme/index'
import Routes from 'routes/routes'
import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

// const cacheRtl = createCache({
//   key: 'muirtl',
//   stylisPlugins: [prefixer, rtlPlugin]
// })

// const cacheLtr = createCache({
//   key: 'muiltr',
//   stylisPlugins: []
// })

function App() {
  const direction = useSelector(selectDirection)
  const dispatch = useDispatch()
  const theme = createTheme(ThemeOptions({ direction }))
  useEffect(() => {
    dispatch(setLanguage('en'))
  }, [])

  return (
    <Box>
      {/* <CacheProvider value={direction === 'rtl' ? cacheRtl : cacheLtr}> */}
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Router>
            <Routes />
            <ToastContainer
              position="bottom-center"
              theme="colored"
              hideProgressBar
              // autoClose={false}
              autoClose={5000}
            />
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
      {/* </CacheProvider> */}
    </Box>
  )
}

export default App
