import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { notificationType } from 'utils/staticValues'
import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard'

function NotificationsAdminPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('admin.notifications')}</Typography>
      </Box>
      <Grid container spacing={2}>
        {notificationType?.map((item) => (
          <Grid item md={4} xs={6} key={item.id}>
            <ItemDashboard item={item} onClick={() => navigate(item.to)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default NotificationsAdminPage
