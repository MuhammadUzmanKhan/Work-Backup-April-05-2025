import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
// import BaseSelect from 'components/formControl/baseSelect/BaseSelect';
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { Formik } from 'formik'
import { useTranslation } from 'react-i18next'
import React from 'react'
import * as Yup from 'yup'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { editUser } from 'store/actions/user'
import { successToast } from 'utils'

function UserDetailsPage() {
  const { id } = useParams()
  const { state: user } = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const initialState = {
    name: user?.name || ''
  }

  const { t } = useTranslation()
  const ProductCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required'))
  })
  const handleSubmit = (values) => {
    dispatch(
      editUser({
        id,
        params: { name: values.name },
        cb: () => {
          successToast('User has Updated')
          navigate(-1)
        }
      })
    )
  }

  return (
    <Box>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {t('admin.editUser')}
          </Typography>
        </Grid>
      </Grid>
      <Box sx={{ mt: 5 }}>
        <Formik
          initialValues={initialState}
          validationSchema={ProductCreateSchema}
          onSubmit={handleSubmit}>
          {({ values, errors, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <BaseTextField
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                id="name"
                value={values.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                color={!errors.name && values.name ? 'success' : ''}
                label="Name"
                name="name"
              />

              {/* <InputLabel variant="outlined">Role</InputLabel>
              <BaseSelect
                name="role"
                items={fakeOptionsList}
                initvalue={fakeOptionsList[0].id}
                sx={{ width: '100%', marginBottom: 0, m: 0 }}
                onChange={(value) => setFieldValue('role', value)}
              /> */}

              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                element={t('save')}
                sx={{ display: 'block', maxWidth: 300, mt: 2 }}
              />
            </form>
          )}
        </Formik>
      </Box>
    </Box>
  )
}

export default UserDetailsPage
