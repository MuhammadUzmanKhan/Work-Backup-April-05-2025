import React from 'react';
import PropTypes from 'prop-types';
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import styles from './dashboardProducts.module.scss';

export default function DashboardProduct({ item }) {
  return (
    <ListItemButton
      sx={{ marginBottom: 0 }}
      className={styles.listItemButton}
      onClick={item.onClick}>
      <ListItemIcon className={styles.listItemIcon}>
        <img src={item.iconUrl} srcSet={item.iconUrl} alt="" loading="lazy" />
      </ListItemIcon>
      <ListItemText
        className={styles.listItemText}
        primary={
          <Typography color="#29173B" variant="caption">
            {item.name}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

DashboardProduct.propTypes = {
  item: PropTypes.object
};
