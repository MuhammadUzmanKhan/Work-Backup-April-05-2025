import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, CardMedia, Grid, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Formik } from 'formik'
import * as Yup from 'yup'

import BaseButton from 'components/formControl/baseButton/BaseButton'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import ErrorNotification from 'components/ErrorNotification'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import palette from 'theme/palette'
import styles from '../admin.module.scss'
import { fetchCategory } from 'store/actions/products'
import { setImage } from 'store/actions/image'
import {
  deletePartner,
  editPartner,
  fetchPartnerById,
  fetchPartnerLinksById,
  publishPartner,
  setPartner
} from 'store/actions/partners'
import PageLoading from 'components/PageLoading'
import { successToast } from 'utils'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import CreatedByModal from 'components/modal/CreatedByModal'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LANGUAGE_ERROR, LINKED_ENTITIES_TYPES } from 'utils/constants'
import BaseModel from 'components/modal/BaseModal'
import { setStatePartnerValue } from 'store/reducers/partners'

const PartnerCreate = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [delLinksOpen, setDelLinksOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const anchorRef = useRef(null)

  const { productCategory } = useSelector((state) => state.products)
  const { partner, isLoading, error } = useSelector((state) => state.partners)
  const lang = useSelector(selectLanguage)

  useEffect(() => {
    dispatch(fetchCategory())
    return async () => {
      await dispatch(setLanguage('en'))
      await dispatch(setStatePartnerValue({ type: 'partner', data: null }))
    }
  }, [])

  useEffect(() => {
    if (id) dispatch(fetchPartnerById({ id }))
  }, [lang])

  const initialState = {
    name: error && lang === 'ar' ? '' : partner?.name || '',
    shortName: error && lang === 'ar' ? '' : partner?.shortName || '',
    logo: partner?.logoUrl || '',
    products: partner?.categoryIds || [],
    publish: partner?.publish || false
  }

  const PartnerCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    shortName: Yup.string().required(t('validation.required')),
    logo: Yup.string().required(t('validation.required'))
  })

  const handleSubmit = async (values) => {
    let convertedIcon
    if (values.logo !== partner?.logoUrl) {
      convertedIcon = await dispatch(setImage(values.logo))
      if (convertedIcon.payload === LANGUAGE_ERROR) return
    }

    const _partner = {
      id: lang === 'en' ? id : `${id}/i18n_data`,
      params: {
        name: values.name,
        shortName: values.shortName,
        logoUrl: convertedIcon?.payload.url || values.logo,
        categoryIds: values.products
      },
      cb: (res) => {
        successToast(`Partner has ${typeof id === 'undefined' ? 'created' : 'updated'}`)
        dispatch(fetchPartnerById({ id: res.id }))
        navigate(`/partners/create/${res.id}`, { replace: true })
      }
    }
    try {
      if (typeof id === 'undefined') {
        await dispatch(setPartner(_partner))
      } else {
        await dispatch(editPartner(_partner))
      }
    } catch (e) {
      console.error(e.message)
    }
  }

  const checkLink = async (id, reload = false) => {
    setLoading(true)
    const data = await dispatch(fetchPartnerLinksById({ id: `${id}/entity_links` }))
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
    if (type === LINKED_ENTITIES_TYPES.PRODUCT) {
      anchorRef.current.href = `#/products/${_id}`
    } else if (type === LINKED_ENTITIES_TYPES.REWARD) {
      anchorRef.current.href = `#/rewards/${_id}`
    }
    anchorRef.current.click()
  }

  const handleDeletion = () => {
    setLoading(true)
    setDelOpen(false)
    dispatch(
      deletePartner({
        id,
        cb: () => {
          successToast('Partner / Provider has successfully deleted.')
          navigate('#/partners', { replace: true })
          setLoading(false)
        },
        cbf: () => setLoading(false)
      })
    )
  }

  return (
    <Box className={styles.cardPartner}>
      <PageLoading loading={loading} />
      {isLoading ? (
        <PageLoading loading={isLoading} />
      ) : (
        <Grid item md={6} xs={12} p={3}>
          <Formik
            initialValues={initialState}
            validationSchema={PartnerCreateSchema}
            enableReinitialize
            onSubmit={handleSubmit}>
            {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
              <form onSubmit={handleSubmit}>
                <Box display={'flex'} justifyContent={'space-between'}>
                  <Box>
                    <Typography
                      sx={{ marginBottom: '16px' }}
                      component="h2"
                      variant="h3"
                      color={palette.variables.darkPurple}>
                      {typeof id === 'undefined'
                        ? t('admin.addNewPartner')
                        : t('admin.editPartner')}
                    </Typography>

                    {!errors && (
                      <ErrorNotification sx={{ marginBottom: '19px' }} errorText={'errors'} />
                    )}
                  </Box>
                  {id && (
                    <Box display={'flex'} flexDirection={'column'}>
                      <Box display={'flex'}>
                        <DisablePermissions disable={true} permission={'publish:partner'}>
                          <ToggleButtonCustom
                            style={{ height: '40px' }}
                            text={'Publish'}
                            disabled={
                              partner?.metaInfo?.version === partner?.metaInfo?.publishedVersion
                            }
                            // selected={values.publish}
                            onChange={() => {
                              dispatch(
                                publishPartner({
                                  id: `${id}/publish`,
                                  cb: () => {
                                    // setFieldValue('publish', !values.publish)
                                    dispatch(fetchPartnerById({ id }))
                                    successToast('Partner has been publish.')
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
                            marginBottom: '15px',
                            flexWrap: 'nowrap',
                            width: 'max-content'
                          }}
                          selected={lang !== 'en'}
                          onChange={() => {
                            dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                            // setIsArabic(!isArabic)
                          }}
                          value={'check'}>
                          {lang !== 'en' ? 'English' : 'Arabic'}
                        </ToggleButton>
                        {(partner?.metaInfo?.publishedVersion ||
                          partner?.metaInfo?.lastModifiedBy) && (
                          <>
                            <ToggleButton
                              sx={{
                                display: 'flex',
                                gap: '8px',
                                overflow: 'auto',
                                marginBottom: '15px',
                                marginLeft: '10px',
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
                                info={partner?.metaInfo}
                              />
                            )}
                          </>
                        )}
                        <Box mt={1} ml={1}>
                          <DeleteForeverIcon color="error" onClick={() => checkLink(id)} />
                        </Box>
                      </Box>
                      <Box display={'flex'} justifyContent={'flex-end'}>
                        <>
                          {(partner?.metaInfo?.version || partner?.metaInfo?.version === 0) && (
                            <Typography
                              color={palette.variables.orange}
                              variant="caption"
                              style={{ cursor: 'pointer', marginRight: '10px' }}
                              onClick={() => navigate(`/partners/published/${id}/current`)}>
                              {`(Current ${partner?.metaInfo?.version})`}
                            </Typography>
                          )}
                          {(partner?.metaInfo?.publishedVersion ||
                            partner?.metaInfo?.publishedVersion === 0) && (
                            <Typography
                              color={palette.variables.orange}
                              variant="caption"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/partners/published/${id}/published`)}>
                              {`(Published ${partner?.metaInfo?.publishedVersion})`}
                            </Typography>
                          )}
                        </>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box component="div">
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
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    sx={{ marginBottom: '24px' }}
                    margin="normal"
                    fullWidth
                    id="shortName"
                    label={t('fields.shortName')}
                    name="shortName"
                    onChange={handleChange}
                    error={!!errors.shortName}
                    helperText={errors.shortName}
                    value={values.shortName}
                    color={!errors.shortName && values.shortName ? 'success' : ''}
                  />
                  <Box>
                    <Box>
                      <BaseTextField
                        InputLabelProps={{ required: false }}
                        margin="normal"
                        fullWidth
                        name="logo"
                        label={`${t('fields.logo')}  (.jpeg, .jpg, .png)`}
                        id="logo"
                        type="file"
                        error={!!errors.logo}
                        helperText={errors.logo}
                        onChange={(e) => setFieldValue('logo', e.currentTarget.files[0])}
                        color={!errors.logo && values.logo ? 'success' : ''}
                        sx={{ marginBottom: '30px' }}
                        disabled={lang === 'ar'}
                      />
                      {values.logo && (
                        <CardMedia
                          style={{
                            cursor: 'pointer',
                            objectFit: 'scale-down',
                            marginBottom: '20px'
                          }}
                          component="img"
                          height="50"
                          image={
                            typeof values.logo === 'string'
                              ? values.logo
                              : URL.createObjectURL(values.logo)
                          }
                          alt="Exprot image"
                          sx={{ maxWidth: '50px', borderRadius: 1 }}
                        />
                      )}
                    </Box>

                    <Typography component="div" variant="bodyBig" color="common.darkPurple" mb={3}>
                      {t('admin.products')}
                    </Typography>

                    <ToggleButtonGroup
                      disabled={lang === 'ar'}
                      sx={{ flexWrap: 'wrap', gap: '7px' }}
                      color="primary"
                      value={values.products}
                      onChange={(e, newValues) => {
                        // setProducts(newValues);
                        setFieldValue('products', newValues)
                      }}>
                      {productCategory?.map((product) => (
                        <ToggleButton
                          sx={{
                            display: 'flex',
                            gap: '8px',
                            overflow: 'auto',
                            marginBottom: '15px',
                            flexWrap: 'nowrap',
                            width: 'max-content'
                          }}
                          key={product.id}
                          value={product.id}>
                          {product.name}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                  <DisablePermissions permission={'write:partner'} disable>
                    <BaseButton
                      customColor={palette.variables.darkPurple}
                      type="submit"
                      fullWidth
                      variant="contained"
                      element={t('save')}
                      sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
                    />
                  </DisablePermissions>
                </Box>
              </form>
            )}
          </Formik>
        </Grid>
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
    </Box>
  )
}

export default PartnerCreate
