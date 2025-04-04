import React, { useEffect } from 'react';
import { Box, Grid, Typography, IconButton, Link, Chip } from '@mui/material';

import BaseButton from 'components/formControl/baseButton/BaseButton';
import { useTranslation } from 'react-i18next';

import palette from 'theme/palette';
import EditIcon from '@mui/icons-material/Edit';
import { Link as Route, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { getUsers } from 'store/actions/user';
import { Permissions } from 'components/Permissions'
import { roles } from 'utils/staticValues'

const UsersAdminPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { users } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(getUsers())
  }, [])

  return (
    <Box sx={{ width: '100%' }}>
      <Box>
        <Grid container alignItems="center" justifyContent="space-between" mb={3}>
          <Grid item>
            <Typography variant="h3" mt={3}>
              {t('admin.users')}
            </Typography>
          </Grid>

          <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
            <Permissions permission={'write:user'}>
              <Link component={Route} to="/users/add" color="#000000" underline="none">
                <BaseButton
                  customColor={palette.variables.orange}
                  variant="contained"
                  element={t('add')}
                  sx={{ display: 'block', maxWidth: 300, height: 'max-content', marginLeft: 3 }}
                />
              </Link>
            </Permissions>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {t('fields.email')}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {t('fields.role')}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {t('fields.status')}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {t('fields.action')}
              </Typography>
            </Grid>
          </Grid>
          {users.map((user, index) => {
            return (
              <Grid style={{ margin: '0.5rem 0' }} key={index} container spacing={2}>
                <Grid item xs={4}>
                  <Typography
                    style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    variant="subtitle1"
                    component="h4">
                    {user.email}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" component="h4">
                    {t(`fields.${roles.find((r) => r.id === user.role).title}`)}
                  </Typography>
                </Grid>
                <Grid items xs={2}>
                  <Chip
                    style={{ marginTop: '0.5rem', color: '#fff' }}
                    label={user.enabled ? t('fields.enabled') : t('fields.disabled')}
                    color={user.enabled ? 'success' : 'error'}
                  />
                </Grid>

                <Grid item xs={2}>
                  {/* <Link component={Route} to={`/users/${user.id}`} color="#000000" underline="none"> */}
                  <IconButton
                    size="small"
                    aria-label="edit"
                    onClick={() => navigate(`/users/${user.id}`, { state: user })}>
                    <EditIcon color="secondary" fontSize="small" />
                  </IconButton>
                  {/* </Link> */}
                </Grid>
              </Grid>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

export default UsersAdminPage;
