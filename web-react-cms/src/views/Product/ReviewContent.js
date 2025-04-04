import React from 'react';
import { Divider, Grid, Rating, Typography } from '@mui/material';
import { ReactComponent as EditIcon } from '../../assets/icons/edit-icon.svg';
import { ReactComponent as AvatarIcon } from '../../assets/avatars/avatar1.svg';
import palette from '../../theme/palette';
import PropTypes from 'prop-types';

export default function ReviewContent({ onClick }) {
  return (
    <Grid container>
      <Grid
        onClick={onClick}
        item
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '17px'
        }}>
        <EditIcon />
        <Typography style={{ marginLeft: '8px' }} variant="button" color="common.lightGreen">
          Write a review
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ flexDirection: 'column' }}>
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
          <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
            <AvatarIcon style={{ marginRight: '8px' }} />
            <Typography color="common.darkPurple" variant="subtitle1">
              Ali Ahmed
            </Typography>
          </Grid>
          <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="common.lightGreen" variant="subtitle1" sx={{ marginRight: '8px' }}>
              Edit
            </Typography>
            <EditIcon style={{ width: '18px', height: '18px' }} />
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid item sx={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Rating
              sx={{ marginRight: '10px' }}
              name="simple-controlled"
              value={4.5}
              precision={0.5}
            />
            <Typography variant="body2" color="common.darkPurple">
              4.5
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ marginBottom: '12px' }}>
            <Typography variant="body2" color="common.darkPurple">
              Such a great product! Would recommend
            </Typography>
          </Grid>
          <Divider sx={{ borderColor: palette.variables.coolWhite, marginBottom: '16px' }} />
        </Grid>
      </Grid>
    </Grid>
  );
}

ReviewContent.defaultProps = {
  onClick: () => ({})
};

ReviewContent.propTypes = {
  onClick: PropTypes.func
};
