import React from 'react';
import Input from '@mui/material/Input';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './baseInput.scss';

export default function BaseInput({ ...props }) {
  return (
    <Box className={classnames([{ rounded: props.rounded }])}>
      <label>
        <Typography variant="body2" color="common.darkPurple">
          {props.label}
        </Typography>
      </label>
      <Input {...props} spellCheck={true} />
      <label className="base-input--error-text">
        <Typography variant="subtitle1" color="common.error">
          {props.helperText}
        </Typography>
      </label>
    </Box>
  )
}

BaseInput.propTypes = {
  label: PropTypes.any,
  rounded: PropTypes.any,
  helperText: PropTypes.any
};
