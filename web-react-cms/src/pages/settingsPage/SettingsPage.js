import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import { useTranslation } from 'react-i18next';

import BaseButton from 'components/formControl/baseButton/BaseButton';

import { signOut, currentAuthenticatedUser } from 'store/actions/user';
import palette from 'theme/palette';

export default function ResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState();

  useEffect(() => {
    (async () => {
      const { email } = await currentAuthenticatedUser();
      setEmail(email);
    })();
  }, []);

  const onSignOut = () => {
    dispatch(signOut(email));
    navigate('/signIn');
  };

  return (
    <Container component="main" maxWidth="xs" style={{ paddingBottom: '40px', marginTop: '115px' }}>
      <BaseButton
        customColor={palette.variables.darkPurple}
        onClick={() => navigate('/admin')}
        variant="contained"
        element="Go To CMS"
        fullWidth
        sx={{ mb: 5 }}
      />
      <BaseButton
        customColor={palette.variables.darkPurple}
        onClick={onSignOut}
        variant="contained"
        element={t('signOut')}
        fullWidth
      />
    </Container>
  );
}
