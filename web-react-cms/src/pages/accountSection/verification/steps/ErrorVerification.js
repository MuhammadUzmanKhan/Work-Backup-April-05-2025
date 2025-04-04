import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import StatusOfRequest from 'layouts/statusOfRequest/StatusOfRequest';
import { ReactComponent as IllustrationError } from 'assets/images/illustrations/Illustration_error.svg';

export default function ChangePasswordError() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <StatusOfRequest
      title={t('error')}
      subTitle={t('somethingWentWrong')}
      image={<IllustrationError style={{ marginBottom: '24px' }} />}
      btnText={t('retry')}
      onClick={() => navigate('/verification')}
    />
  );
}
