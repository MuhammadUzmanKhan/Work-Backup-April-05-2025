import React, { useEffect, useState } from 'react';
import { Typography, Container, Box } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { t } from 'i18next';

import styles from './accountSection/signUp/signUp.module.scss';
import WentWrong from 'assets/images/illustrations/WentWrong.png';

import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';

export default function Congratulations() {
  const [redirectLink, setRedirectLink] = useState('/');
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  let [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectLink(redirect);
    }
  }, [searchParams]);

  const setNextStep = () => {
    navigate(redirectLink);
  };
  return (
    <Container
      sx={{ margin: '90px auto 0 auto', paddingBottom: '45px' }}
      component="main"
      maxWidth="xs">
      <Box
        className={styles.formContainer}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
        <Typography component="h2" align="center" variant="h3" sx={{ marginBottom: '24px' }}>
          {t('wentWrong')}
        </Typography>
        <Typography
          component="h3"
          align="center"
          color={palette.white['400']}
          variant="body2"
          sx={{ marginBottom: '42px' }}>
          {t('wentWrongText')}
        </Typography>
        <img
          src={WentWrong}
          alt=""
          style={{ marginBottom: '68px', height: '210px', width: '212px' }}
        />
        <BaseButton
          customColor={palette.variables.darkPurple}
          type="submit"
          fullWidth
          variant="contained"
          onClick={setNextStep}
          element={t('retry')}
          sx={{ marginBottom: '20px' }}
        />
        <Typography
          variant="caption"
          align="center"
          display="block"
          color={palette.variables.green}
          gutterBottom>
          {t('contactSupport')}
        </Typography>
      </Box>
    </Container>
  );
}
