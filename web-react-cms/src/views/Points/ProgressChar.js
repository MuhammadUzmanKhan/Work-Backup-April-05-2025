import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

import palette from 'theme/palette';
import styles from 'pages/pointsPages/points.module.scss';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

const ProgressChar = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box className={styles.progressBarWrap}>
      <Box>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          indicatorColor="transparent"
          variant="scrollable"
          scrollButtons={true}
          visibleScrollbar={false}>
          <Tab
            label={
              <Typography variant="body1" fontSize={16} color={palette.variables.greyLight}>
                7 April - 14 April
              </Typography>
            }
            {...a11yProps(0)}
          />
          <Tab
            label={
              <Typography variant="body1" fontSize={16} color={palette.variables.greyLight}>
                15 April - 21 April
              </Typography>
            }
            {...a11yProps(1)}
          />
          <Tab
            label={
              <Typography variant="body1" fontSize={16} color={palette.variables.greyLight}>
                21 April - 28 April
              </Typography>
            }
            {...a11yProps(2)}
          />
        </Tabs>
      </Box>
    </Box>
  );
};

export default ProgressChar;
