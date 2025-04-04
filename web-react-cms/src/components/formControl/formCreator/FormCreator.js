import React from 'react';
import { Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import FilterLabels from './FilterLabels';
import FilterSlider from './FilterSlider';
import FilterSelect from './FilterSelect';
import FilterCheckbox from './FilterCheckbox';

const Components = {
  filterLabels: FilterLabels,
  filterSlider: FilterSlider,
  filterSelect: FilterSelect,
  filterCheckbox: FilterCheckbox
};

export default function FormCreator({ items }) {
  return (
    <Grid container>
      {items.map((item, index) => (
        <Grid key={index} item xs={12} sx={{ marginBottom: '24px', ...item.sx }}>
          {(item.question || item.label) && item.component !== 'filterCheckbox' ? (
            <Grid item xs={12} sx={{ marginBottom: '8px' }}>
              <Typography variant="subtitle1" color="common.darkPurple">
                {item.question || item.label}
              </Typography>
            </Grid>
          ) : (
            <div />
          )}
          <Grid item xs={12}>
            {item.component ? (
              React.createElement(Components[item.component], {
                key: item.displayIndex,
                ...item
              })
            ) : (
              <div />
            )}
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
}

FormCreator.propTypes = {
  items: PropTypes.array
};
