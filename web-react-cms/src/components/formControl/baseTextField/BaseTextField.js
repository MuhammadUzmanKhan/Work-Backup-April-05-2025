import TextField from '@mui/material/TextField';
import * as React from 'react';
import PropTypes from 'prop-types';
import './baseTextField.scss';
import classNames from 'classnames';

export default function BaseTextField({ rounded, ...props }) {
  return <TextField className={classNames([{ rounded: rounded }])} {...props} spellCheck={true} />
}

BaseTextField.propTypes = {
  props: PropTypes.object,
  rounded: PropTypes.bool
};
