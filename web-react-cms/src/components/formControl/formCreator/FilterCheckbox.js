import React from 'react';
import { Typography } from '@mui/material';
import palette from '../../../theme/palette';
import ValidationCheckbox from '../ValidationCheckbox';
import PropTypes from 'prop-types';

export default function FilterCheckbox({ onChange, value, label }) {
  return (
    <ValidationCheckbox
      onChange={(e) => onChange(e.target.checked)}
      value={value}
      defaultChecked={value}
      style={{ padding: 0, marginRight: '16px', marginLeft: '11px' }}
      label={
        <Typography component="h3" variant="body2" color={palette.variables.darkPurple}>
          {label}
        </Typography>
      }
    />
  );
}

FilterCheckbox.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any,
  label: PropTypes.any
};
