import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Typography } from '@mui/material';

import TabHeader from '../../views/Points/TabHeader';
import Banner from '../../views/Points/Banner';
import Graphics from '../../views/Points/Graphics';

import { tabsHeaderPoints, bannerPoints, pointsGraphics } from 'utils/staticValues';
import { setStateValue } from 'store/reducers/points';

import palette from 'theme/palette';
import styles from 'pages/pointsPages/points.module.scss';

const PointPage = () => {
  const dispatch = useDispatch();
  const { selectedTab } = useSelector((state) => state.points);

  const onChangeActiveTab = (id) => {
    dispatch(setStateValue({ type: 'selectedTab', data: id }));
  };

  return (
    <Box className={styles.container}>
      <Typography variant="h3" className={styles.title}>
        500
      </Typography>

      <Grid container sx={{ paddingY: 2 }}>
        {tabsHeaderPoints.map((tab) => (
          <TabHeader
            key={tab.id}
            data={tab}
            active={selectedTab === tab.id}
            color={selectedTab === 1 ? palette.variables.orange : palette.variables.green}
            onClick={() => onChangeActiveTab(tab.id)}
          />
        ))}
      </Grid>

      <Banner data={bannerPoints[selectedTab ? selectedTab - 1 : 0]} />

      <Box marginY={2}>
        <Typography variant="bodyBig" color={palette.variables.darkPurple}>
          {selectedTab === 1 ? 'Quizzes' : 'Weekly Progress Chart'}
        </Typography>
      </Box>

      {selectedTab === 1 ? <Box marginY={2}></Box> : <Graphics data={pointsGraphics} />}
    </Box>
  );
};

export default PointPage;
