import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';

import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard';
import { dashboardList } from 'utils/staticValues';

import styles from './admin.module.scss';
import { Permissions } from 'components/Permissions'

const DashboardAdminPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onGoToCategory = (to) => {
    navigate(to)
  }

  return (
    <Box className={styles.container}>
      <Typography variant="h3" mb={5}>
        {t('admin.welcomeBack')}
      </Typography>

      <Grid container spacing={2}>
        {dashboardList?.map((item) => (
          <Permissions key={item.id} permission={item.access}>
            <Grid item md={4} xs={6} key={item.id}>
              <ItemDashboard item={item} onClick={() => onGoToCategory(item.to)} translate={true} />
            </Grid>
          </Permissions>
        ))}
      </Grid>
    </Box>
  )
}

export default DashboardAdminPage;
