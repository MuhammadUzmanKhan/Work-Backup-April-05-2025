import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, LinearProgress, Rating, Typography } from '@mui/material';

import palette from 'theme/palette';
import ReviewContent from 'views/Product/ReviewContent';

export default function ProductReview() {
  const navigate = useNavigate();
  const rating = [
    {
      text: 'Exellent',
      color: 'green',
      value: 90
    },
    {
      text: 'Good',
      color: 'lightGreen',
      value: 65
    },
    {
      text: 'Average',
      color: 'orange',
      value: 45
    },
    {
      text: 'Below Average',
      color: 'pink',
      value: 30
    },
    {
      text: 'Poor',
      color: 'error',
      value: 15
    }
  ];
  return (
    <Box>
      <Grid container>
        <Grid xs={12} item sx={{ marginBottom: '24px' }}>
          <Typography component="h3" variant="h3" color="common.darkPurple">
            NBB Signature Card
          </Typography>
        </Grid>
        <Grid xs={12} item sx={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <Grid xs={6} item sx={{ maxWidth: 'fit-content', marginRight: '20px' }}>
            <img
              style={{
                width: '125px',
                height: '84px'
              }}
              src=""
              alt=""
            />
          </Grid>
          <Grid xs={6} item>
            <Grid item sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Rating
                sx={{ marginRight: '10px' }}
                name="simple-controlled"
                value={4.5}
                precision={0.5}
              />
              <Typography variant="ratingText" color="common.darkPurple">
                4.5
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="common.darkPurple">
                24 reviews
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '30px' }}>
          <Box>
            {rating.map((rate) => (
              <Grid
                container
                key={rate.value}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '198px',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                <Grid item xs={3}>
                  <Typography variant="caption" color="common.black">
                    {rate.text}
                  </Typography>
                </Grid>
                <Grid item xs={9}>
                  <LinearProgress
                    variant="determinate"
                    color={rate.color}
                    value={rate.value}
                    sx={{
                      borderRadius: '3px',
                      background: palette.variables.coolWhite,
                      width: '100%'
                    }}
                  />
                </Grid>
              </Grid>
            ))}
          </Box>
        </Grid>
        <ReviewContent onClick={() => navigate('/review/slug')} />
      </Grid>
    </Box>
  );
}
