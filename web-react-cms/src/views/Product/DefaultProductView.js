import React from 'react';
import { Card, CardActions, CardContent, Grid, Rating, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import styles from 'pages/productsSection/products/cards.module.scss';
import { ReactComponent as CaretGreyRightIcon } from 'assets/icons/caret-grey-right.svg';
import palette from 'theme/palette';

export default function DefaultProductView({ item, onClick }) {
  return (
    <Card className={styles.cardContainer} onClick={onClick}>
      <CardContent sx={{ padding: '16px 15px 8px' }}>
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              justifyContent: 'space-between'
            }}>
            <Grid item>
              <Grid container>
                <img
                  style={{ width: '80px', height: '54px', marginRight: '18px' }}
                  src={item.imageUrl}
                  alt=""
                />
                <Grid item sx={{ display: 'flex', alignItems: 'center', marginRight: '38px' }}>
                  <Rating
                    sx={{ marginRight: '10px' }}
                    name="simple-controlled"
                    value={item?.productReview?.rating}
                    precision={0.5}
                    readOnly
                  />
                  <Typography variant="body2" color="common.darkPurple">
                    {item?.productReview?.rating}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <CaretGreyRightIcon className={styles.caretRight} />
          </Grid>
          <Grid item xs={12} sx={{ marginBottom: '8px' }}>
            <Typography variant="bodyBig" color="common.darkPurple">
              {item.name}
            </Typography>
          </Grid>
          <Grid xs={12} item sx={{ display: 'flex', alignItems: 'center' }}>
            {item.previewFields.map((field) => (
              <Grid key={field.label} item xs={6} sx={{ display: 'flex', align: 'center' }}>
                <Typography
                  sx={{
                    marginRight: '5px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  variant="caption"
                  component="h3"
                  color={palette.white['400']}>
                  {field.label}:
                </Typography>
                <Typography
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  variant="title"
                  component="h4"
                  color="common.darkPurple">
                  {field.value}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </CardContent>
      {item.previewText ? (
        <CardActions
          sx={{
            padding: '12px 16px 12px 15px',
            background: palette.variables.green
          }}>
          <Typography variant="caption" color="common.white">
            {item.previewText}
          </Typography>
        </CardActions>
      ) : (
        <div />
      )}
    </Card>
  );
}

DefaultProductView.propTypes = {
  onClick: () => ({})
};

DefaultProductView.propTypes = {
  item: PropTypes.object,
  onClick: PropTypes.func
};
