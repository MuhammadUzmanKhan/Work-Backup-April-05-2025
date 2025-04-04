import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ReactComponent as IllustrationDone } from 'assets/images/illustrations/Illustration_done.svg';
import StatusOfRequest from 'layouts/statusOfRequest/StatusOfRequest';

export default function ChangePasswordSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <StatusOfRequest
      title={t('congratulations')}
      subTitle={t('yourPasswordReset')}
      image={<IllustrationDone style={{ marginBottom: '24px' }} />}
      btnText={t('done')}
      onClick={() => navigate('/signIn')}
    />
  );
}
