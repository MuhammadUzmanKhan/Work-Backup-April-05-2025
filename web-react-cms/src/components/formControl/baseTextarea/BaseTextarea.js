import React from 'react';
import { Box, TextareaAutosize, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import './baseTextarea.scss';
import classnames from 'classnames';

export default function baseTextarea({ ...props }) {
  return (
    <Box className={classnames(['base-textarea', { error: props.error }])}>
      <label>
        <Typography
          style={{ fontWeight: 500 }}
          variant="body2"
          color={props.color || 'common.darkPurple'}>
          {props.label}
        </Typography>
      </label>
      <TextareaAutosize
        className="base-textarea--input"
        minRows={4}
        maxRows={4}
        resize="false"
        spellCheck={true}
        {...props}
      />
      <label className="base-textarea--error-text">
        <Typography variant="subtitle1" color="common.error">
          {props.helperText}
        </Typography>
      </label>
    </Box>
  )
}

baseTextarea.propTypes = {
  label: PropTypes.any,
  error: PropTypes.any
};
