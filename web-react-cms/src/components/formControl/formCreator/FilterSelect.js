import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';

export default function FilterSelect({ value, items, onChange }) {
  return (
    <FormControl fullWidth>
      <Select value={value} defaultValue="" onChange={(e) => onChange(e.target.value)}>
        {[...items].map((item, index) => (
          <MenuItem key={index} value={item}>
            {item.answer}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

FilterSelect.propTypes = {
  value: PropTypes.any,
  items: PropTypes.array,
  onChange: PropTypes.func
};
