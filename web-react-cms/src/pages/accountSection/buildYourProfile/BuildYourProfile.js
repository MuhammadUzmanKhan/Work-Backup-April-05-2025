import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import palette from 'theme/palette';
import styles from 'pages/accountSection/signUp/signUp.module.scss';

export default function BuildYourProfile({ title, linearProgress, stepTitle, children }) {
  return (
    <Box
      className={styles.formContainer}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
      <Typography component="h2" variant="h3" sx={{ marginBottom: '24px' }}>
        {title}
      </Typography>

      <Box sx={{ width: '100%', padding: '0 20px 24px', borderRadius: '3px' }}>
        <LinearProgress
          variant="determinate"
          value={linearProgress}
          color="lightPurple"
          sx={{
            backgroundColor: palette.variables.coolWhite,
            marginBottom: '11px',
            borderRadius: '3px'
          }}
        />
        <Typography
          sx={{ marginBottom: 0 }}
          color="common.darkPurple"
          variant="overline"
          align="left"
          display="block"
          gutterBottom>
          {stepTitle}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

BuildYourProfile.propTypes = {
  title: PropTypes.string,
  stepTitle: PropTypes.string,
  linearProgress: PropTypes.number,
  children: PropTypes.any
};
