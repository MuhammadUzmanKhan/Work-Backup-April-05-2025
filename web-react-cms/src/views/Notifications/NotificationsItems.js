import React from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import NotificationItem from './NotificationItem';
import palette from 'theme/palette';

export default function NotificationsItems({ items, title }) {
  return (
    <Box>
      <Typography
        style={{ marginBottom: '8px' }}
        variant="subtitle1"
        color={palette.variables.greyLight}>
        {title}
      </Typography>
      {items.map((item, index) => (
        <NotificationItem key={index} item={item} />
      ))}
    </Box>
  );
}

NotificationsItems.propTypes = {
  title: PropTypes.string,
  items: PropTypes.array
};
