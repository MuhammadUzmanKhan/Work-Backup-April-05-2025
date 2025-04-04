import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import BaseButton from 'components/formControl/baseButton/BaseButton';
import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg';
import { ReactComponent as Trust } from 'assets/icons/Trust.svg';

import palette from 'theme/palette';
import styles from 'pages/pointsPages/points.module.scss';

const Banner = ({ data, onClick }) => {
  const { t } = useTranslation();
  return (
    <Box className={styles.banner} onClick={onClick}>
      <Grid container alignItems="center">
        <Grid item mr={1}>
          {data.id === 1 ? <Wealth /> : <Trust />}
        </Grid>

        <Grid item>
          <Typography variant="body1" color={palette.variables.darkPurple}>
            {data.title}
          </Typography>
        </Grid>
      </Grid>

      <Grid container mb={2} justifyContent="space-between">
        {data.items?.map((el) => (
          <Grid item key={el.id} className={styles.infoItem}>
            <Box className={styles.infoTitle}>
              <img src={el.icon} alt="" />
              <Typography variant="bodyBig" ml={1} color={palette.variables.darkPurple}>
                {el.title}
              </Typography>
            </Box>

            <Typography variant="body2" color={palette.variables.greyLight}>
              {el.text}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <BaseButton
        customColor={palette.variables.darkPurple}
        onClick={onClick}
        fullWidth
        variant="contained"
        element={t('spendPoints')}
        sx={{ marginBottom: '32px' }}
      />
    </Box>
  );
};

export default Banner;

Banner.propTypes = {
  data: PropTypes.object,
  color: PropTypes.string,
  onClick: PropTypes.func
};
