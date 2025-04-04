import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import BaseButton from 'components/formControl/baseButton/BaseButton';
import { ReactComponent as LogoDefault } from 'assets/images/illustrations/logo-default.svg';

import palette from 'theme/palette';
import { Auth } from 'aws-amplify';

const SignInAdminPage = () => {
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      await Auth.federatedSignIn();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Grid
      container
      spacing={1}
      justifyContent="center"
      alignItems="center"
      direction="column"
      height="100vh">
      <Grid container item md={6} xs={12} direction="column" alignItems="center" p={3}>
        <Typography variant="h3" color={palette.variables.darkPurple} mb={3}>
          {`Welcome to Daleel's Admin Panel`}
        </Typography>
        <LogoDefault />
        <Box>
          <BaseButton
            customColor={palette.variables.darkPurple}
            type="submit"
            fullWidth
            variant="contained"
            element={t('logIn')}
            onClick={handleSubmit}
            sx={{ display: 'block', width: 300, margin: '30px auto' }}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default SignInAdminPage;
