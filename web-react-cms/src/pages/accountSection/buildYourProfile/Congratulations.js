import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';

import { ReactComponent as CongratulationsImage } from 'assets/images/illustrations/Congratulations.svg';
import StatusOfRequest from 'layouts/statusOfRequest/StatusOfRequest';

export default function Congratulations() {
  const navigate = useNavigate();

  const setNextStep = () => {
    navigate('/');
  };
  
  return (
    <StatusOfRequest
      sx={{ marginTop: '25px' }}
      title={t('congratulations')}
      subTitle={t('youAreAllSet')}
      image={<CongratulationsImage style={{ marginBottom: '68px' }} />}
      btnText={t('homePage')}
      onClick={setNextStep}
    />
  );
}
