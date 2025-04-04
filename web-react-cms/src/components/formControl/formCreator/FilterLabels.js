import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import PropTypes from 'prop-types';

export default function FilterLabels({ items, value, handleChange, sx = {}, buttonSx = {} }) {
  return (
    <ToggleButtonGroup
      sx={{ flexWrap: 'wrap', gap: '7px', ...sx }}
      color="primary"
      value={value}
      onChange={handleChange}>
      {items.map((item, index) => (
        <ToggleButton sx={{ ...buttonSx }} key={index} value={item}>
          {item.answer}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

FilterLabels.propTypes = {
  items: PropTypes.array,
  value: PropTypes.any,
  handleChange: PropTypes.func,
  sx: PropTypes.object,
  buttonSx: PropTypes.object
};
