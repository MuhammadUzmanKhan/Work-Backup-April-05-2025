import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

import palette from '../../../theme/palette';
import './phoneNumber.scss';

export default function PhoneNumber({ helperText, ...props }) {
  const [value, setValue] = useState();
  const [didLoad, setDidLoad] = useState(false);
  const onChange = (e) => {
    formatPhoneNumberIntl(e);
    setValue(e);
    props.onChange({ target: { name: props.name, value: e } });
  };
  useEffect(() => {
    if (props.value && !didLoad) {
      setValue(props.value);
      setDidLoad(true);
    }
  }, [props.value]);
  console.log('type class', typeof props.className);

  return (
    <Box sx={{ ...props.sx, position: 'relative' }}>
      <Typography
        sx={{ marginBottom: '2px' }}
        color={palette.white['200']}
        variant="subtitle1"
        align="left"
        display="block"
        gutterBottom>
        {props.label}
      </Typography>
      <PhoneInput
        className={{ error: props.error, [props.className]: props.className }}
        defaultCountry="BH"
        placeholder={props.placeholder}
        value={value}
        onChange={onChange}
        limitMaxLength={true}
      />
      <Box style={{ position: 'absolute', right: 0, top: '38px' }}>
        {props.InputProps.endAdornment}
      </Box>
      {helperText ? (
        <Typography variant="caption" color="common.error">
          {helperText}
        </Typography>
      ) : (
        <div />
      )}
    </Box>
  );
}

PhoneNumber.defaultProps = {
  placeholder: '',
  InputProps: {},
  className: ''
};

PhoneNumber.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  sx: PropTypes.object,
  onChange: PropTypes.func,
  value: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.bool,
  InputProps: PropTypes.object,
  className: PropTypes.any
};
