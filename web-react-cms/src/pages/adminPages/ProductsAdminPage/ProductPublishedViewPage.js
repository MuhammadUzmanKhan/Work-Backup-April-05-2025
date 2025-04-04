import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { Box, Grid, InputLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Formik } from 'formik'
import PageLoading from 'components/PageLoading'

import { setStateProductValue } from 'store/reducers/products'
import { fetchCategoryById, fetchProductById } from 'store/actions/products'
import { getPrimaryProductTags, getFilterProductTags } from 'store/actions/tag'
import { fetchPartners } from 'store/actions/partners'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { ContentState, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'

import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import BaseTextarea from 'components/formControl/baseTextarea/BaseTextarea'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'

import { currencyOptions } from 'utils/staticValues'

import styles from '../admin.module.scss'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import palette from 'theme/palette'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'

const ProductPublishedView = () => {
  const dispatch = useDispatch()
  const { id, categoryId } = useParams()
  const { pathname } = useLocation()
  const isPublished = pathname.split('/').at(-1) === 'published'
  const { t } = useTranslation()
  const { state } = useLocation()
  const lang = useSelector(selectLanguage)
  const [loading] = useState(false)
  const [applyText, setApplyText] = useState(EditorState.createEmpty())
  const { product, error } = useSelector((state) => state.products)
  const { selectedCategory } = useSelector((state) => state.products)

  const { primaryProductTags } = useSelector((state) => state.products)
  const { filterProductTags } = useSelector((state) => state.products)
  const { partners } = useSelector((state) => state.partners)
  const [, setPrimaryTags] = useState(() => [])
  const [, setFilterTagsTags] = useState(() => [])
  const [selectedCat] = useState('')
  const [isNew, setIsNew] = useState(false)
  const reset = () => {
    setIsNew(false)
    dispatch(setStateProductValue({ type: 'product', data: {} }))
  }
  useEffect(() => {
    if (lang === 'ar' && error === 'Request failed with status code 412') {
      setIsNew(true)
      setApplyText(EditorState.createEmpty())
      dispatch(setStateProductValue({ type: 'product', data: { ...product, mainFields: null } }))
    }
  }, [lang, error])

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    if (+id !== 0) {
      if (lang === 'en') reset()
      dispatch(fetchProductById({ id: isPublished ? `${id}/published` : id }))
    }
  }, [lang])

  useEffect(() => {
    if (product?.howToApply && +id !== 0) {
      const contentBlock = htmlToDraft(product?.howToApply)
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
        setApplyText(EditorState.createWithContent(contentState))
      }
    }
  }, [product?.howToApply])

  const parsedMainFields = useMemo(() => {
    if (product?.mainFields) {
      const arrToParse = product?.mainFields && Object.values(product?.mainFields)
      const arr = arrToParse.reduce((consumer, _item, index) => {
        let item = {}
        if (product?.mainFields) item['value'] = _item
        else item = _item
        const propertyName = 'main_field' + (index + 1)
        const propertyNotation = 'main_field' + (index + 1) + 'NotationId'

        const summary = item.value?.split(' ') || []

        const valueText = summary?.length > 2 ? item.value : summary[0]?.replace(/%/, '')
        const notationId =
          summary?.length === 1
            ? 4
            : summary?.length === 2
            ? currencyOptions.find(({ title }) => title === summary[1])?.id
            : null
        consumer[propertyName] = valueText || ''
        consumer[propertyNotation] = notationId || ''
        return consumer
      }, {})
      return arr
    }
    return {}
  }, [product])

  useEffect(async () => {
    if (+id !== 0) {
      const productData = await dispatch(
        fetchProductById({ id: isPublished ? `${id}/published` : id })
      )
      dispatch(setStateProductValue({ type: 'product', data: productData.payload }))
      const categoryData = await dispatch(fetchCategoryById({ id: productData.payload.categoryId }))
      dispatch(setStateProductValue({ type: 'selectedCategory', data: categoryData.payload }))
    }
    const primaryTagsData = await dispatch(getPrimaryProductTags())
    dispatch(setStateProductValue({ type: 'primaryProductTags', data: primaryTagsData.payload }))
    const filterTagsData = await dispatch(getFilterProductTags())
    dispatch(setStateProductValue({ type: 'filterProductTags', data: filterTagsData.payload }))

    dispatch(fetchPartners())
  }, [])

  const initialState = {
    categoryId: product?.categoryId || '',
    providerId: product?.providerId || '',
    name: isNew ? '' : product.name || '',
    imageThumb: product.thumbnailUrl || '',
    imageFull: product.imageUrl || '',
    previewText: isNew ? '' : product.previewText || '',
    description: isNew ? '' : product.description || '',
    mainFields: parsedMainFields,
    aditional: isNew ? '' : product.additionalText || '',
    primaryTags: product.productTags || [],
    filterTags: product.filterTags || [],
    howToApply: isNew ? '' : product.howToApply || ''
  }

  return (
    <>
      <PageLoading loading={loading} />
      <Box className={styles.cardProduct}>
        {+id !== 0 && (
          <Grid container display={'flex'} justifyContent={'space-between'}>
            <Grid item>
              <Grid container>
                <Grid item>
                  {product?.thumbnailUrl ? (
                    <img
                      style={{ width: '80px', height: '54px', marginRight: '18px' }}
                      src={product.thumbnailUrl}
                      alt=""
                    />
                  ) : (
                    <Box ml={1} mr={5}>
                      <Wealth />
                    </Box>
                  )}
                </Grid>

                <Grid item>
                  <Typography variant="bodyBig" color="common.darkPurple">
                    {product?.name || ''}
                  </Typography>
                  <Typography color="common.darkPurple">{selectedCategory?.name || ''}</Typography>
                  {product?.metaInfo && (
                    <Typography
                      sx={{ marginBottom: '16px' }}
                      variant="subtitle1"
                      color={palette.variables.darkPurple}>
                      {isPublished
                        ? `Published Version ${product?.metaInfo?.publishedVersion}`
                        : `Current Version ${product?.metaInfo?.version}`}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Grid>

            <Grid item marginX={5}>
              {id !== '0' && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              )}
            </Grid>
          </Grid>
        )}

        {/* {!loading && ( */}
        <Formik initialValues={initialState} enableReinitialize>
          {({ values, errors, handleChange, setFieldValue }) => (
            <form>
              <Typography variant="bodyBig" component="p" color="common.darkPurple" my={3}>
                {t('admin.productDetails')}
              </Typography>
              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="name"
                label={t('fields.name')}
                name="name"
                disabled={true}
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />
              <>
                <Box sx={{ display: 'flex' }} mb={3}>
                  {(+id !== 0 || typeof values.imageThumb === 'object') && (
                    <img
                      style={{ height: '55px', marginRight: '20px' }}
                      src={
                        product.thumbnailUrl ||
                        (typeof values.imageThumb === 'object' &&
                          URL.createObjectURL(values.imageThumb))
                      }
                      alt=""
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex' }}>
                  {(+id !== 0 || typeof values.imageFull === 'object') && (
                    <img
                      style={{ height: '55px', marginRight: '20px' }}
                      src={
                        product.imageUrl ||
                        (typeof values.imageFull === 'object' &&
                          URL.createObjectURL(values.imageFull))
                      }
                      alt=""
                    />
                  )}
                </Box>
              </>

              <InputLabel sx={{ mt: 3 }} variant="outlined">
                {t('fields.choosePartner')}
              </InputLabel>
              <BaseSelect
                id="providerId"
                name="providerId"
                items={partners}
                initvalue={values.providerId}
                sx={{ width: '100%', marginBottom: 3, m: 0 }}
                color={!errors.providerId && values.providerId ? 'success' : ''}
                disabled={true}
              />

              <BaseTextarea
                style={{ marginBottom: '16px' }}
                // color="common.greyLight"
                label={t('fields.previewText')}
                id="text"
                name="previewText"
                disabled={true}
                value={values.previewText}
                placeholder="Add preview text"
                color={!errors.previewText && values.previewText ? 'common.greyLight' : ''}
              />
              <BaseTextarea
                style={{ marginBottom: '16px' }}
                // color="common.greyLight"
                label={t('fields.productDescription')}
                id="text"
                name="description"
                disabled={true}
                value={values.description}
                placeholder="Add description"
                color={!errors.description && values.description ? 'common.greyLight' : ''}
              />
              <Grid container spacing={1}>
                {Object.keys(values.mainFields).length > 0 &&
                  Object.keys(values.mainFields).map((key, index) => {
                    if (index % 2 !== 0) return
                    const isProduct = !!product?.mainFields
                    const isCategory = !!selectedCategory?.mainFields
                    const labelValue = isProduct
                      ? product?.mainFields[index / 2]?.label
                      : isCategory
                      ? selectedCategory?.mainFields[key]?.label
                      : ''
                    return (
                      <Grid key={key} item xs={12} md={6}>
                        <InputLabel sx={{ mt: 3 }} variant="outlined">
                          {selectedCategory?.mainFields?.[index / 2]?.label}
                        </InputLabel>
                        <Grid container spacing={1} xs={12} alignItems="center" mt={-3}>
                          <Grid item xs={8}>
                            <BaseTextField
                              InputLabelProps={{ required: false }}
                              sx={{ marginBottom: '24px' }}
                              type={'text'}
                              margin="normal"
                              fullWidth
                              id={`mainFields.${key}`}
                              label={labelValue}
                              name={`mainFields.${key}`}
                              onChange={handleChange}
                              value={values.mainFields[key]}
                              disabled={true}
                            />
                          </Grid>
                          {(!isProduct || values.mainFields[key + 'NotationId']) && (
                            <Grid item xs={4}>
                              <BaseSelect
                                disabled={true}
                                id={`mainFields.${key}NotationId`}
                                name={`mainFields.${key}NotationId`}
                                onChange={(value) =>
                                  setFieldValue(`mainFields.${key}NotationId`, value)
                                }
                                items={currencyOptions}
                                sx={{ minWidth: 50, marginBottom: 0 }}
                                initvalue={values.mainFields[key + 'NotationId'] || ''}
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )
                  })}
              </Grid>
              <BaseTextarea
                style={{ marginBottom: '16px' }}
                // color="common.greyLight"
                label={t('fields.additionalDetails')}
                id="text"
                name="aditional"
                disabled={true}
                value={values.aditional}
                placeholder="Add description"
                color={!errors.aditional && values.aditional ? 'common.greyLight' : ''}
              />
              <Typography variant="subtitle1" component="h3" sx={{ mt: 3 }}>
                {t('fields.howToApply')}
              </Typography>

              <RichTextEditor disabled value={applyText} />

              <Grid container spacing={2} mt={2}>
                <Grid item xs={8} sx={{ display: 'flex' }}>
                  {primaryProductTags.filter(
                    (tag) =>
                      tag.categoryId === categoryId ||
                      tag.categoryId === state?.categoryId ||
                      tag.categoryId === selectedCat ||
                      tag.categoryId === values.categoryId
                  ).length > 0 && (
                    <>
                      <LocalOfferIcon />
                      <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                        {t('fields.primaryTag')}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid item>
                  <ToggleButtonGroup
                    disabled
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.primaryTags}
                    onChange={(e, newValues) => {
                      setPrimaryTags(newValues)
                      setFieldValue('primaryTags', newValues)
                    }}>
                    {primaryProductTags
                      .filter(
                        (tag) =>
                          tag.categoryId === categoryId ||
                          tag.categoryId === state?.categoryId ||
                          tag.categoryId === selectedCat ||
                          tag.categoryId === values.categoryId
                      )
                      .map((tag) => {
                        return (
                          <ToggleButton
                            sx={{
                              display: 'flex',
                              gap: '8px',
                              overflow: 'auto',
                              marginBottom: '15px',
                              flexWrap: 'nowrap',
                              width: 'max-content'
                            }}
                            selected={values.primaryTags.includes(tag.id)}
                            key={tag.id}
                            value={tag.id}>
                            {tag.name}
                          </ToggleButton>
                        )
                      })}
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={8} sx={{ display: 'flex' }}>
                  <LocalOfferIcon />
                  <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                    {t('fields.filterTag')}
                  </Typography>
                </Grid>
                <Grid item>
                  <ToggleButtonGroup
                    disabled
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.filterTags}
                    onChange={(e, newValues) => {
                      setFilterTagsTags(newValues)
                      setFieldValue('filterTags', newValues)
                    }}>
                    {filterProductTags.map((tag) => (
                      <ToggleButton
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          overflow: 'auto',
                          marginBottom: '15px',
                          flexWrap: 'nowrap',
                          width: 'max-content'
                        }}
                        selected={values.filterTags.includes(tag.id)}
                        key={tag.id}
                        value={tag.id}>
                        {tag.valueSuffix || tag.value}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
            </form>
          )}
        </Formik>
        {/* )} */}
      </Box>
    </>
  )
}
export default ProductPublishedView
