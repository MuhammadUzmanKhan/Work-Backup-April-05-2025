import { Grid } from '@mui/material'
import { Box } from '@mui/system'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import React from 'react'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import { useTranslation } from 'react-i18next'
// import PropTypes from 'prop-types'

export default function FilterMultiple({ multiple, handleChange, setFieldValue }) {
  const { t } = useTranslation()
  return (
    <>
      {multiple?.answers?.map((item, _index) => (
        <Grid container alignItems="center" mt={3} key={_index}>
          <Grid item xs={10}>
            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="selection"
              label={`${t('fields.selection')} ${_index + 1}`}
              name={`selections[${_index}].title`}
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `multiple.answers[${_index}].answer`,
                    value: e.target.value
                  }
                })
              }}
              value={item.answer}
            />
          </Grid>
          <Grid item xs={2} pl={2}>
            <Box
              style={{
                width: '70px',
                display: 'flex',
                justifyContent: 'right'
              }}>
              {multiple?.answers?.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    // console.log([...multiple.answers.filter((a, i) => i !== _index)])
                    setFieldValue(`multiple.answers`, [
                      ...multiple.answers.filter((a, i) => i !== _index)
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
              {_index == multiple?.answers?.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setFieldValue(`multiple.answers`, [...multiple.answers, { answer: '' }])
                  }
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

// BaseButton.propTypes = {
//   props: PropTypes.object,
//   element: PropTypes.any,
//   customColor: PropTypes.string,
//   loading: PropTypes.bool
// }
