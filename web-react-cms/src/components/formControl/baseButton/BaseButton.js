import React from 'react';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import LoopIcon from '@mui/icons-material/Loop';
import './baseButton.scss';

export default function BaseButton({ customColor, loading, ...props }) {
  return (
    <Button
      style={{
        backgroundColor: customColor
      }}
      disabled={loading}
      {...props}>
      {loading ? <LoopIcon className="loop-icon" color="common.coolWhite" /> : props.element}
    </Button>
  );
}

BaseButton.propTypes = {
  props: PropTypes.object,
  element: PropTypes.any,
  customColor: PropTypes.string,
  loading: PropTypes.bool
};
