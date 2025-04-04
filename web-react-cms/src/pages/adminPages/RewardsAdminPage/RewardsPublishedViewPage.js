import {
  Grid,
  InputLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { FieldArray, Formik } from 'formik'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BaseInput from 'components/formControl/baseInput/BaseInput'
import { DatePicker, LocalizationProvider } from '@mui/lab'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import { useDispatch, useSelector } from 'react-redux'
import { getRewardsById } from 'store/actions/rewards'
import { getRewardsTags } from 'store/actions/tag'
import { useLocation, useParams } from 'react-router-dom'
import { setStateProductValue } from 'store/reducers/products'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { LANGUAGE_ERROR } from 'utils/constants'
import palette from 'theme/palette'

function RewardsPublishedViewPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { id } = useParams()
  const [tag, setTag] = useState([])
  const lang = useSelector(selectLanguage)
  const [error, setError] = useState()
  const { rewards } = id ? useSelector((state) => state.products) : ''
  const { pathname } = useLocation()
  const isPublished = pathname.split('/').at(-1) === 'published'

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
    if (id) {
      const reward = await dispatch(getRewardsById({ id: isPublished ? `${id}/published` : id }))
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

    // if (id) {
    //   const reward = await dispatch(getRewardsById({ id: isPublished ? `${id}/published` : id }))
    //   dispatch(setStateProductValue({ type: 'rewards', data: reward.payload }))
    // }
  }, [])

  return (
    <>
      <Box
        sx={{ mb: 3 }}
        display={'flex'}
        justifyContent={rewards?.metaInfo ? 'space-between' : 'flex-end'}>
        {rewards?.metaInfo && (
          <Typography
            sx={{ marginBottom: '16px' }}
            component="h2"
            variant="h3"
            color={palette.variables.darkPurple}>
            {isPublished
              ? `Published Version ${rewards?.metaInfo?.publishedVersion}`
              : `Current Version ${rewards?.metaInfo?.version}`}
          </Typography>
        )}{' '}
        <Box sx={{ display: 'flex' }}>
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
        </Box>
      </Box>
      <Formik initialValues={initialState} enableReinitialize>
        {({ values }) => (
          <form>
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
              disabled
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
              disabled
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
              disabled
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
              disabled
            />
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.points')}
            </InputLabel>
            <BaseInput
              inputProps={{ style: { display: 'block', with: '100%' } }}
              value={values.points}
              name="points"
              placeholder="Points"
              fullWidth
              type="number"
              disabled
            />
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.date')}
            </InputLabel>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                minDate={new Date()}
                value={values.dates}
                fullWidth
                renderInput={(params) => <TextField {...params} />}
                disabled
              />
            </LocalizationProvider>
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.thumbnail')}
            </InputLabel>
            <Box sx={{ display: 'flex' }}>
              {id && (
                <img
                  style={{ height: '55px', marginRight: '20px' }}
                  src={rewards?.thumbnailUrl}
                  alt=""
                />
              )}
            </Box>
            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.offerIcon')}
            </InputLabel>
            <Box sx={{ display: 'flex' }}>
              {id && (
                <img
                  style={{ height: '55px', marginRight: '20px' }}
                  src={rewards?.imageUrl}
                  alt=""
                />
              )}
            </Box>

            <InputLabel sx={{ mt: 5 }} variant="outlined">
              {t('fields.redemptionSteps')}
            </InputLabel>
            <FieldArray
              name="selections"
              render={() => (
                <div style={{ width: '100%' }}>
                  {values.selections.map((items, index) => {
                    return (
                      <Grid container key={index} alignItems="center" mt={3}>
                        <Grid item xs={10}>
                          <BaseTextField
                            disabled
                            key={index}
                            InputLabelProps={{ required: false }}
                            sx={{ marginBottom: '24px' }}
                            margin="normal"
                            fullWidth
                            id="selection"
                            label={`${t('fields.selection')} ${index + 1}`}
                            name={`selections[${index}]`}
                            value={items}
                            color={'success'}
                          />
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
              disabled
              sx={{ flexWrap: 'wrap', gap: '7px' }}
              color="primary"
              value={values.rewardTagIds}>
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
          </form>
        )}
      </Formik>
    </>
  )
}

export default RewardsPublishedViewPage
