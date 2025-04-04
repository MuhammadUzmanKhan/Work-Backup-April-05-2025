import { Box, Grid, Typography, IconButton, Link } from '@mui/material';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import palette from 'theme/palette';
import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';

import { Link as Route, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getRewards } from 'store/actions/rewards';
// import { deleteFuncToast } from 'utils'
import { Permissions } from 'components/Permissions'

function RewardsAdminPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [reward, setReward] = useState([])

  useEffect(async () => {
    const data = await dispatch(getRewards())
    setReward(data.payload.reverse())
  }, [])
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('admin.allOffers')}</Typography>
        <Permissions permission={'write:reward'}>
          <BaseButton
            customColor={palette.variables.orange}
            variant="contained"
            element={t('add')}
            onClick={() => navigate('/rewards/0')}
            sx={{ display: 'flex', marginLeft: 3 }}
          />
        </Permissions>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.reward')}
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.partner')}
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.validity')}
          </Typography>
        </Grid>
      </Grid>
      {reward &&
        reward.map((res) => (
          <Grid key={res.id} container spacing={2}>
            <Grid item xs={6} sx={{ display: 'flex' }}>
              <Typography variant="subtitle1" component="h4">
                {res.name}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {res.partner}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              {res.validUntil}
            </Grid>
            <Grid item xs={2}>
              <Link component={Route} to={`/rewards/${res.id}`} color="#29173B" underline="none">
                <IconButton size="small" aria-label="edit">
                  <EditIcon fontSize="small" color="secondary" />
                </IconButton>
              </Link>
            </Grid>
          </Grid>
        ))}
    </>
  )
}

export default RewardsAdminPage;
