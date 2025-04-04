import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AchivementIcon } from 'assets/icons/Achivement-icon.svg';
import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import styles from './notification.module.scss';

export default function Notification() {
  let { t } = useTranslation();

  return (
    <Box>
      <Grid container>
        <Grid xs={12} item justifyContent="center" textAlign="center" sx={{ marginBottom: '40px' }}>
          <AchivementIcon style={{ width: '88px', height: '88px' }} />
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '16px' }}>
          <Typography variant="bodyBig" color={palette.variables.darkPurple}>
            Lorem ipsum dolor sit amet, consectetur adcipiscing elit.{' '}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color={palette.white['400']}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lacinia sagittis in feugiat
            nibh dictumst at proin. Morbi blandit velit faucibus consequat viverra. Condimentum
            lectus congue tristique potenti est fermentum mattis volutpat. In sodales urna, egestas
            mattis fames suspendisse at mauris. Justo, sem amet dis justo pellentesque ac vel. A, et
            duis morbi aliquet lobortis nibh purus. Nullam accumsan, nulla vel nunc tincidunt ut.
            Eleifend mauris cras ac arcu eget ultricies. Vel pretium, integer nullam odio
            ullamcorper varius cursus eget. Nibh nunc gravida in sit interdum vel maecenas
            adipiscing massa. Fermentum sagittis, neque ac lectus risus, eros. Habitant sit eu
            mauris dolor morbi nunc rhoncus ante. Habitant lorem purus sit nunc. Orci, pulvinar
            ultricies congue tortor vitae ut. Eget egestas vestibulum ac eget ac, bibendum tempor
            sollicitudin vitae. Integer malesuada ut augue vitae. Quisque vulputate ipsum aliquam
            mattis dui, hac. Amet, morbi cursus morbi enim porttitor amet, diam. Lorem ipsum dolor
            sit amet, consectetur adipiscing elit. Lacinia sagittis in feugiat nibh dictumst at
            proin. Morbi blandit velit faucibus consequat viverra. Condimentum lectus congue
            tristique potenti est fermentum mattis volutpat. In sodales urna, egestas mattis fames
            suspendisse at mauris. Justo, sem amet dis justo pellentesque ac vel. A, et duis morbi
            aliquet lobortis nibh purus. Nullam accumsan, nulla vel nunc tincidunt ut. Eleifend
            mauris cras ac arcu eget ultricies. Vel pretium, integer nullam odio ullamcorper varius
            cursus eget. Nibh nunc gravida in sit interdum vel maecenas adipiscing massa. Fermentum
            sagittis, neque ac lectus risus, eros. Habitant sit eu mauris dolor morbi nunc rhoncus
            ante. Habitant lorem purus sit nunc. Orci, pulvinar ultricies congue tortor vitae ut.
            Eget egestas vestibulum ac eget ac, bibendum tempor sollicitudin vitae. Integer
            malesuada ut augue vitae. Quisque vulputate ipsum aliquam mattis dui, hac. Amet, morbi
            cursus morbi enim porttitor amet, diam.
          </Typography>
        </Grid>
      </Grid>
      <Box className={styles.bottomContainer}>
        <Box className={styles.background}>
          <BaseButton
            customColor={palette.variables.darkPurple}
            type="submit"
            fullWidth
            variant="contained"
            element={t('startQuiz')}
            sx={{ width: '100%' }}
          />
        </Box>
      </Box>
    </Box>
  );
}
