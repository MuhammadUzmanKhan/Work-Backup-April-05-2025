import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg';

// import palette from 'theme/palette';
import styles from '../../Admin.module.scss';

const ProductCategoryItem = ({ item, onClick }) => {
  return (
    <Card onClick={onClick} className={styles.cardPartner}>
      <CardContent sx={{ padding: '16px 15px 8px' }}>
        <Grid container alignItems="center">
          <Grid item>
            {item.iconUrl ? (
              <img style={{ height: '55px', marginRight: '20px' }} src={item.iconUrl} alt="" />
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

export default ProductCategoryItem;

ProductCategoryItem.propTypes = {
  item: PropTypes.object,
  onClick: PropTypes.func
};
