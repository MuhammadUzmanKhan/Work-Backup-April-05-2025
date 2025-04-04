import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { NumToString, StringToNum } from 'utils/functions'

export default function FilterRange({ ranges: item, handleChange, filters }) {
  const { t } = useTranslation()

  return (
    <>
      <BaseTextField
        InputLabelProps={{ required: false }}
        sx={{ marginBottom: '24px' }}
        margin="normal"
        fullWidth
        id="minimumValue"
        label={t('fields.minimumValue')}
        name="minimumValue"
        onChange={(e) => {
          handleChange({
            ...e,
            target: {
              name: `ranges.lower`,
              // value: isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value)
              value: StringToNum(e.target.value) ? StringToNum(e.target.value) : '0'
            }
          })
        }}
        value={NumToString(item.lower)}
      />
      <BaseTextField
        InputLabelProps={{ required: false }}
        sx={{ marginBottom: '24px' }}
        margin="normal"
        fullWidth
        id="maximumValue"
        label={t('fields.maximumValue')}
        name="maximumValue"
        onChange={(e) => {
          handleChange({
            ...e,
            target: {
              name: `ranges.higher`,
              value: StringToNum(e.target.value) ? StringToNum(e.target.value) : '0'
            }
          })
        }}
        value={NumToString(item.higher)}
      />
      <ToggleButtonGroup
        sx={{ flexWrap: 'wrap', gap: '7px' }}
        color="primary"
        value={item.tags.map((tag) => tag.id)}
        onChange={(event, value) => {
          handleChange({
            ...event,
            target: {
              name: `ranges.tags`,
              value: filters.filter((f) => !!value.find((id) => id == f.id))
            }
          })
        }}>
        {filters
          .filter((filter) => !!filter.valueSuffix)
          ?.map((_filter) => (
            <ToggleButton
              sx={{
                display: 'flex',
                gap: '8px',
                overflow: 'auto',
                marginBottom: '15px',
                flexWrap: 'nowrap',
                width: 'max-content'
              }}
              selected={item.tags.map((tag) => tag.id).includes(_filter.id)}
              key={_filter.id}
              value={_filter.id}>
              {_filter.valueSuffix}
            </ToggleButton>
          ))}
      </ToggleButtonGroup>

      <br />
    </>
  )
}
