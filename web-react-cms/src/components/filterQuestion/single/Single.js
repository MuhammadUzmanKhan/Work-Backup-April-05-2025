import { Grid } from '@mui/material'
import { Box } from '@mui/system'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import React from 'react'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { useTranslation } from 'react-i18next'

export default function FilterSingle({ single, handleChange, setFieldValue, filters }) {
  const { t } = useTranslation()

  return (
    <>
      {single?.answers?.map((item, _index) => (
        <Grid container alignItems="center" mt={3} key={_index}>
          <Grid item xs={5}>
            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="selectionTags2"
              name="selectionTags2"
              label={`${t('fields.selection')} ${_index + 1}`}
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `single.answers[${_index}].answer`,
                    value: e.target.value
                  }
                })
              }}
              value={item.answer}
            />
          </Grid>
          <Grid item xs={5} pl={2}>
            <BaseSelect
              name="selectionTags12"
              label={`${t('fields.tag')} ${_index + 1}`}
              items={filters.filter((filter) => !!filter.value)}
              initvalue={filters.find((filter) => filter.id === item.tag?.id)?.id}
              sx={{ width: '100%', marginBottom: '12px' }}
              onChange={(e) => setFieldValue(`single.answers[${_index}].tag.id`, e)}
            />
          </Grid>
          <Grid item xs={2} pl={2}>
            <Box
              style={{
                width: '70px',
                display: 'flex',
                justifyContent: 'right'
              }}>
              {single.answers.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue(`single.answers`, [
                      ...single.answers.filter((a, i) => i !== _index)
                    ])
                  }}
                  style={{
                    border: 0,
                    backgroundColor: '#fff',
                    borderRadius: '20px'
                  }}>
                  <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
                </button>
              )}
              {_index == single.answers.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue(`single.answers`, [...single.answers, { answer: '' }])
                  }}
                  style={{
                    border: 0,
                    backgroundColor: '#fff',
                    borderRadius: '20px'
                  }}>
                  <AddCircleOutlineOutlinedIcon sx={{ color: 'common.green' }} />
                </button>
              )}
            </Box>
          </Grid>
        </Grid>
      ))}
    </>
  )
}
