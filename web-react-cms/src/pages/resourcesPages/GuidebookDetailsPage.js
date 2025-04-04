import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import Banner from 'assets/images/illustrations/Illustration_guidebookDetails.svg';
import Avatar from 'assets/avatars/avatar1.svg';

import styles from './resources.module.scss';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import palette from 'theme/palette';

const GuidebookDetailsPage = () => {
  const { t } = useTranslation();
  return (
    <Box className={classNames(styles.giudebookDetails, styles.container)}>
      <Typography variant="h3" className={styles.title}>
        Impoving Your Credit Score
      </Typography>

      <Box mb={2}>
        <img src={Banner} />
      </Box>

      <Box className={styles.personInfo}>
        <Box mr={1}>
          <img src={Avatar} alt="" />
        </Box>

        <Box className={styles.info}>
          <Typography variant="subtitle1" color="common.darkPurple">
            Dr. Ali Ahmed
          </Typography>
          <Typography variant="caption" color="common.greyLight">
            4 January 2022
          </Typography>
        </Box>
      </Box>

      <Typography variant="caption" color="common.greyLight">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consectetur ac elementum metus, vel
        quis morbi nisl. Non, sit volutpat ullamcorper phasellus risus id. Proin nibh volutpat
        sagittis donec nisl faucibus mauris sit justo. Neque amet felis volutpat molestie
        pellentesque.
      </Typography>

      <BaseButton
        customColor={palette.variables.darkPurple}
        onClick={() => console.log('click')}
        sx={{ maxWidth: 500, marginTop: 2 }}
        fullWidth
        variant="contained"
        element={t('resources.takeQuiz')} //
      />
    </Box>
  );
};

export default GuidebookDetailsPage;
