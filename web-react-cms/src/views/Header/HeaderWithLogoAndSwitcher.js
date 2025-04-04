import React from 'react';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';

import { ReactComponent as LogoDefault } from 'assets/images/illustrations/logo-default.svg';
import LanguageSwitch from 'components/languageSwitch/LanguageSwitch';

export default function HeaderWithLogoAndSwitcher({ isWhite }) {
  return (
    <Grid container justifyContent="center" spacing={1} style={{ textAlign: 'center' }}>
      <Grid item xs={3} sx={{ margin: '0 auto 0 0' }} />
      <Grid item xs={6} sx={{ textAlign: 'center' }}>
        <LogoDefault />
      </Grid>
      <Grid item xs={3} sx={{ margin: '0 0 0 auto', display: 'flex', alignItems: 'center' }}>
        <LanguageSwitch isWhite={isWhite} />
      </Grid>
    </Grid>
  );
}

HeaderWithLogoAndSwitcher.defaultProps = {
  isWhite: false
};

HeaderWithLogoAndSwitcher.propTypes = {
  isWhite: PropTypes.bool
};
