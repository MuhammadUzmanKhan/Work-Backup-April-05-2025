import React from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';

import styles from './notification.module.scss';
import { ReactComponent as AchivementIcon } from 'assets/icons/Achivement-icon.svg';
import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';

export default function NotificationItem({ item }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box className={classnames([styles.notificationContainer, { [styles.active]: item.active }])}>
      <Grid container>
        <Grid item xs={3}>
          <AchivementIcon />
        </Grid>
        <Grid item xs={9}>
          <Typography variant="subtitle1" color={palette.variables.darkPurple}>
            {item.title}
          </Typography>
          <Typography variant="caption" color={palette.white['400']}>
            {item.description}
          </Typography>
        </Grid>
        {item.isReadMore ? (
          <Grid item xs={12}>
            <BaseButton
              type="text"
              sx={{ display: 'flex', margin: '0 0 0 auto', minHeight: 'initial', padding: '0' }}
              element={
                <Typography
                  sx={{ marginBottom: 0 }}
                  color={palette.variables.green}
                  variant="caption"
                  align="center"
                  display="block"
                  onClick={() => navigate('/notification/' + item.id)}
                  gutterBottom>
                  {t('readMore')}
                </Typography>
              }
            />
          </Grid>
        ) : (
          <div />
        )}
      </Grid>
    </Box>
  );
}

NotificationItem.propTypes = {
  item: PropTypes.object
};
