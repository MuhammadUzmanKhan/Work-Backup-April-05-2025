import React from 'react';
import { Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from 'pages/pointsPages/points.module.scss';

const TabHeader = ({ data, active, color, onClick }) => {
  return (
    <Grid
      item
      xs={6}
      className={classnames([styles.tabHeader, { [styles.active]: active }])}
      onClick={onClick}>
      <Typography variant="subtitle1" color={active ? color : '#fff'}>
        {data.title}
      </Typography>
    </Grid>
  );
};

export default TabHeader;

TabHeader.propTypes = {
  data: PropTypes.object,
  active: PropTypes.bool,
  color: PropTypes.string,
  onClick: PropTypes.func
};
