import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import SearchFilter from 'views/Products/SearchFilter';
import Banner from 'assets/images/illustrations/Illustration_resouces.svg';

import { resources } from 'utils/fakeValues';
import { setResourcesPath } from 'utils/functions';
import { setStateValue } from 'store/reducers/resources';

import styles from './resources.module.scss';

function Resources() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onChooseResource = (resource) => {
    dispatch(setStateValue({ type: 'selectedResource', data: resource }));
    navigate(`/resources/${setResourcesPath(resource.id)}`);
  };

  const onGoToPoins = () => {
    navigate('/points');
  };

  return (
    <Box className={styles.container}>
      <SearchFilter withFilter={false} />

      <Box className={styles.banner} onClick={onGoToPoins}>
        <Typography variant="bodyBig" className={styles.title}>
          {t('resources.unlockPoints')}
        </Typography>
        <img src={Banner} alt="" />
      </Box>

      <Grid container justifyContent="space-between" className={styles.listResources}>
        {resources.map((el) => (
          <Grid item className={styles.resource} key={el.id} onClick={() => onChooseResource(el)}>
            <img src={el.url} alt="" />
            <Typography variant="subtitle1">{el.title}</Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Resources;
