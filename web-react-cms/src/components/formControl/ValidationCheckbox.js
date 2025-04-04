import React from 'react';
import PropTypes from 'prop-types';
import { FormControlLabel, Checkbox, Typography } from '@mui/material';
import palette from '../../theme/palette';

class ValidationCheckbox extends React.Component {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { label, textHelper, defaultChecked, error, ...rest } = this.props;
    return (
      <div>
        <FormControlLabel
          value="start"
          control={
            <Checkbox
              checked={defaultChecked}
              color={!error ? 'coolWhite' : 'error'}
              sx={{ paddingTop: 0 }}
              {...rest}
            />
          }
          label={label}
          labelPlacement="end"
        />
        {this.errorText()}
      </div>
    );
  }

  errorText() {
    const { textHelper, error } = this.props;

    if (!error) {
      return null;
    }

    return (
      <Typography
        color={palette.pink['500']}
        variant="caption"
        align="left"
        display="block"
        gutterBottom>
        {textHelper}
      </Typography>
    );
  }
}

export default ValidationCheckbox;

ValidationCheckbox.propTypes = {
  textHelper: PropTypes.string,
  label: PropTypes.any,
  validators: PropTypes.any,
  requiredError: PropTypes.any,
  value: PropTypes.any,
  error: PropTypes.any,
  defaultChecked: PropTypes.any
};
