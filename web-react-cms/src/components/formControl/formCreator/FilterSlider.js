import React from 'react';
import { Box, Slider, Stack } from '@mui/material';
import PropTypes from 'prop-types';

export default function FilterSlider({ suffix, value, onChange, lower, higher, step = 10 }) {
  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  function valuetext(value) {
    return `${value} ${suffix || ''}`;
  }

  return (
    <Stack sx={{ position: 'relative' }} direction="row" alignItems="center">
      <Box sx={{ position: 'absolute', bottom: '-12px', left: '0' }}>{valuetext(lower)}</Box>
      <Slider
        defaultValue={lower}
        value={value}
        onChange={handleChange}
        valueLabelDisplay="on"
        max={higher}
        min={lower}
        step={step}
      />
      <Box sx={{ position: 'absolute', bottom: '-12px', right: '0' }}>{valuetext(higher)}</Box>
    </Stack>
  );
}

FilterSlider.propTypes = {
  suffix: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  defaultValue: PropTypes.array,
  step: PropTypes.number,
  higher: PropTypes.number,
  lower: PropTypes.number
};
