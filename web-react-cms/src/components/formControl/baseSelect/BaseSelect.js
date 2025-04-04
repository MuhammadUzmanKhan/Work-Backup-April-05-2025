import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import './baseTextField.scss';
import { useTranslation } from 'react-i18next'

export default function BaseSelect({
  items = [],
  initvalue = 0,
  onChange,
  label = '',
  sx,
  labelStyle,
  variant = 'standard',
  setInitialValue,
  disabled = false,
  translation = false
}) {
  const [value, setValue] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    setInitialValue && setInitialValue(initvalue)
    initvalue && setValue(initvalue)
  }, [initvalue])

  const handleChange = (e) => {
    setValue(e.target.value)
    onChange && onChange(e.target.value)
  }

  return (
    <FormControl variant={variant} sx={{ m: 1, minWidth: 120, background: 'transparent', ...sx }}>
      {!!label && <InputLabel id="demo-simple-select-standard-label" sx={{...labelStyle}}>{label}</InputLabel>}
      <Select
        disabled={disabled}
        value={value}
        labelId="demo-simple-select-standard-label"
        id="demo-simple-select-standard"
        onChange={handleChange}
        sx={{ background: 'transparent !important' }}
        label="Age">
        {items.map((item, index) => (
          <MenuItem key={index} value={item.id}>
            {!translation ? item.title || item.name || item.value : t(`fields.${item.title}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

BaseSelect.propTypes = {
  items: PropTypes.array,
  initvalue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  label: PropTypes.string,
  sx: PropTypes.object,
  variant: PropTypes.string
};
