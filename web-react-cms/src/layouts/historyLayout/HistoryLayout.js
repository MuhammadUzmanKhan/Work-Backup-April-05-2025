import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Grid } from '@mui/material';

import LanguageSwitch from 'components/languageSwitch/LanguageSwitch';
import { ReactComponent as CaretLeftIcon } from 'assets/icons/carret-left.svg';
import styles from 'layouts/mainLayout/mainLayout.module.scss';

import classnames from 'classnames';

const defaultBackground = 'none';
export const BackgroundContext = React.createContext(defaultBackground);

export default function HistoryLayout() {
  const navigate = useNavigate();
  const [value, setVal] = useState({ background: defaultBackground, isWhite: false });

  return (
    <BackgroundContext.Provider value={[value, setVal]}>
      <Box
        className={classnames([styles.container])}
        sx={{
          backgroundImage: `url(${value.background})`,
          backgroundColor: '#FFFFFF'
        }}>
        <Box className={styles.logoContainer} dir="ltr">
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            wrap="nowrap"
            style={{ textAlign: 'center', padding: '0 16px' }}>
            <Grid item>
              <CaretLeftIcon
                className={classnames([{ [styles.isWhiteCaret]: value.isWhite }])}
                onClick={() => navigate(-1)}
              />
            </Grid>
            <Grid item>
              <LanguageSwitch isWhite={value.isWhite} />
            </Grid>
          </Grid>
        </Box>
        <Box className={styles.contentContainer}>
          <Outlet />
        </Box>
      </Box>
    </BackgroundContext.Provider>
  );
}
