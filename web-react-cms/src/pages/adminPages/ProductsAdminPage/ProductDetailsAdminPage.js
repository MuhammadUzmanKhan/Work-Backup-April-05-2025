import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, InputLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import PageLoading from 'components/PageLoading';

import { setStateProductValue } from 'store/reducers/products';
import {
  createNewProduct,
  deleteProductById,
  editProductById,
  fetchCategory,
  fetchCategoryById,
  fetchProductById
} from 'store/actions/products'
import { getPrimaryProductTags, getFilterProductTags } from 'store/actions/tag'
import { fetchPartners } from 'store/actions/partners'
import { setImage } from 'store/actions/image'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { ContentState, convertToRaw, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'

import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import BaseTextarea from 'components/formControl/baseTextarea/BaseTextarea'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'

import { currencyOptions } from 'utils/staticValues'

import palette from 'theme/palette'
import styles from '../admin.module.scss'
import { successToast } from 'utils'
import draftjsToHtml from 'draftjs-to-html'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import CreatedByModal from 'components/modal/CreatedByModal'
import { removeSpaces } from 'utils/functions'
import BaseModel from 'components/modal/BaseModal'
import { LANGUAGE_ERROR } from 'utils/constants'

const ProductDetails = () => {
  const dispatch = useDispatch()
  const { id, categoryId } = useParams()
  const { t } = useTranslation()
  const { state } = useLocation()
  const lang = useSelector(selectLanguage)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [applyText, setApplyText] = useState(EditorState.createEmpty())
  const { product, error } = useSelector((state) => state.products)
  const { selectedCategory } = useSelector((state) => state.products)

  const { primaryProductTags } = useSelector((state) => state.products)
  const { filterProductTags } = useSelector((state) => state.products)
  const { partners } = useSelector((state) => state.partners)
  const { productCategory } = useSelector((state) => state.products)
  const [, setPrimaryTags] = useState(() => [])
  const [, setFilterTagsTags] = useState(() => [])
  const [chooseCategoryID, setChooseCategoryID] = useState(() => '')
  const [selectedCat, setSelectedCat] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [open, setOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  // const [publish, setPublish] = useState(false)
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
      dispatch(fetchProductById({ id }))
      if (product?.categoryId) {
        const categoryData = await dispatch(fetchCategoryById({ id: product?.categoryId }))
        if (categoryData.payload !== LANGUAGE_ERROR)
          dispatch(setStateProductValue({ type: 'selectedCategory', data: categoryData.payload }))
      }
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
    if (product?.mainFields || selectedCategory?.mainFields) {
      const arrToParse =
        (product?.mainFields && Object.values(product?.mainFields)) ||
        Object.values(selectedCategory?.mainFields)
      const arr = arrToParse.reduce((consumer, _item, index) => {
        let item = {}
        if (product?.mainFields) item['value'] = _item
        else item = _item
        const propertyName = 'main_field' + (index + 1)
        const propertyNotation = 'main_field' + (index + 1) + 'NotationId'

        const summary = item.value?.split(' ') || []
        const valueText =
          summary?.length > 2
            ? item.value
            : summary?.length === 2 && currencyOptions.find(({ title }) => title === summary[0])
            ? summary[1]
            : summary?.length === 2 && currencyOptions.find(({ title }) => title === summary[1])
            ? summary[0]
            : summary[0]?.replace(/%/, '')
        const notationId =
          summary?.length === 1 && summary[0].includes('%')
            ? 5
            : summary?.length === 2
            ? currencyOptions.find(({ title }) => title === summary[0] || title === summary[1])?.id
            : null
        consumer[propertyName] = valueText || ''
        consumer[propertyNotation] = notationId || 1
        return consumer
      }, {})
      return arr
    }
    return {}
  }, [product, selectedCategory])

  useEffect(async () => {
    if (+id !== 0) {
      const productData = await dispatch(fetchProductById({ id: id }))
      dispatch(setStateProductValue({ type: 'product', data: productData.payload }))
      const categoryData = await dispatch(fetchCategoryById({ id: productData.payload.categoryId }))
      dispatch(setStateProductValue({ type: 'selectedCategory', data: categoryData.payload }))
      // dispatch(setStateProductValue({ type: 'selectedCategory', data: {} }));
      dispatch(setStateProductValue({ type: 'productCategory', data: [] }))
    } else if (+id === 0 && categoryId) {
      dispatch(setStateProductValue({ type: 'product', data: {} }))
      const categoryData = await dispatch(fetchCategoryById({ id: categoryId }))
      dispatch(setStateProductValue({ type: 'selectedCategory', data: categoryData.payload }))
      dispatch(setStateProductValue({ type: 'productCategory', data: [] }))
    } else {
      dispatch(setStateProductValue({ type: 'product', data: {} }))
      dispatch(setStateProductValue({ type: 'selectedCategory', data: {} }))
      dispatch(fetchCategory())
    }
    const primaryTagsData = await dispatch(getPrimaryProductTags())
    dispatch(setStateProductValue({ type: 'primaryProductTags', data: primaryTagsData.payload }))
    const filterTagsData = await dispatch(getFilterProductTags())
    dispatch(setStateProductValue({ type: 'filterProductTags', data: filterTagsData.payload }))

    dispatch(fetchPartners())
  }, [])

  useEffect(async () => {
    if (chooseCategoryID) {
      const categoryData = await dispatch(fetchCategoryById({ id: chooseCategoryID }))
      dispatch(setStateProductValue({ type: 'selectedCategory', data: categoryData.payload }))
    } else {
      if (productCategory[0]?.id && !categoryId && +id === 0)
        setChooseCategoryID(productCategory[0]?.id)
    }
  }, [chooseCategoryID, productCategory])

  const initialState = {
    categoryId:
      state?.categoryId || categoryId || selectedCategory.id || productCategory[0]?.id || '',
    providerId: product?.providerId || state?.providerId || partners[0]?.id || '',
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

  const ProductCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    imageFull: Yup.string().required(t('validation.required')),
    imageThumb: Yup.string().required(t('validation.required')),
    description: Yup.string().required(t('validation.required')),
    previewText: Yup.string().required(t('validation.required')),
    aditional: Yup.string().required(t('validation.required'))
  })

  const handleSubmit = async (values) => {
    // setLoading(true)
    const thumbnailUrl =
      typeof values.imageThumb === 'string'
        ? values.imageThumb
        : (await dispatch(setImage({ params: values.imageThumb, fieldName: 'Thumbnail' }))).payload
            .url
    const imageUrl =
      typeof values.imageFull === 'string'
        ? values.imageFull
        : (await dispatch(setImage({ params: values.imageFull, fieldName: 'Full Size' }))).payload
            .url
    if (!thumbnailUrl) return
    if (!imageUrl) return

    const mainFields = Object.keys(values.mainFields).reduce((consumer, key) => {
      if (key.includes('NotationId')) return consumer
      const notationId = values.mainFields[key + 'NotationId']
      let notation = notationId ? currencyOptions[notationId - 1].title : ''
      notation = notation.replace('None', '')
      const value =
        !notation || notation === '%'
          ? values.mainFields[key] + notation
          : notation + ' ' + values.mainFields[key]
      consumer[key] = value
      return consumer
    }, {})
    // console.log(mainFields)
    const temp = {
      main_field_0: mainFields['main_field1'],
      main_field_1: mainFields['main_field2'],
      main_field_2: mainFields['main_field3'],
      main_field_3: mainFields['main_field4'],
      main_field_4: mainFields['main_field5'],
      main_field_5: mainFields['main_field6']
    }
    const params = {
      categoryId: values.categoryId,
      providerId: values.providerId,
      name: values.name,
      description: values.description,
      previewText: values.previewText,
      additionalText: values.aditional,
      mainFields: temp,
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl,
      productTags: values.primaryTags,
      filterTags: values.filterTags,
      howToApply: removeSpaces(draftjsToHtml(convertToRaw(applyText.getCurrentContent())))
    }
    if (+id === 0) {
      dispatch(
        createNewProduct({
          params,
          cb: async (res) => {
            successToast('Product has created')
            const productData = await dispatch(fetchProductById({ id: res.id }))
            dispatch(setStateProductValue({ type: 'product', data: productData.payload }))
            navigate(`/products/${res.id}`, { replace: true })
          }
        })
      )
    } else {
      dispatch(
        editProductById({
          id: lang === 'en' ? id : `${id}/i18n_data`,
          params,
          cb: () => {
            dispatch(fetchProductById({ id }))
            successToast('Product has updated')
          }
        })
      )
    }
    setLoading(false)
  }

  const handleDeletion = () => {
    setDelOpen(false)
    setLoading(true)
    dispatch(
      deleteProductById({
        id,
        cb: async () => {
          successToast('Product has successfully deleted.')
          navigate(-1, { replace: true })
          setLoading(false)
        },
        cbF: () => setLoading(false)
      })
    )
  }

  const getFilterTagsToShow = () => {
    const rangeTags = [
      ...new Set(
        selectedCategory?.filter?.productFilterRanges
          ?.map((ques) => ques.tags.map((tag) => tag.id))
          .flat(1)
      )
    ]
    const normalTags = [
      ...new Set(
        selectedCategory?.filter?.productFilterCheckBoxes?.map((ques) => ques.tag.id).flat(1)
      )
    ]
    const allFilterTags = filterProductTags?.filter(
      (_filter) =>
        (!_filter?.valueSuffix && normalTags?.find((f) => f == _filter.id)) ||
        rangeTags?.find((f) => f == _filter.id)
    )
    return allFilterTags || []
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
                </Grid>
              </Grid>
            </Grid>

            <Grid item marginX={5}>
              {id !== '0' && (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box display={'flex'}>
                    <DisablePermissions disable={true} permission={'publish:product'}>
                      <ToggleButtonCustom
                        text={'Publish'}
                        disabled={
                          product?.metaInfo?.version === product?.metaInfo?.publishedVersion
                        }
                        onChange={() => {
                          dispatch(
                            editProductById({
                              id: `${id}/publish`,
                              cb: () => {
                                dispatch(fetchProductById({ id }))
                                successToast('Product has been published.')
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

                    {(product?.metaInfo?.publishedVersion || product?.metaInfo?.lastModifiedBy) && (
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
                            info={product?.metaInfo}
                          />
                        )}
                      </>
                    )}
                    <Box mt={1}>
                      <DeleteForeverIcon color="error" onClick={() => setDelOpen(true)} />
                    </Box>
                  </Box>
                  <Box display={'flex'} justifyContent={'flex-end'} mt={1}>
                    <>
                      {(product?.metaInfo?.version || product?.metaInfo?.version === 0) && (
                        <Typography
                          color={palette.variables.orange}
                          variant="caption"
                          style={{ cursor: 'pointer', marginRight: '10px' }}
                          onClick={() => navigate(`/products/published/${id}/current`)}>
                          {`(Current ${product?.metaInfo?.version})`}
                        </Typography>
                      )}
                      {(product?.metaInfo?.publishedVersion ||
                        product?.metaInfo?.publishedVersion === 0) && (
                        <Typography
                          color={palette.variables.orange}
                          variant="caption"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/products/published/${id}/published`)}>
                          {`(Published ${product?.metaInfo?.publishedVersion})`}
                        </Typography>
                      )}
                    </>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {/* {!loading && ( */}
        <Formik
          initialValues={initialState}
          validationSchema={ProductCreateSchema}
          onSubmit={handleSubmit}
          enableReinitialize>
          {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
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
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />
              <>
                <Box sx={{ display: 'flex' }}>
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
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    margin="normal"
                    fullWidth
                    name="imageThumb"
                    label={`${t('fields.thumbnail')}  (.jpeg, .jpg, .png)`}
                    id="imageThumb"
                    type="file"
                    error={!!errors.imageThumb}
                    helperText={errors.imageThumb}
                    onChange={(e) => setFieldValue('imageThumb', e.currentTarget.files[0])}
                    file={values.imageThumb}
                    color={!errors.imageThumb && values.imageThumb ? 'success' : ''}
                    sx={{ marginBottom: '30px' }}
                    disabled={lang === 'ar'}
                  />
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
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    margin="normal"
                    fullWidth
                    name="imageFull"
                    label={`${t('fields.fullsizeImage')}  (.jpeg, .jpg, .png)`}
                    id="imageFull"
                    type="file"
                    error={!!errors.imageFull}
                    helperText={errors.imageFull}
                    onChange={(e) => setFieldValue('imageFull', e.currentTarget.files[0])}
                    file={values.imageFull}
                    color={!errors.imageFull && values.imageFull ? 'success' : ''}
                    sx={{ marginBottom: '30px' }}
                    disabled={lang === 'ar'}
                  />
                </Box>
              </>

              {!categoryId && +id === 0 && (
                <>
                  <BaseSelect
                    defaultSelection={'Select Category'}
                    id="categoryId"
                    name="categoryId"
                    items={productCategory}
                    onChange={(value) => {
                      // setChooseCategoryID(value);
                      setSelectedCat(value)
                      setFieldValue('categoryId', value)
                    }}
                    initvalue={values.categoryId}
                    sx={{ width: '100%', marginBottom: 3, m: 0 }}
                    error={!!errors.categoryId}
                    helperText={errors.categoryId}
                    color={!errors.categoryId && values.categoryId ? 'success' : ''}
                  />
                </>
              )}

              <InputLabel sx={{ mt: 3 }} variant="outlined">
                {t('fields.choosePartner')}
              </InputLabel>
              <BaseSelect
                id="providerId"
                name="providerId"
                items={partners}
                onChange={(value) => setFieldValue('providerId', value)}
                initvalue={values.providerId}
                sx={{ width: '100%', marginBottom: 3, m: 0 }}
                error={!!errors.providerId}
                helperText={errors.providerId}
                color={!errors.providerId && values.providerId ? 'success' : ''}
                disabled={lang === 'ar'}
              />

              <BaseTextarea
                style={{ marginBottom: '16px' }}
                // color="common.greyLight"
                label={t('fields.previewText')}
                id="text"
                name="previewText"
                onChange={handleChange}
                error={!!errors.previewText}
                helperText={errors.previewText}
                value={values.previewText}
                placeholder="Add preview text"
                // color={!errors.previewText && values.previewText ? 'success' : ''}
              />
              <BaseTextarea
                style={{ marginBottom: '16px' }}
                // color="common.greyLight"
                label={t('fields.productDescription')}
                id="text"
                name="description"
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                value={values.description}
                placeholder="Add description"
                // color={!errors.description && values.description ? 'common.greyLight' : ''}
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
                              // error={!!errors.mainFields[key]}
                              // helperText={errors.mainFields[key]}
                              value={values.mainFields[key]}
                              // color={!errors.mainFields[key] && errors.mainFields[key] ? 'success' : ''}
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <BaseSelect
                              id={`mainFields.${key}NotationId`}
                              name={`mainFields.${key}NotationId`}
                              onChange={(value) =>
                                setFieldValue(`mainFields.${key}NotationId`, value)
                              }
                              items={currencyOptions}
                              sx={{ minWidth: 50, marginBottom: 0 }}
                              initvalue={values.mainFields[key + 'NotationId'] || ''}
                              // error={!!errors.interestRateNotation}
                              // helperText={errors.interestRateNotation}
                              // color={
                              //   !errors.interestRateNotation && values.annualFeeNotation
                              //     ? 'success'
                              //     : ''
                              // }
                            />
                          </Grid>
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
                onChange={handleChange}
                error={!!errors.aditional}
                helperText={errors.aditional}
                value={values.aditional}
                placeholder="Add description"
                // color={!errors.aditional && values.aditional ? 'common.greyLight' : ''}
              />
              <Typography
                style={{ fontWeight: 500 }}
                variant="body2"
                color={'common.darkPurple'}
                sx={{ mt: 3 }}>
                {t('fields.howToApply')}
              </Typography>

              <RichTextEditor
                value={applyText}
                onChange={(editorState) => setApplyText(editorState)}
              />

              <Grid container spacing={2} mt={2}>
                <Grid item xs={8} sx={{ display: 'flex' }}>
                  {primaryProductTags?.filter(
                    (tag) =>
                      tag.categoryId === categoryId ||
                      tag.categoryId === state?.categoryId ||
                      tag.categoryId === selectedCat ||
                      tag.categoryId === values.categoryId
                  ).length > 0 && (
                    <>
                      <LocalOfferIcon />
                      <Typography
                        style={{ fontWeight: 500 }}
                        sx={{ ml: 2 }}
                        variant="body2"
                        color={'common.darkPurple'}>
                        {t('fields.primaryTag')}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid item>
                  <ToggleButtonGroup
                    disabled={lang === 'ar'}
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.primaryTags}
                    onChange={(e, newValues) => {
                      setPrimaryTags(newValues)
                      setFieldValue('primaryTags', newValues)
                    }}>
                    {primaryProductTags
                      ?.filter(
                        (tag) =>
                          tag.categoryId === categoryId ||
                          tag.categoryId === state?.categoryId ||
                          tag.categoryId === selectedCat ||
                          tag.categoryId === values.categoryId
                      )
                      ?.map((tag) => {
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
                {getFilterTagsToShow()?.length > 0 && (
                  <Grid item xs={8} sx={{ display: 'flex' }}>
                    <LocalOfferIcon />
                    <Typography
                      sx={{ ml: 2 }}
                      variant="body2"
                      color={'common.darkPurple'}
                      style={{ fontWeight: 500 }}>
                      {t('fields.filterTag')}
                    </Typography>
                  </Grid>
                )}
                <Grid item>
                  <ToggleButtonGroup
                    disabled={lang === 'ar'}
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.filterTags}
                    onChange={(e, newValues) => {
                      setFilterTagsTags(newValues)
                      setFieldValue('filterTags', newValues)
                    }}>
                    {getFilterTagsToShow()?.map((tag) => (
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

              <DisablePermissions permission={'write:product'} disable>
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
        {/* )} */}
      </Box>
      <BaseModel
        open={delOpen}
        handleClose={() => setDelOpen(false)}
        text={t('delConfirmation')}
        handleSuccess={handleDeletion}
      />
    </>
  )
}
export default ProductDetails;
