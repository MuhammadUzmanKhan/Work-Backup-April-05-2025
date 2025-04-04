import React, { useState, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import NumberFormat from 'react-number-format';
import { Box, Grid, Typography } from '@mui/material';

import BaseTextField from '../baseTextField/BaseTextField';
import './codeInput.scss';
import classnames from 'classnames';
import palette from '../../../theme/palette';

const NumberFormatCustom = React.forwardRef(function NumberFormatCustom(props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value
          }
        });
      }}
      format="#"
      thousandSeparator
      isNumericString
      prefix=""
    />
  );
});

NumberFormatCustom.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default function CodeInput({ qty, onInput, error, onChange, name }) {
  const [values, setValues] = useState(
    Array.from(Array(qty)).reduce((acc, curr, index) => {
      acc[index] = null;
      return acc;
    }, {})
  );

  useLayoutEffect(() => {
    onInput(values);
  }, [values]);

  const handleButton = (event, index) => {
    if (/[0-9]/.test(event.key)) {
      setValues({
        ...values,
        [index]: event.key
      });

      setTimeout(() => {
        const form = event.target.form;
        const elementIndex = [...form].indexOf(event.target);
        form.elements[elementIndex + 2].focus();
      }, 100);
    }
    if (event.key.toLowerCase() === 'backspace') {
      setValues({
        ...values,
        [index]: null
      });
      setTimeout(() => {
        const form = event.target.form;
        const elementIndex = [...form].indexOf(event.target);
        if (elementIndex - 2 >= 0) {
          form.elements[elementIndex - 2].focus();
        }
      }, 200);
    }
  };

  return (
    <Box>
      <Grid container justifyContent="center">
        {Array.from(Array(qty)).map((x, index) => (
          <Grid item key={index} xs={2}>
            <BaseTextField
              className={classnames('code-input', {
                filled: values[index],
                error: Object.values(error).length
              })}
              onKeyDown={(event) => handleButton(event, index)}
              value={values[index]}
              onChange={() => onChange({ target: { name, value: Object.values(values).join('') } })}
              name={name}
              autoFocus={index === 0}
              InputProps={{
                inputComponent: NumberFormatCustom
              }}
            />
          </Grid>
        ))}
        {Object.values(error).length ? (
          <Typography
            sx={{ marginTop: '4px' }}
            color={palette.pink['500']}
            variant="caption"
            component="div"
            align="center"
            display="block"
            gutterBottom>
            {error.message}
          </Typography>
        ) : (
          <div />
        )}
      </Grid>
    </Box>
  );
}
CodeInput.defaultProps = {
  qty: 6,
  error: {},
  onInput: () => ({}),
  onChange: () => ({})
};

CodeInput.propTypes = {
  props: PropTypes.any,
  qty: PropTypes.any,
  onInput: PropTypes.func,
  onChange: PropTypes.func,
  error: PropTypes.any,
  name: PropTypes.string
};
