import React from 'react';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import LanguageSwitch from 'components/languageSwitch/LanguageSwitch';
import { selectUser } from 'store/reducers/user';
import { PATH } from 'utils/constants';
import { setTitleFromPath } from 'utils/functions';

export default function HeaderWithLogoAndSwitcher({ isWhite }) {
  const location = useLocation();
  const { pathname } = location;
  const { t } = useTranslation();
  const { user } = useSelector(selectUser);

  return (
    <Grid
      container
      justifyContent="space-between"
      alignItems="center"
      wrap="nowrap"
      style={{ textAlign: 'center', padding: '0 16px' }}>
      <Grid item>
        <Typography
          sx={{ margin: 0 }}
          color="common.white"
          variant="h3"
          align="left"
          display="block"
          gutterBottom>
          {pathname === PATH.RESOURCES || pathname === PATH.POINTS
            ? setTitleFromPath(pathname)
            : `${t('Hello') + ', ' + user?.attributes?.name}`}
        </Typography>
      </Grid>
      <Grid item>
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
