import React, { useEffect } from 'react';
import { Box, Card, CardContent, CardMedia, Grid, Link, Typography } from '@mui/material';
import { Link as Route } from 'react-router-dom';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import { useTranslation } from 'react-i18next';
import palette from 'theme/palette';
import { useDispatch, useSelector } from 'react-redux';
import { getExperts, getExpertsByArabicLang } from 'store/actions/experts'
import { Permissions } from 'components/Permissions'

const ExpertsAdminPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { experts } = useSelector((state) => state.experts)

  useEffect(() => {
    const fetchingExperts = async () => {
      await dispatch(getExperts())
      await dispatch(getExpertsByArabicLang({ lang: 'AR' }))
    }
    fetchingExperts()
  }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('admin.experts')}</Typography>
        <Permissions permission={'write:expert'}>
          <Link component={Route} underline="none" to="/experts/add">
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              sx={{ display: 'flex', ml: 3 }}
            />
          </Link>
        </Permissions>
      </Box>
      <Grid container spacing={{ xs: 1, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {experts.map((expert) => (
          <Grid item xs={2} sm={4} md={4} key={expert.id}>
            <Card>
              <Link
                component={Route}
                color="#000000"
                underline="none"
                to={`/experts/${expert.id}${expert.type ? '?lang=' + expert.type : ''}`}>
                <CardMedia
                  component="img"
                  style={{ objectFit: 'contain' }}
                  height="140"
                  image={expert.iconUrl}
                  alt="iconUrl"
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {expert.name}
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

export default ExpertsAdminPage;
