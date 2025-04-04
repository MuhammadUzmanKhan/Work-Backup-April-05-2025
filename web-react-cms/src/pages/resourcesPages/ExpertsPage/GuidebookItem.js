import React from 'react';
import { Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import styles from '../resources.module.scss';

const GuidebookItem = ({ data, onClick }) => (
  <Grid container mb={2} className={styles.guidebook} onClick={onClick}>
    <Grid item className={styles.card}>
      <img src={data.url} alt="" />
      <Typography variant="subtitle1">{data.name}</Typography>
    </Grid>

    <Grid item>
      <ArrowForwardIosIcon sx={{ fill: '#C6C6C6', width: 15 }} />
    </Grid>
  </Grid>
);

export default GuidebookItem;

GuidebookItem.propTypes = {
  data: PropTypes.object,
  onClick: PropTypes.func
};
