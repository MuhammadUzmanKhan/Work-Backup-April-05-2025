import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import palette from 'theme/palette';
import styles from 'pages/pointsPages/points.module.scss';

const Quizzes = ({ data, onClick }) => {
  return (
    <Box className={styles.quizzesWrap}>
      {data.items?.map((el) => (
        <Grid container key={el.id} className={styles.quizze} onClick={onClick}>
          <Box className={styles.infoTitle}>
            <img src={el.icon} alt="" />
            <Box>
              <Typography variant="bodyBig" ml={1} color={palette.variables.darkPurple}>
                {el.title}
              </Typography>
              <Typography variant="bodyBig" ml={1} color={palette.variables.darkPurple}>
                {el.text}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color={palette.variables.greyLight}>
            {el.text}
          </Typography>
        </Grid>
      ))}
    </Box>
  );
};

export default Quizzes;

Quizzes.propTypes = {
  data: PropTypes.object,
  color: PropTypes.string,
  onClick: PropTypes.func
};
