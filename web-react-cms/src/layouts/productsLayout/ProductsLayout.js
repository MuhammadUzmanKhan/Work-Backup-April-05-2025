import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import Navbar from 'views/Navbar';

export const CardsContext = React.createContext({
  withBottomBar: true,
  title: ''
});

export default function ProductsLayout() {
  const [value, setVal] = useState({
    withBottomBar: true,
    title: ''
  });

  return (
    <CardsContext.Provider value={[value, setVal]}>
      <Box>
        <Typography variant="h3">{value.title}</Typography>
        {value.withBottomBar ? <Navbar /> : <div />}
        <Outlet />
      </Box>
    </CardsContext.Provider>
  );
}
