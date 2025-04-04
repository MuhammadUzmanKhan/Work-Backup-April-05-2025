import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { ReactComponent as ScoreBoard } from 'assets/icons/ScoreBoard.svg';
import styles from './score.module.scss';

export default function Score(props) {
  const { t } = useTranslation();
  return (
    <Box className={styles.scoreContainer} {...props}>
      <Box className={styles.scoreBoardContainer}>
        <ScoreBoard value={props.value} />
        <Grid
          container
          sx={{
            position: 'absolute',
            top: '35px',
            left: '16px'
          }}>
          <Grid xs={12} item>
            <Typography variant="caption" color="#29173B">
              {t('points')}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h1">500</Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

Score.propTypes = {
  value: PropTypes.any
};
