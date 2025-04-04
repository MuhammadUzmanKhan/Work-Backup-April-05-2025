import { Grid, InputLabel, Typography } from '@mui/material';
import { Box } from '@mui/system';
import BaseSelect from 'components/formControl/baseSelect/BaseSelect';
import BaseTextField from 'components/formControl/baseTextField/BaseTextField';
import { ErrorMessage, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import React, { useEffect } from 'react';
import * as Yup from 'yup';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import palette from 'theme/palette';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPartners } from 'store/actions/partners';
import { addUser } from 'store/actions/user';
import { useNavigate } from 'react-router-dom';
import { roles } from 'utils/staticValues'

function UserCreatePage() {
  const { partners } = useSelector((state) => state.partners)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const initialState = {
    name: '',
    email: '',
    provider: '',
    role: ''
  }

  useEffect(() => {
    dispatch(fetchPartners())
  }, [])

  const { t } = useTranslation()
  const ProductCreateSchema = Yup.object().shape({
    email: Yup.string().email('Invalid Email').required(t('validation.required')),
    name: Yup.string().required(t('validation.required')),
    role: Yup.string().required(t('validation.required')),
    provider: Yup.string().when('role', {
      is: (r) => /^(EXTERNAL_EDITOR|EXTERNAL_PUBLISHER)$/.test(r),
      then: Yup.string().required('Please link a provider')
    })
  })

  const handleSubmit = (values) => {
    const body = {
      email: values.email,
      role: values.role,
      name: values.name
    }

    if (body.role === 'EXTERNAL_EDITOR' || body.role === 'EXTERNAL_PUBLISHER') {
      body.providerId = values.provider
    }

    dispatch(
      addUser({
        params: body,
        cb: () => {
          navigate('/users')
        }
      })
    )
  }

  return (
    <Box>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {t('admin.addUser')}
          </Typography>
        </Grid>
      </Grid>
      <Box sx={{ mt: 5 }}>
        <Formik
          initialValues={initialState}
          validationSchema={ProductCreateSchema}
          onSubmit={handleSubmit}>
          {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
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
                label={t('fields.name')}
                name="name"
              />
              <BaseTextField
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                id="email"
                value={values.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                color={!errors.email && values.email ? 'success' : ''}
                label={t('fields.email')}
                name="email"
              />

              <InputLabel variant="outlined"> {t('fields.role')}</InputLabel>
              <BaseSelect
                name="role"
                items={roles}
                initvalue={values.role}
                sx={{ width: '100%', marginBottom: 0, m: 0 }}
                onChange={(value) => setFieldValue('role', value)}
                translation={true}
              />
              <ErrorMessage
                component="div"
                name="role"
                style={{ color: 'red', marginTop: '0.25rem' }}
              />

              {values.role === 'EXTERNAL_EDITOR' || values.role === 'EXTERNAL_PUBLISHER' ? (
                <>
                  <InputLabel variant="outlined" style={{ marginTop: 40 }}>
                    {t('fields.provider')}
                  </InputLabel>
                  <BaseSelect
                    name="provider"
                    items={
                      partners
                        ? partners.map((partner) => ({ id: partner.id, title: partner.name }))
                        : []
                    }
                    initvalue={values.provider}
                    sx={{ width: '100%', m: 0 }}
                    onChange={(value) => setFieldValue('provider', value)}
                  />
                  <ErrorMessage
                    component="div"
                    name="provider"
                    style={{ color: 'red', marginTop: '0.25rem' }}
                  />
                </>
              ) : null}

              {/* <BaseTextField
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                id="providor"
                label="Providor"
                name="providor"
                value={values.provider}
                onChange={handleChange}
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

export default UserCreatePage;
