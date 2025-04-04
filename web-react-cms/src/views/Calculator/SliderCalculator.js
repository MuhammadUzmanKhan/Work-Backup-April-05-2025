import React, { useState } from 'react';
import { Typography, Grid } from '@mui/material';
import PropTypes from 'prop-types';

import FilterSlider from 'components/formControl/formCreator/FilterSlider';
import BaseInput from 'components/formControl/baseInput/BaseInput';
// import styles from './calculator.module.scss';

const SliderCalculator = ({ title, type, lower = 1, higher = 100, suffix, step, onChange }) => {
  const [value, setValue] = useState(1);

  const handleChange = (e) => {
    setValue(typeof e === 'object' ? e.target.value : e);
    onChange(typeof e === 'object' ? e.target.value : e);
  };

  return (
    <Grid item xs={12} mb={5}>
      <Grid container alignItems="end" justifyContent="center" mb={2}>
        <Typography mr={3} variant="bodyBig" fontSize={16}>
          {title}
          {type}
        </Typography>
        <BaseInput value={value} onChange={handleChange} type="number" /> {suffix}
      </Grid>

      <FilterSlider
        onChange={handleChange}
        lower={lower}
        higher={higher}
        suffix={suffix}
        value={value}
        step={step}
      />
    </Grid>
  );
};

export default SliderCalculator;

SliderCalculator.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string,
  lower: PropTypes.number,
  higher: PropTypes.number,
  suffix: PropTypes.string,
  step: PropTypes.number,
  onChange: PropTypes.func
};
