import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import React from 'react'
import { useTranslation } from 'react-i18next'
import palette from 'theme/palette'
import * as Yup from 'yup'
import { Formik } from 'formik'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { pushNotificationTypes } from 'utils/staticValues'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { createNotifications } from 'store/actions/notifications'
import { successToast } from 'utils'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'

function NotificationsCreateAdminPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  // const navigate = useNavigate()
  const dispatch = useDispatch()

  const initialState = {
    title: '',
    body: '',
    notificationType: 1,
    deeplinkId: ''
  }

  const NotificationsCreateSchema = Yup.object().shape({
    title: Yup.string().required(t('validation.required')),
    body: Yup.string().required(t('validation.required')),
    notificationType: Yup.string().required(t('validation.required'))
  })

  const handleSubmit = async (values, { resetForm }) => {
    const _notification = {
      params: {
        title: values.title,
        body: values.body,
        deeplinkId: values.deeplinkId,
        notificationType: pushNotificationTypes.find((n) => n.id === values.notificationType).value
      },
      cb: () => {
        successToast(`Notification has sent.`)
        if (+id === 0) {
          resetForm && resetForm()
          // navigate(`/dashboard`, { replace: true })
        }
      }
    }
    try {
      if (+id === 0) {
        await dispatch(createNotifications(_notification))
      }
    } catch (e) {
      console.error(e.message)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Add New Push Notification</Typography>
      </Box>
      <Formik
        initialValues={initialState}
        validationSchema={NotificationsCreateSchema}
        enableReinitialize
        onSubmit={handleSubmit}>
        {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <Box component="div">
              <BaseSelect
                name="type"
                label={t('fields.type')}
                items={pushNotificationTypes}
                initvalue={values.notificationType}
                sx={{ width: '100%', marginBottom: 0, ml: 0, mb: 3 }}
                onChange={(value) => {
                  setFieldValue('notificationtype', value)
                }}
                // disabled={lang === 'ar'}
              />
              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="title"
                label={t('fields.title')}
                name="title"
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                value={values.title}
                color={!errors.title && values.title ? 'success' : ''}
              />

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

              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="deeplinkId"
                label={t('fields.deeplinkId')}
                name="deeplinkId"
                onChange={handleChange}
                error={!!errors.deeplinkId}
                helperText={errors.deeplinkId}
                value={values.deeplinkId}
                color={!errors.deeplinkId && values.deeplinkId ? 'success' : ''}
              />
              {/* <DisablePermissions permission={'write:partner'} disable> */}
              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                element={t('send')}
                sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
              />
              {/* </DisablePermissions> */}
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  )
}

export default NotificationsCreateAdminPage
