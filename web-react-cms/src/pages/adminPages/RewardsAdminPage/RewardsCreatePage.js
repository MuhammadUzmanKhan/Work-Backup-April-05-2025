import {
  Grid,
  IconButton,
  InputLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { FieldArray, Formik } from 'formik'
import React, { useEffect, useState } from 'react'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import BaseInput from 'components/formControl/baseInput/BaseInput'
import { DatePicker, LocalizationProvider } from '@mui/lab'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import { useDispatch, useSelector } from 'react-redux'
import { deleteRewardsById, editRewards, getRewardsById, postRewards } from 'store/actions/rewards'
import { setImage } from 'store/actions/image'
import { getRewardsTags } from 'store/actions/tag'
import { useNavigate, useParams } from 'react-router-dom'
import { setStateProductValue } from 'store/reducers/products'
import { toast } from 'react-toastify'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { LANGUAGE_ERROR } from 'utils/constants'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import * as Yup from 'yup'
import CreatedByModal from 'components/modal/CreatedByModal'
import PageLoading from 'components/PageLoading'
import BaseModel from 'components/modal/BaseModal'
import { successToast } from 'utils'
import DeleteIcon from '@mui/icons-material/Delete'

function RewardsCreatePage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const [tag, setTag] = useState([])
  const lang = useSelector(selectLanguage)
  const [error, setError] = useState()
  const [open, setOpen] = useState(false)
  const { rewards } = id ? useSelector((state) => state.products) : ''

  const [delOpen, setDelOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const RewardSchema = Yup.object().shape({
    offer: Yup.string().required(t('validation.required')),
    partners: Yup.string().required(t('validation.required')),
    code: Yup.string()
      .required(t('validation.required'))
      .length(3, t('validation.codeLength'))
      .matches(/^[aA-zZ\s]+$/, 'Only alphabets are allowed for this field '),
    details: Yup.string().required(t('validation.required')),
    points: Yup.number().required(t('validation.required')),
    dates: Yup.string().required(t('validation.required')),
    icon: Yup.string().required(t('validation.required')),
    imageThumb: Yup.string().required(t('validation.required'))
  })

  const initialState = {
    offer: lang === 'ar' && error ? '' : rewards?.name || '',
    partners: lang === 'ar' && error ? '' : rewards?.partner || '',
    details: lang === 'ar' && error ? '' : rewards?.description || '',
    points: rewards?.points || '',
    dates: rewards?.validUntil || '',
    icon: rewards?.imageUrl || '',
    imageThumb: rewards?.thumbnailUrl || '',
    selections: lang === 'ar' && error ? [''] : rewards?.redemptionSteps || [''],
    rewardTagIds: rewards?.rewardTagIds || [],
    code: rewards?.code || ''
  }

  useEffect(async () => {
    if (+id !== 0) {
      const reward = await dispatch(getRewardsById({ id }))
      if (reward.payload !== LANGUAGE_ERROR)
        dispatch(setStateProductValue({ type: 'rewards', data: reward.payload }))
      else {
        setError(LANGUAGE_ERROR)
      }
    }
  }, [lang])

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    const res = await dispatch(getRewardsTags())
    setTag(res.payload.reverse())

    if (+id !== 0) {
      const reward = await dispatch(getRewardsById({ id }))
      dispatch(setStateProductValue({ type: 'rewards', data: reward.payload }))
    }
  }, [])

  const handleSubmit = async (values) => {
    if (!values.dates || values.dates == 'Invalid Date') {
      toast('Date is invalid or missing.', { type: 'error' })
      return
    }
    let imageUrl = rewards?.imageUrl
    let thumbnailUrl = rewards?.thumbnailUrl

    if (typeof values.icon == 'object') {
      let img = await dispatch(setImage({ params: values.icon, fieldName: 'Thumbnail' }))
      imageUrl = img.payload.url
      if (!imageUrl) return
    }

    if (typeof values.imageThumb == 'object') {
      let img = await dispatch(setImage({ params: values.imageThumb, fieldName: 'Offer Icon' }))
      thumbnailUrl = img.payload.url
      if (!thumbnailUrl) return
    }

    const data = {
      name: values.offer,
      partner: values.partners,
      code: values.code.toUpperCase(),
      description: values.details,
      points: values.points,
      validUntil: values.dates,
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl,
      redemptionSteps: values.selections,
      rewardTagIds: values.rewardTagIds
    }
    const cb = (res) => {
      successToast(`Reward has ${+id === 0 ? 'created' : 'updated'}`)
      if (+id === 0) navigate(`/rewards/${res.id}`, { replace: true })
    }
    if (+id === 0) {
      dispatch(postRewards({ params: data, cb }))
    } else {
      const obj = {
        id: lang === 'en' ? id : `${id}/i18n_data`,
        params: data,
        cb
      }
      dispatch(editRewards(obj))
    }
  }

  const handleDeletion = () => {
    setDelOpen(false)
    setLoading(true)
    dispatch(
      deleteRewardsById({
        id,
        cb: async () => {
          successToast('Reward has successfully deleted.')
          navigate(-1, { replace: true })

          setLoading(false)
        },
        cbF: () => setLoading(false)
      })
    )
  }

  return (
    <>
      <PageLoading loading={loading} />
      <Box sx={{ mb: 3 }} display={'flex'} justifyContent={'space-between'}>
        <Typography variant="h3">{id ? t('admin.editAnOffer') : t('admin.addAnOffer')}</Typography>
        {id && (
          <Box display={'flex'} flexDirection={'column'}>
            <Box sx={{ display: 'flex' }} mb={1}>
              <DisablePermissions disable={true} permission={'publish:reward'}>
                <ToggleButtonCustom
                  text={'Publish'}
                  disabled={rewards?.metaInfo?.version === rewards?.metaInfo?.publishedVersion}
                  onChange={() => {
                    dispatch(
                      editRewards({
                        id: `${id}/publish`,
                        cb: async () => {
                          const reward = await dispatch(getRewardsById({ id }))
                          dispatch(setStateProductValue({ type: 'rewards', data: reward.payload }))
                          successToast('Reward has been published.')
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
              {(rewards?.metaInfo?.publishedVersion || rewards?.metaInfo?.lastModifiedBy) && (
                <>
                  <ToggleButton
                    sx={{
                      display: 'flex',
                      gap: '8px',
                      overflow: 'auto',
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
                      info={rewards?.metaInfo}
                    />
                  )}
                </>
              )}
              <Box
                sx={{
                  display: 'flex'
                }}>
                <IconButton aria-label="delete" onClick={() => setDelOpen(true)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Box>
            </Box>
            <Box display={'flex'} justifyContent={'flex-end'}>
              <>
                {(rewards?.metaInfo?.version || rewards?.metaInfo?.version === 0) && (
                  <Typography
                    color={palette.variables.orange}
                    variant="caption"
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                    onClick={() => navigate(`/rewards/published/${id}/current`)}>
                    {`(Current ${rewards?.metaInfo?.version})`}
                  </Typography>
                )}
                {(rewards?.metaInfo?.publishedVersion ||
                  rewards?.metaInfo?.publishedVersion === 0) && (
                  <Typography
                    color={palette.variables.orange}
                    variant="caption"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/rewards/published/${id}/published`)}>
                    {`(Published ${rewards?.metaInfo?.publishedVersion})`}
                  </Typography>
                )}
              </>
            </Box>
          </Box>
        )}
      </Box>
      <Formik
        initialValues={initialState}
        enableReinitialize
        onSubmit={handleSubmit}
        validationSchema={RewardSchema}>
        {({ values, errors, handleChange, setFieldValue, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.offer')}
            </InputLabel>
            <BaseTextField
              sx={{ mt: 0 }}
              fullWidth
              placeholder={t('fields.someText')}
              id="offer"
              name="offer"
              value={values.offer}
              onChange={handleChange}
              error={!!errors.offer}
              helperText={errors.offer}
              color={!errors.offer && values.offer ? 'success' : ''}
            />
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.partner')}
            </InputLabel>
            <BaseTextField
              sx={{ mt: 0 }}
              fullWidth
              placeholder={t('fields.someText')}
              id="partners"
              name="partners"
              value={values.partners}
              onChange={handleChange}
              error={!!errors.partners}
              helperText={errors.partners}
              color={!errors.partners && values.partners ? 'success' : ''}
            />
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.details')}
            </InputLabel>

            <BaseTextField
              sx={{ mt: 0 }}
              fullWidth
              placeholder={t('fields.someText')}
              id="details"
              name="details"
              value={values.details}
              onChange={handleChange}
              error={!!errors.details}
              helperText={errors.details}
              color={!errors.details && values.details ? 'success' : ''}
            />

            <InputLabel sx={{ mt: 5 }} variant="outlined">
              Code
            </InputLabel>

            <BaseTextField
              sx={{ mt: 0 }}
              fullWidth
              placeholder={t('fields.someText')}
              id="code"
              name="code"
              value={values.code}
              onChange={handleChange}
              error={!!errors.code}
              helperText={errors.code}
              disabled={lang === 'ar'}
              color={!errors.code && values.code ? 'success' : ''}
            />

            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.points')}
            </InputLabel>
            <BaseInput
              inputProps={{ style: { display: 'block', with: '100%' } }}
              onChange={handleChange}
              value={values.points}
              name="points"
              placeholder="Points"
              fullWidth
              type="number"
              error={!!errors.points}
              helperText={errors.points}
              disabled={lang === 'ar'}
              color={!errors.points && values.points ? 'success' : ''}
            />
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.date')}
            </InputLabel>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                minDate={new Date()}
                value={values.dates}
                fullWidth
                onChange={(e) => setFieldValue('dates', e)}
                renderInput={(params) => <TextField {...params} />}
                disabled={lang === 'ar'}
                error={!!errors.dates}
                helperText={errors.dates}
                color={!errors.dates && values.dates ? 'success' : ''}
              />
            </LocalizationProvider>
            {/* <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.thumbnail')}
            </InputLabel> */}
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.offerIcon')}
            </InputLabel>
            <Box sx={{ display: 'flex' }}>
              {id && (
                <img
                  style={{ height: '55px', marginRight: '20px' }}
                  src={rewards?.thumbnailUrl}
                  alt=""
                />
              )}
              <BaseTextField
                InputLabelProps={{ required: false }}
                margin="normal"
                fullWidth
                name="imageThumb"
                id="imageThumb"
                type="file"
                error={!!errors.imageThumb}
                onChange={(e) => setFieldValue('imageThumb', e.currentTarget.files[0])}
                sx={{ mt: 0 }}
                disabled={lang === 'ar'}
                helperText={errors.imageThumb}
                color={!errors.imageThumb && values.imageThumb ? 'success' : ''}
              />
            </Box>
            {/* <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.offerIcon')}
            </InputLabel> */}
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.thumbnail')}
            </InputLabel>
            <Box sx={{ display: 'flex' }}>
              {id && (
                <img
                  style={{ height: '55px', marginRight: '20px' }}
                  src={rewards?.imageUrl}
                  alt=""
                />
              )}
              <BaseTextField
                InputLabelProps={{ required: false }}
                margin="normal"
                fullWidth
                name="icon"
                id="icon"
                type="file"
                error={!!errors.icon}
                onChange={(e) => setFieldValue('icon', e.currentTarget.files[0])}
                sx={{ mt: 0 }}
                disabled={lang === 'ar'}
                helperText={errors.icon}
                color={!errors.icon && values.icon ? 'success' : ''}
              />
            </Box>

            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.redemptionSteps')}
            </InputLabel>
            <FieldArray
              name="selections"
              render={(arrayHelpers) => (
                <div style={{ width: '100%' }}>
                  {values.selections.map((items, index) => {
                    return (
                      <Grid container key={index} alignItems="center" mt={3}>
                        <Grid item xs={10}>
                          <BaseTextField
                            key={index}
                            InputLabelProps={{ required: false }}
                            sx={{ marginBottom: '24px' }}
                            margin="normal"
                            fullWidth
                            id="selection"
                            label={`${t('fields.selection')} ${index + 1}`}
                            name={`selections[${index}]`}
                            onChange={handleChange}
                            error={!!errors.selections}
                            helperText={errors.selections}
                            value={items}
                            color={!errors.selections && values.selections ? 'success' : ''}
                          />
                        </Grid>
                        <Grid item xs={2} pl={2}>
                          <Box
                            style={{
                              width: '70px',
                              display: 'flex',
                              justifyContent: 'right'
                            }}>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  arrayHelpers.remove(index)
                                }}
                                style={{
                                  border: 0,
                                  backgroundColor: '#fff',
                                  borderRadius: '20px'
                                }}>
                                <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => arrayHelpers.push('')}
                              style={{
                                border: 0,
                                backgroundColor: '#fff',
                                borderRadius: '20px'
                              }}>
                              <AddCircleOutlineOutlinedIcon sx={{ color: 'common.green' }} />
                            </button>
                          </Box>
                        </Grid>
                      </Grid>
                    )
                  })}
                </div>
              )}
            />

            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.rewardsTag')}
            </InputLabel>
            <ToggleButtonGroup
              disabled={lang === 'ar'}
              sx={{ flexWrap: 'wrap', gap: '7px' }}
              color="primary"
              value={values.rewardTagIds}
              onChange={(event, value) => {
                setFieldValue(`rewardTagIds`, value)
              }}>
              {tag.map((_tag) => (
                <ToggleButton
                  sx={{
                    display: 'flex',
                    gap: '8px',
                    overflow: 'auto',
                    marginBottom: '15px',
                    flexWrap: 'nowrap',
                    width: 'max-content'
                  }}
                  selected={values.rewardTagIds.includes(_tag.id)}
                  key={_tag.id}
                  value={_tag.id}>
                  {_tag.name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <DisablePermissions permission={'write:reward'} disable>
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

      <BaseModel
        open={delOpen}
        handleClose={() => setDelOpen(false)}
        text={t('delConfirmation')}
        handleSuccess={handleDeletion}
      />
    </>
  )
}

export default RewardsCreatePage
