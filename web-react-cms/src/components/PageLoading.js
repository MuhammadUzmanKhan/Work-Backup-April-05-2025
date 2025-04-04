import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import palette from '../theme/palette';

export default function PageLoading({ loading }) {
  return (
    <Backdrop
      sx={{
        color: palette.variables.lightGreen,
        backgroundColor: 'rgb(242 242 242 / 50%)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
      open={loading}>
      <CircularProgress
        sx={{ height: '80px !important', width: '80px !important' }}
        color="inherit"
      />
    </Backdrop>
  );
}

PageLoading.propTypes = {
  loading: PropTypes.bool
};
