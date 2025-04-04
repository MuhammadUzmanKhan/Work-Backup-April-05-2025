import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

import Slider from './Slider';
import Accordion from './Accordion';
import GuidebooksList from './GuidebooksList';

import { resourceExperts, resourcesGuidbooks } from 'utils/fakeValues';
import { setStateValue } from 'store/reducers/resources';

import styles from '../resources.module.scss';

const ExpertsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { selectedExpert } = useSelector((state) => state.resources);

  useEffect(() => {
    onChooseExpert(resourceExperts[0]);
  }, []);

  const onChooseExpert = useCallback(
    (expert) => dispatch(setStateValue({ type: 'selectedExpert', data: expert })),
    []
  );

  const onChooseGuidebook = useCallback((id) => {
    navigate(`/resources/guidebooks/${id}`);
  }, []);

  return (
    <Box className={styles.container}>
      <Box className={styles.section}>
        <Typography variant="h3" className={styles.title}>
          {t('resources.meetOurExperts')}
        </Typography>

        <Slider data={resourceExperts} onClick={onChooseExpert} active={selectedExpert?.id || 1} />
      </Box>

      <Box className={styles.section}>
        <Typography variant="h3" className={styles.title}>
          {t('resources.about')}
        </Typography>

        <Grid container spacing={1} wrap="nowrap">
          <Grid item>
            <img src={selectedExpert?.url} alt="" />
          </Grid>
          <Grid item>
            <Typography variant="subtitle1" color="common.darkPurple" mb={1}>
              {selectedExpert?.name}
            </Typography>

            <Typography variant="body2" color="common.greyLight" mb={1}>
              {selectedExpert?.description}
            </Typography>

            {selectedExpert?.areaExpertise?.length && (
              <>
                <Typography variant="caption" color="common.greyLight">
                  {t('resources.areaOfExpertise')}
                </Typography>

                <Box>
                  {selectedExpert?.areaExpertise?.map((area, index) => (
                    <Chip
                      label={area}
                      color="success"
                      size="small"
                      sx={{ color: '#fff', marginRight: 1, marginTop: 1 }}
                      key={index}
                    />
                  ))}
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Box>

      <Box className={styles.section}>
        <Typography variant="h3" className={styles.title}>
          {t('resources.yourFAQsAnswered')}
        </Typography>

        <Accordion />
      </Box>

      <Box className={styles.section}>
        <Typography variant="h3" className={styles.title}>
          {t('resources.guidebooks')}
        </Typography>

        <GuidebooksList data={resourcesGuidbooks} onClick={onChooseGuidebook} />
      </Box>
    </Box>
  );
};

export default ExpertsPage;
