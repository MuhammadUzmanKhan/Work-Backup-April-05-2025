import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Checkbox,
  FormGroup,
  FormControlLabel,
  ToggleButton,
  InputLabel
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Formik } from 'formik'
import * as Yup from 'yup'

import BaseButton from 'components/formControl/baseButton/BaseButton'
import BaseTextarea from 'components/formControl/baseTextarea/BaseTextarea'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import ErrorNotification from 'components/ErrorNotification'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import BaseInput from 'components/formControl/baseInput/BaseInput'


import palette from 'theme/palette'
import {
  deleteCategoryById,
  editCategoryById,
  fetchCategoryById,
  fetchCategoryLinksById,
  setProductCategorys
} from 'store/actions/products'
import { setImage } from 'store/actions/image'
import { setStateProductValue } from 'store/reducers/products'
import { failureToast, successToast } from 'utils'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import PageLoading from 'components/PageLoading'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import CreatedByModal from 'components/modal/CreatedByModal'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LANGUAGE_ERROR, LINKED_ENTITIES_TYPES } from 'utils/constants'
import BaseModel from 'components/modal/BaseModal'
import { getExpertById } from 'store/actions/experts'

const ProductCategoryDetailsAdminPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const lang = useSelector(selectLanguage)
  const [loading, setLoading] = useState(false)
  const { id } = useParams()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const { selectedCategory } = useSelector((state) => state.products)
  const [error, setError] = useState()

  const [delLinksOpen, setDelLinksOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const anchorRef = useRef(null)

  useEffect(() => {
    return async () => {
      await dispatch(setLanguage('en'))
      await dispatch(setStateProductValue({ type: 'selectedCategory', data: { tags: [] } }))
    }
  }, [])
  useEffect(async () => {
    if (+id !== 0) {
      setLoading(true)
      // get product category by id
      const data = await dispatch(fetchCategoryById({ id }))

      if (data.payload === 'Request failed with status code 412' && lang == 'ar') {
        setError('No arabic data found')
        setLoading(false)
        return
      }
      dispatch(setStateProductValue({ type: 'selectedCategory', data: data.payload }))
      setLoading(false)
    } else {
      dispatch(setStateProductValue({ type: 'selectedCategory', data: {} }))
    }
  }, [lang])

  const main_fields = [...Array(6).keys()].map(() => {
    return { description: '', label: '', preview: false }
  })
  const initialState = {
    name: error && lang === 'ar' ? '' : selectedCategory.name || '',
    logo: selectedCategory.iconUrl || '',
    mainFields:
      id != 0
        ? error && lang === 'ar'
          ? main_fields
          : selectedCategory?.mainFields || []
        : main_fields,
    publish: selectedCategory.publish || false,
    sequence: selectedCategory?.sequence
  }
  const ProductCategoryCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    logo: Yup.string().required(t('validation.required')),
    mainFields: Yup.array().of(
      Yup.object().shape({
        label: Yup.string().required(t('validation.required')),
        description: Yup.string().required(t('validation.required'))
      })
    )
  })

  const handleSubmit = async (values) => {
    if (+id === 0) {
      let iconUrl = await dispatch(setImage(values.logo))
      const category = {
        name: values.name,
        mainFields: values.mainFields,
        iconUrl: iconUrl.payload.url,
        filter: {},
        sequence: values.sequence ? values.sequence : null
      }
      dispatch(
        setProductCategorys({
          params: category,
          cb: async (res) => {
            successToast('Product category has created')
            const data = await dispatch(fetchCategoryById({ id: res.id }))
            dispatch(setStateProductValue({ type: 'selectedCategory', data: data.payload }))
            navigate(`/product-category/${res.id}`, { replace: true })
          }
        })
      )
    } else {
      let iconUrl = values.logo
      if (typeof values.logo == 'object') {
        let img = await dispatch(setImage(values.logo))
        iconUrl = img.payload.url
      }
      const category = {
        name: values.name,
        mainFields: values.mainFields,
        iconUrl: iconUrl,
        filter: {},
        sequence: values.sequence ? values.sequence : null
      }

      let obj = {
        id: lang === 'en' ? id : `${id}/i18n_data`,
        params: category,
        cb: async () => {
          successToast('Product category has updated')
          const data = await dispatch(fetchCategoryById({ id }))
          dispatch(setStateProductValue({ type: 'selectedCategory', data: data.payload }))
        }
      }

      dispatch(editCategoryById(obj))
    }
  }

  const checkLink = async (id, reload = false) => {
    setLoading(true)
    const data = await dispatch(fetchCategoryLinksById({ id: `${id}/entity_links` }))
    if (data.payload) {
      if (!data.payload.length && !reload) {
        setDelLinksOpen(false)
        setDelOpen(true)
      } else {
        setEntityLinks([...data.payload])
        setDelLinksOpen(true)
      }
    }
    setLoading(false)
  }
  const goToFunction = async (_id, type) => {
    //
    if (type === LINKED_ENTITIES_TYPES.PRODUCT_TAG) {
      anchorRef.current.href = `#/tags/product/${id}`
    } else if (type === LINKED_ENTITIES_TYPES.EXPERT) {
      const lang = localStorage.getItem('language')
      const expert = await dispatch(getExpertById({ id: _id }))

      if (lang === 'en' && expert.payload === LANGUAGE_ERROR) {
        anchorRef.current.href = `#/experts/${_id}?lang=ar`
      } else if (lang === 'ar' && expert.payload !== LANGUAGE_ERROR) {
        anchorRef.current.href = `#/experts/${_id}?lang=ar`
      } else if (lang === 'ar' && expert.payload === LANGUAGE_ERROR) {
        anchorRef.current.href = `#/experts/${_id}?lang=en`
      } else {
        anchorRef.current.href = `#/experts/${_id}`
      }

      //
    } else if (type === LINKED_ENTITIES_TYPES.PROVIDER) {
      anchorRef.current.href = `#/partners/create/${_id}`
    } else if (type === LINKED_ENTITIES_TYPES.PRODUCT) {
      anchorRef.current.href = `#/products/${_id}`
    }
    anchorRef.current.click()
  }

  const handleDeletion = () => {
    setLoading(true)
    setDelOpen(false)
    dispatch(
      deleteCategoryById({
        id,
        cb: () => {
          successToast('Product category has successfully deleted.')
          navigate(-1, { replace: true })
          setLoading(false)
        },
        cbf: () => setLoading(false)
      })
    )
  }

  return (
    <Grid item md={6} xs={12} p={3} sx={{ maxWidth: 900, margin: '0 auto' }}>
      {loading ? (
        <PageLoading loading={loading} />
      ) : (
        <Formik
          initialValues={initialState}
          validationSchema={ProductCategoryCreateSchema}
          enableReinitialize
          onSubmit={handleSubmit}>
          {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h3" mb={3}>
                  {id !== '0' && selectedCategory?.name
                    ? selectedCategory.name
                    : t('admin.addNewProductCategory')}
                </Typography>

                {id !== '0' && (
                  <Box display={'flex'} flexDirection="column">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DisablePermissions disable={true} permission={'publish:category'}>
                        <ToggleButtonCustom
                          text={'Publish'}
                          disabled={
                            selectedCategory?.metaInfo?.version ===
                            selectedCategory?.metaInfo?.publishedVersion
                          }
                          onChange={() => {
                            dispatch(
                              editCategoryById({
                                id: `${id}/publish`,
                                cb: async () => {
                                  const data = await dispatch(fetchCategoryById({ id }))
                                  dispatch(
                                    setStateProductValue({
                                      type: 'selectedCategory',
                                      data: data.payload
                                    })
                                  )

                                  successToast('Category has been published.')
                                }
                              })
                            )
                          }}></ToggleButtonCustom>
                      </DisablePermissions>
                      <ToggleButton
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          overflow: 'auto',
                          marginRight: '10px',
                          flexWrap: 'nowrap',
                          width: 'max-content'
                        }}
                        selected={lang !== 'en'}
                        onChange={() => {
                          dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                        }}
                        value={'check'}>
                        {lang !== 'en' ? 'English' : 'Arabic'}
                      </ToggleButton>
                      {(selectedCategory?.metaInfo?.publishedVersion ||
                        selectedCategory?.metaInfo?.lastModifiedBy) && (
                        <>
                          <ToggleButton
                            sx={{
                              display: 'flex',
                              gap: '8px',
                              overflow: 'auto',
                              marginLeft: '3px',
                              marginRight: '5px',
                              flexWrap: 'nowrap',
                              width: 'max-content'
                            }}
                            onChange={() => setOpen(true)}>
                            {'Created By'}
                          </ToggleButton>
                          {open && (
                            <CreatedByModal
                              open={open}
                              handleClose={() => setOpen(false)}
                              info={selectedCategory?.metaInfo}
                            />
                          )}
                        </>
                      )}
                      <Box>
                        <DeleteForeverIcon color="error" onClick={() => checkLink(id)} />
                      </Box>
                    </Box>
                    <Box display={'flex'} justifyContent={'flex-end'} mt={1}>
                      <>
                        {(selectedCategory?.metaInfo?.version ||
                          selectedCategory?.metaInfo?.version === 0) && (
                          <Typography
                            color={palette.variables.orange}
                            variant="caption"
                            style={{ cursor: 'pointer', marginRight: '10px' }}
                            onClick={() => navigate(`/product-category/published/${id}/current`)}>
                            {`(Current ${selectedCategory?.metaInfo?.version})`}
                          </Typography>
                        )}
                        {(selectedCategory?.metaInfo?.publishedVersion ||
                          selectedCategory?.metaInfo?.publishedVersion === 0) && (
                          <Typography
                            color={palette.variables.orange}
                            variant="caption"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/product-category/published/${id}/published`)}>
                            {`(Published ${selectedCategory?.metaInfo?.publishedVersion})`}
                          </Typography>
                        )}
                      </>
                    </Box>
                  </Box>
                )}
              </Box>

              {!errors && <ErrorNotification sx={{ marginBottom: '19px' }} errorText={'errors'} />}

              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="name"
                label={t('fields.name')}
                name="name"
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />

              <Box sx={{ display: 'flex' }}>
                {+id !== 0 && (
                  <img
                    style={{ height: '55px', marginRight: '20px' }}
                    src={selectedCategory.iconUrl}
                    alt=""
                  />
                )}
                <BaseTextField
                  label={`${t('fields.logo')}   (.jpeg, .jpg, .png)`}
                  InputLabelProps={{ required: false }}
                  margin="normal"
                  fullWidth
                  name="logo"
                  id="logo"
                  type="file"
                  file={values.logo}
                  error={!!errors.logo}
                  onChange={(e) => setFieldValue('logo', e.currentTarget.files[0])}
                  color={!errors.logo && values.logo ? 'success' : ''}
                  sx={{ marginBottom: '30px' }}
                  disabled={lang === 'ar'}
                />
              </Box>

                <InputLabel variant="outlined" style={{ marginTop: 10 }}>
                  Sequence
                </InputLabel>
                <BaseInput
                  inputProps={{ style: { display: 'block', with: '100%', paddingLeft: 10 }, min: 0 }}
                  onChange={handleChange}
                  value={values.sequence}
                  name="sequence"
                  placeholder="Sequence"
                  fullWidth
                  type="number"
                  error={!!errors.sequence}
                  helperText={errors.sequence}
                  disabled={lang === 'ar'}
                  color={!errors.sequence && values.sequence ? 'success' : ''}
                  style={{ marginBottom: 20 }}
                />

              {[...Array(6).keys()]?.map((_, index) => (
                <>
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    sx={{ marginBottom: '24px' }}
                    margin="normal"
                    fullWidth
                    id={`name_${index}`}
                    label={`${t('fields.field')} ${index + 1} ${t('fields.name')}`}
                    name={`name_${index}`}
                    onChange={(e) => {
                      const field = { ...values.mainFields[index], label: e.target.value }
                      let fields = [...values.mainFields]
                      fields[index] = field
                      setFieldValue('mainFields', fields)
                    }}
                    error={!!errors.mainFields?.[index]?.label}
                    helperText={errors.mainFields?.[index]?.label}
                    value={values.mainFields[index]?.label}
                    // color={
                    //   !errors.mainFields?.[index]?.label && values.mainFields?.[index]?.label
                    //     ? 'success'
                    //     : ''
                    // }
                  />
                  <BaseTextarea
                    style={{ marginBottom: '16px' }}
                    // color="common.greyLight"
                    label={`${t('fields.field')} ${index + 1} ${t('fields.description')}`}
                    id="text"
                    name={`description_${index}`}
                    onChange={(e) => {
                      const field = { ...values.mainFields[index], description: e.target.value }
                      let fields = [...values.mainFields]
                      fields[index] = field
                      setFieldValue('mainFields', fields)
                    }}
                    value={values.mainFields[index]?.description}
                    placeholder="Add description"
                    error={!!errors.mainFields?.[index]?.description}
                    helperText={errors.mainFields?.[index]?.description}
                    // color={
                    //   !errors.mainFields?.[index]?.description &&
                    //   values.mainFields?.[index]?.description
                    //     ? 'common.greyLight'
                    //     : ''
                    // }
                  />
                  {values.mainFields.length > 1 && (
                    <FormGroup
                      onClick={() =>
                        !values.mainFields[index]?.preview &&
                        values.mainFields.filter((m) => m.preview).length >= 2
                          ? failureToast('You can only select two preview fields at a time.')
                          : null
                      }>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.mainFields[index]?.preview}
                            onChange={(e) => {
                              const field = {
                                ...values.mainFields[index],
                                preview: e.target.checked
                              }
                              let fields = [...values.mainFields]
                              fields[index] = field
                              setFieldValue('mainFields', fields)
                            }}
                            disabled={
                              !values.mainFields[index]?.preview &&
                              values.mainFields.filter((m) => m.preview).length >= 2
                            }
                          />
                        }
                        // label={t('fields.usePreviewField')}
                        label={
                          <Typography
                            style={{ fontWeight: 500, fontSize: 14 }}
                            variant="body2"
                            color={'common.darkPurple'}>
                            {t('fields.usePreviewField')}
                          </Typography>
                        }
                      />
                    </FormGroup>
                  )}
                </>
              ))}
              <DisablePermissions permission={'write:category'} disable>
                <BaseButton
                  customColor={palette.variables.darkPurple}
                  type="submit"
                  fullWidth
                  variant="contained"
                  element={t('save')}
                  sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
                />
              </DisablePermissions>
            </form>
          )}
        </Formik>
      )}
      <DeletionModal
        open={delLinksOpen}
        handleClose={() => setDelLinksOpen(false)}
        list={entityLinks}
        text={ENTITY_DELETION_STATEMENT}
        onPressGoTo={(_id, type) => goToFunction(_id, type, lang)}
        onReload={() => checkLink(id, true)}
      />
      <BaseModel
        open={delOpen}
        handleClose={() => setDelOpen(false)}
        text={t('delConfirmation')}
        handleSuccess={handleDeletion}
      />
      <a ref={(r) => (anchorRef.current = r)} target="_blank"></a>
    </Grid>
  )
}

export default ProductCategoryDetailsAdminPage
