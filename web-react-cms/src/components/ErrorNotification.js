import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { ReactComponent as AlertCircle } from 'assets/icons/Alert-circle.svg';

export default function ErrorNotification({ errorText, sx, children }) {
  return (
    <Box
      sx={{
        padding: '17px',
        border: '1px solid #C86B6D',
        borderRadius: '12px',
        background: '#FFE1FF',
        display: 'flex',
        alignItems: 'center',
        ...sx
      }}>
      <Box
        sx={{
          display: 'flex'
        }}>
        <AlertCircle style={{ marginRight: '17px' }} />
        <Typography
          color="common.error"
          sx={{ margin: 0 }}
          variant="body2"
          align="center"
          display="block"
          gutterBottom>
          {errorText}
        </Typography>
      </Box>

      <React.Fragment>{children}</React.Fragment>
    </Box>
  );
}

ErrorNotification.defaultProps = {
  sx: {}
};

ErrorNotification.propTypes = {
  errorText: PropTypes.string,
  children: PropTypes.any,
  sx: PropTypes.object
};
