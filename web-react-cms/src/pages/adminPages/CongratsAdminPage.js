import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';
import { ReactComponent as CongratulationsImage } from 'assets/images/illustrations/Congratulations.svg';

import styles from './admin.module.scss';

const CongratsAdminPage = () => {
  const navigate = useNavigate();

  return (
    <Box className={styles.congratsContainer}>
      <CongratulationsImage />
      <Typography variant="h3">Congrats! Your information was submitted successfuly</Typography>
      <Typography variant="bodyBig" onClick={() => navigate('/dashboard')}>
        Return to dashboard
      </Typography>
    </Box>
  );
};

export default CongratsAdminPage;
