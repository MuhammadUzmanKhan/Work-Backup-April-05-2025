import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import palette from 'theme/palette'
import * as Yup from 'yup'
import { Formik } from 'formik'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { tailoredNotificationType } from 'utils/staticValues'
import { createNotificationsTailored, getNotificationsTailored } from 'store/actions/notifications'
import { successToast } from 'utils'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { LANGUAGE_ERROR } from 'utils/constants'
import PageLoading from 'components/PageLoading'

function TailoredNotificationCreatePage() {
  const { t } = useTranslation()
  const { type } = useParams()
  const notiType = tailoredNotificationType.find((t) => t.path === type)
  const dispatch = useDispatch()
  const [text, setText] = useState()
  const [loading, setLoading] = useState(true)

  const fetchTailored = async () => {
    const data = await dispatch(getNotificationsTailored({ id: notiType.id }))
    if (data.payload !== LANGUAGE_ERROR) {
      setText(data.payload.body)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTailored()
  }, [])

  const initialState = {
    body: text || ''
  }

  const NotificationsCreateSchema = Yup.object().shape({
    body: Yup.string().required(t('validation.required'))
  })

  const handleSubmit = async (values) => {
    const _notification = {
      params: {
        type: notiType.id,
        body: values.body
      },
      cb: () => {
        successToast(`Notification has created.`)
      }
    }
    try {
      await dispatch(createNotificationsTailored(_notification))
    } catch (e) {
      console.error(e.message)
    }
  }

  return (
    <Box>
      <PageLoading loading={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{`Update ${notiType.name} Notification`}</Typography>
      </Box>
      <Formik
        initialValues={initialState}
        validationSchema={NotificationsCreateSchema}
        enableReinitialize
        onSubmit={handleSubmit}>
        {({ values, errors, handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Box component="div">
              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="body"
                label={t('fields.body')}
                name="body"
                onChange={handleChange}
                error={!!errors.body}
                helperText={errors.body}
                value={values.body}
                color={!errors.body && values.body ? 'success' : ''}
              />

              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                element={t('save')}
                sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
              />
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  )
}

export default TailoredNotificationCreatePage
