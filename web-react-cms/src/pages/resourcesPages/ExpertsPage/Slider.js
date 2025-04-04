import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from '../resources.module.scss';

const Slider = ({ data, onClick, active }) => (
  <Box className={styles.wrapSlider}>
    <Grid container justifyContent="space-between" className={styles.slider}>
      {data?.map((el) => (
        <Grid
          item
          className={classnames(styles.card, { [styles.cardActive]: active === el.id })}
          onClick={() => onClick(el)}
          key={el.id}>
          <img src={el.url} alt="" />
          <Typography variant="subtitle1">{el.name}</Typography>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default Slider;

Slider.propTypes = {
  data: PropTypes.array,
  onClick: PropTypes.func,
  active: PropTypes.number
};
