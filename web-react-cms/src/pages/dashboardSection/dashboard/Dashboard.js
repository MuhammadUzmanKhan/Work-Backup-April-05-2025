import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import Score from 'views/Dashboard/score/Score';
import QuizList from 'views/Dashboard/quizList/QuizList';
import DashboardProducts from 'views/Dashboard/products/DashboardProducts';
import { ReactComponent as RingIcon } from 'assets/icons/ring-icon.svg';
import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg';
import { ReactComponent as Trust } from 'assets/icons/Trust.svg';

import { selectProductCategory, selectCategory } from '../../../store/reducers/products';
import { fetchCategory, fetchProvider } from 'store/actions/products';
import { fetchData } from '../../../store/actions/dashboard';

import styles from './dashboard.module.scss';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const categories = useSelector(selectProductCategory).map((category) => ({
    ...category,
    onClick: () => {
      dispatch(selectCategory(category));
      navigate(`/card-categories/${category.type}`);
    }
  }));
  const score = 0;

  useEffect(() => {
    dispatch(fetchData());
    dispatch(fetchCategory());
    dispatch(fetchProvider());
  }, []);

  const items = [
    {
      title: 'Test your finance knowledge',
      subTitle: '10 points',
      icon: <Wealth />
    },
    {
      title: 'Connect your health data',
      subTitle: '10 points',
      icon: <Trust />
    }
  ];
  const isNotification = true;

  return (
    <Box className={styles.dashboardContainer}>
      <Grid container justifyContent="space-between">
        <Grid item>
          <Typography
            variant="bodyBig"
            color="common.white"
            component="h3"
            style={{ margin: '0 0 16px 0' }}>
            {t('yourScore')}
          </Typography>
        </Grid>
        <Grid item onClick={() => navigate('/notifications')}>
          {isNotification ? (
            <Badge
              componentsProps={{ badge: { className: styles.baseBadge } }}
              badgeContent={4}
              color="darkPurple">
              <RingIcon />
            </Badge>
          ) : (
            <RingIcon />
          )}
        </Grid>
      </Grid>
      <Box sx={{ marginBottom: '24px' }}>{score ? <Score /> : <QuizList items={items} />}</Box>
      <DashboardProducts items={categories} />
    </Box>
  );
}

export default Dashboard;
