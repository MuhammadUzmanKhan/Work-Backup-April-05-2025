import React, { useEffect } from 'react';
import { Box, Card, CardContent, CardMedia, Grid, Link, Typography } from '@mui/material';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import palette from 'theme/palette';
import { useSelector, useDispatch } from 'react-redux';
import { Link as Route } from 'react-router-dom';
import { getResources, getResourcesByArabicLang } from 'store/actions/resources'
import { Permissions } from 'components/Permissions'
// import { setLanguage } from 'store/app/appSlice'

const ResourcesAdminPage = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { resources } = useSelector((state) => state.resources)

  useEffect(async () => {
    await dispatch(getResources())
    await dispatch(getResourcesByArabicLang({ lang: 'AR' }))
  }, [])
  console.log(resources)
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('admin.resources')}</Typography>
        <Link component={Route} to="/resources/add" color="#000000" underline="none">
          <Permissions permission={'write:guidebook'}>
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              sx={{ display: 'flex', marginLeft: 3 }}
            />
          </Permissions>
        </Link>
      </Box>
      <Grid container spacing={{ xs: 1, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {resources?.length > 0 &&
          resources.map((resource) => (
            <Grid item xs={2} sm={4} md={4} key={resource.id}>
              <Card>
                <Link
                  component={Route}
                  to={`/resources/${resource.id}${resource.type ? '?lang=' + resource.type : ''}`}
                  color="#000000"
                  underline="none">
                  <CardMedia
                    style={{ objectFit: 'contain' }}
                    component="img"
                    height="140"
                    image={resource.iconUrl}
                    alt="icon"
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {resource.name}
                    </Typography>
                  </CardContent>
                </Link>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}

export default ResourcesAdminPage;
