import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg';

// import palette from 'theme/palette';
import styles from '../../Admin.module.scss';

const PartnerItem = ({ item, onClick }) => {
  return (
    <Card onClick={onClick} className={styles.cardPartner}>
      <CardContent sx={{ padding: '16px 15px 8px' }}>
        <Grid container alignItems="center">
          <Grid item>
            {item.logoUrl ? (
              <img
                style={{ width: '80px', height: '54px', marginRight: '18px' }}
                src={item.logoUrl}
                alt=""
              />
            ) : (
              <Box ml={1} mr={5}>
                <Wealth />
              </Box>
            )}
          </Grid>

          <Grid item ml={2}>
            <Typography variant="bodyBig" color="common.darkPurple">
              {item.name}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
};

export default PartnerItem;

PartnerItem.propTypes = {
  item: PropTypes.object,
  onClick: PropTypes.func
};
