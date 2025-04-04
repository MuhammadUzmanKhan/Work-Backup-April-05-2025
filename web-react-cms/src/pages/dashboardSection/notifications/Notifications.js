import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import NotificationsItems from 'views/Notifications/NotificationsItems';
import { ReactComponent as IllustrationNotificationIcon } from 'assets/images/illustrations/Illustration-Notification.svg';
import palette from 'theme/palette';

export default function Notifications() {
  const { t } = useTranslation();
  const items = [];
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
        <Typography variant="h3">{t('notifications')}</Typography>
        {items.length ? (
          <Typography variant="caption" color="common.lightGreen">
            {t('markAllRead')}
          </Typography>
        ) : (
          <div />
        )}
      </Box>
      {items.length ? (
        items.map((item, index) => (
          <NotificationsItems title={item.title} items={item.items} key={index} />
        ))
      ) : (
        <Box sx={{ paddingTop: '8px', textAlign: 'center' }}>
          <Typography
            style={{ marginBottom: '24px' }}
            variant="caption"
            component="h3"
            color={palette.white['200']}>
            {t('noNotificationYet')}
          </Typography>
          <IllustrationNotificationIcon />
        </Box>
      )}
    </Box>
  );
}
