import React, { useEffect, useState } from 'react';
import { Box, Grid, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Formik, FieldArray } from 'formik'

import { useDispatch, useSelector } from 'react-redux'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import { editCategoryById, fetchCategoryById } from 'store/actions/products'

import styles from '../admin.module.scss'
import { filterQuestionTypes } from 'utils/staticValues'
import { getFilterTags } from 'store/actions/tag'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { failureToast, successToast } from 'utils'
import FilterMultiple from 'components/filterQuestion/multiple/Multiple'
import FilterSingle from 'components/filterQuestion/single/Single'
import FilterRange from 'components/filterQuestion/range/Range'
import { useParams } from 'react-router-dom'
import PageLoading from 'components/PageLoading'
import FilterCheckbox from 'components/filterQuestion/checkbox/Checkbox'
import { Permissions } from 'components/Permissions'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import { NumToString, StringToNum } from 'utils/functions'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { arrayMoveImmutable } from 'array-move'
// import DragHandleIcon from '@mui/icons-material/DragHandle'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

const FilterDetailsPage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [, setSelected] = useState()
  const [category, setCategory] = useState()
  const [filters, setFilter] = useState([])
  const [add, setAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSave, setShowSave] = useState(false)
  const lang = useSelector(selectLanguage)
  const [list, setList] = useState([])

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  const SortableItem = SortableElement(
    ({ q, _index: index, values, handleChange, setFieldValue }) => {
      if (q.type === 'qa') {
        return (
          <Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography variant="bodyBig" component="p" my={2}>
                {t('fields.question')} {index + 1}
              </Typography>
              <button
                type="button"
                onClick={() => {
                  setFieldValue(
                    `filters`,
                    values.filters.filter((a, i) => i !== index)
                  )
                }}
                style={{
                  border: 0,
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  marginLeft: '10px'
                }}>
                <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
              </button>
              <DragHandle />
            </Box>

            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="productCategory"
              label={t('fields.filterQuestion')}
              name="filterQuestion"
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `filters[${index}].question`,
                    value: e.target.value
                  }
                })
              }}
              value={q?.question}
            />

            <BaseSelect
              name="questionType"
              label={t('fields.questionType')}
              items={filterQuestionTypes}
              initvalue={filterQuestionTypes.find((ques) => ques.value === q.answerType).id}
              sx={{ width: '100%', marginBottom: 0 }}
              onChange={(value) => setFieldValue('questionType', value)}
              disabled={true}
              translation={true}
            />

            {q.answerType === 'MULTIPLE' ? (
              <FieldArray
                name="selections"
                render={() => (
                  <div style={{ width: '100%' }}>
                    {q.answers?.map((item, _index) => {
                      return (
                        <Grid container key={_index} alignItems="center" mt={3}>
                          <Grid item xs={10}>
                            <BaseTextField
                              key={_index}
                              InputLabelProps={{ required: false }}
                              sx={{ marginBottom: '24px' }}
                              margin="normal"
                              fullWidth
                              id="selection"
                              label={`${t('fields.selection')} ${_index + 1}`}
                              name={`selections[${_index}].title`}
                              onChange={(e) => {
                                handleChange({
                                  ...e,
                                  target: {
                                    name: `filters[${index}].answers[${_index}].answer`,
                                    value: e.target.value
                                  }
                                })
                              }}
                              value={item.answer}
                            />
                          </Grid>
                          <Grid item xs={2} pl={2}>
                            <Box
                              style={{
                                width: '70px',
                                display: 'flex',
                                justifyContent: 'right'
                              }}>
                              {q.answers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFieldValue(
                                      `filters[${index}].answers`,
                                      values.filters[index].answers.filter((a, i) => i !== _index)
                                    )
                                  }}
                                  style={{
                                    border: 0,
                                    backgroundColor: '#fff',
                                    borderRadius: '20px'
                                  }}>
                                  <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
                                </button>
                              )}
                              {_index == q.answers.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFieldValue(`filters[${index}].answers`, [
                                      ...values.filters[index].answers,
                                      { answer: '' }
                                    ])
                                  }
                                  style={{
                                    border: 0,
                                    backgroundColor: '#fff',
                                    borderRadius: '20px'
                                  }}>
                                  <AddCircleOutlineOutlinedIcon sx={{ color: 'common.green' }} />
                                </button>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      )
                    })}
                  </div>
                )}
              />
            ) : (
              q?.answers?.map((item, _index) => (
                <Grid container alignItems="center" mt={3} key={index}>
                  <Grid item xs={5}>
                    <BaseTextField
                      InputLabelProps={{ required: false }}
                      sx={{ marginBottom: '24px' }}
                      margin="normal"
                      fullWidth
                      id="selectionTags2"
                      name="selectionTags2"
                      label={`${t('fields.selection')} ${_index + 1}`}
                      onChange={(e) => {
                        handleChange({
                          ...e,
                          target: {
                            name: `filters[${index}].answers[${_index}].answer`,
                            value: e.target.value
                          }
                        })
                      }}
                      value={item.answer}
                    />
                  </Grid>
                  <Grid item xs={5} pl={2}>
                    <BaseSelect
                      name="selectionTags12"
                      label={`${t('fields.tag')} ${_index + 1}`}
                      items={filters.filter((filter) => !!filter.value)}
                      initvalue={filters.find((filter) => filter.id === item.tag?.id)?.id}
                      sx={{ width: '100%', marginBottom: '12px' }}
                      onChange={(e) =>
                        setFieldValue(`filters[${index}].answers[${_index}].tag.id`, e)
                      }
                    />
                  </Grid>
                  <Grid item xs={2} pl={2}>
                    <Box
                      style={{
                        width: '70px',
                        display: 'flex',
                        justifyContent: 'right'
                      }}>
                      {q.answers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFieldValue(
                              `filters[${index}].answers`,
                              values.filters[index].answers.filter((a, i) => i !== _index)
                            )
                          }}
                          style={{
                            border: 0,
                            backgroundColor: '#fff',
                            borderRadius: '20px'
                          }}>
                          <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
                        </button>
                      )}
                      {_index == q.answers.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFieldValue(`filters[${index}].answers`, [
                              ...values.filters[index].answers,
                              { answer: '' }
                            ])
                          }}
                          style={{
                            border: 0,
                            backgroundColor: '#fff',
                            borderRadius: '20px'
                          }}>
                          <AddCircleOutlineOutlinedIcon sx={{ color: 'common.green' }} />
                        </button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              ))
            )}

            <br />
          </Box>
        )
      } else if (q.type === 'slider') {
        return (
          <Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography variant="bodyBig" component="p" my={2}>
                {t('fields.question')} {index + 1}
              </Typography>
              <button
                type="button"
                onClick={() => {
                  setFieldValue(
                    `filters`,
                    values.filters.filter((a, i) => i !== index)
                  )
                }}
                style={{
                  border: 0,
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  marginLeft: '10px'
                }}>
                <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
              </button>
              <DragHandle />
            </Box>

            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="productCategory2"
              label={t('fields.filterQuestion')}
              name="filterQuestion2"
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `filters[${index}].label`,
                    value: e.target.value
                  }
                })
              }}
              value={q.label}
            />
            <BaseSelect
              name="questionType2"
              label={t('fields.questionType')}
              items={filterQuestionTypes}
              initvalue={filterQuestionTypes.find((ques) => ques.value === 'SLIDER').id}
              sx={{ width: '100%', marginBottom: 0 }}
              onChange={(value) => setFieldValue('questionType2', value)}
              disabled={true}
              translation={true}
            />
            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="minimumValue"
              label={t('fields.minimumValue')}
              name="minimumValue"
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `filters[${index}].lower`,
                    // value:  isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value)
                    value: StringToNum(e.target.value) ? StringToNum(e.target.value) : '0'
                    // value: e.target.value
                  }
                })
              }}
              value={NumToString(q.lower)}
            />
            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="maximumValue"
              label={t('fields.maximumValue')}
              name="maximumValue"
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `filters[${index}].higher`,
                    value: StringToNum(e.target.value) ? StringToNum(e.target.value) : '0'
                  }
                })
              }}
              value={NumToString(q.higher)}
            />
            <ToggleButtonGroup
              sx={{ flexWrap: 'wrap', gap: '7px' }}
              color="primary"
              value={q.tags.map((tag) => tag.id)}
              onChange={(event, value) => {
                handleChange({
                  ...event,
                  target: {
                    name: `filters[${index}].tags`,
                    value: filters.filter((f) => !!value.find((id) => id == f.id))
                  }
                })
              }}>
              {filters
                .filter((filter) => !!filter.valueSuffix)
                ?.map((_filter) => (
                  <ToggleButton
                    sx={{
                      display: 'flex',
                      gap: '8px',
                      overflow: 'auto',
                      marginBottom: '15px',
                      flexWrap: 'nowrap',
                      width: 'max-content'
                    }}
                    selected={q.tags.map((tag) => tag.id).includes(_filter.id)}
                    key={_filter.id}
                    value={_filter.id}>
                    {_filter.valueSuffix}
                  </ToggleButton>
                ))}
            </ToggleButtonGroup>

            <br />
          </Box>
        )
      } else if (q.type === 'checkboxes') {
        return (
          <Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography variant="bodyBig" component="p" my={2}>
                {t('fields.question')} {index + 1}
              </Typography>
              <button
                type="button"
                onClick={() => {
                  setFieldValue(
                    `filters`,
                    values.filters.filter((a, i) => i !== index)
                  )
                }}
                style={{
                  border: 0,
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  marginLeft: '10px'
                }}>
                <RemoveCircleOutlineOutlinedIcon sx={{ color: 'common.error' }} />
              </button>
              <DragHandle />
            </Box>

            <BaseTextField
              InputLabelProps={{ required: false }}
              sx={{ marginBottom: '24px' }}
              margin="normal"
              fullWidth
              id="productCategory4"
              label={t('fields.filterQuestion')}
              name="productCategory4"
              onChange={(e) => {
                handleChange({
                  ...e,
                  target: {
                    name: `filters[${index}].label`,
                    value: e.target.value
                  }
                })
              }}
              value={q.label}
            />
            <BaseSelect
              name="questionType4"
              label={t('fields.questionType')}
              items={filterQuestionTypes}
              initvalue={filterQuestionTypes.find((ques) => ques.value === 'CHECKBOXES').id}
              sx={{ width: '100%', marginBottom: 0 }}
              onChange={(value) => setFieldValue('questionType4', value)}
              disabled={true}
              translation={true}
            />
            <br />
            <br />
            <BaseSelect
              name="tag"
              label={t('fields.tag')}
              items={filters.filter((filter) => !!filter.value)}
              initvalue={q.tag.id}
              sx={{ width: '100%', marginBottom: 0 }}
              onChange={(value) => {
                setFieldValue(`filters[${index}].tag.id`, value)
              }}
            />

            <br />
          </Box>
        )
      }
    }
  )

  const SortableList = SortableContainer(({ items, values, handleChange, setFieldValue }) => {
    return (
      <div>
        {items.map((q, index) => (
          <SortableItem
            key={`item-${index}`}
            index={index}
            _index={index}
            q={q}
            values={values}
            handleChange={handleChange}
            setFieldValue={setFieldValue}
          />
        ))}
      </div>
    )
  })

  const DragHandle = SortableHandle(() => <DragIndicatorIcon />)

  const onSortEnd = (oldIndex, newIndex, filters, setFieldValue) => {
    let newList = arrayMoveImmutable(filters, oldIndex, newIndex)
    const oldDisplay = newList[newIndex].displayIndex
    const newDisplay = newList[oldIndex].displayIndex
    newList[newIndex].displayIndex = newDisplay
    newList[oldIndex].displayIndex = oldDisplay
    setFieldValue('filters', [...newList])
  }

  const newQuesInitial = {
    newQuestionType: filterQuestionTypes?.[0]?.id,
    question: '',
    multiple: {
      answerType: 'MULTIPLE',
      answers: [
        {
          answer: ''
        }
      ]
    },
    single: {
      answerType: 'SINGLE',
      answers: [
        {
          answer: '',
          tag: ''
        }
      ]
    },
    ranges: {
      label: '',
      lower: 0,
      higher: 10000,
      suffix: 'BHD',
      tags: []
    },
    checkboxes: { tag: { id: '' } }
  }

  useEffect(() => {
    if (
      category?.filter?.productFilterQnAs.length ||
      category?.filter?.productFilterRanges.length ||
      category?.filter?.productFilterCheckBoxes.length
    ) {
      const { filter } = category
      const temp = [
        ...filter.productFilterQnAs.map((q) => {
          return { ...q, type: 'qa' }
        }),
        ...filter.productFilterRanges.map((q) => {
          return { ...q, type: 'slider' }
        }),
        ...filter.productFilterCheckBoxes.map((q) => {
          return { ...q, type: 'checkboxes' }
        })
      ].sort((a, b) => (a.displayIndex > b.displayIndex ? 1 : -1))
      setList([...temp])
    }
  }, [category])

  const initialState = {
    ...newQuesInitial,
    filters: list || []
  }

  useEffect(async () => {
    let dataName = await dispatch(fetchCategoryById({ id }))
    setCategory(dataName.payload)
    if (
      dataName.payload?.filter?.productFilterQnAs.length ||
      dataName.payload?.filter?.productFilterRanges.length ||
      dataName.payload?.filter?.productFilterCheckBoxes.length
    ) {
      setShowSave(true)
    }
    setSelected(dataName.payload)
    setLoading(false)
    const data = await dispatch(getFilterTags())
    setFilter(data.payload)
  }, [lang])

  const getDisplayIndex = (values) => {
    let displayIndex = -1

    values.filters.forEach((item) => {
      if (item.displayIndex > displayIndex) displayIndex = item.displayIndex
    })

    return displayIndex + 1
  }

  const handleSubmit = async (values, { setValues }) => {
    let rangeError = false
    setLoading(true)
    const displayIndex = getDisplayIndex(values)
    let productFilterQnAs = [...values.filters.filter((q) => q.type === 'qa')]
    let productFilterRanges = [...values.filters.filter((q) => q.type === 'slider')]
    let productFilterCheckBoxes = [...values.filters.filter((q) => q.type === 'checkboxes')]

    if (add && (values.newQuestionType === 1 || values.newQuestionType === 2)) {
      productFilterQnAs = [
        ...productFilterQnAs,
        {
          ...values[
            `${filterQuestionTypes
              .find((t) => t.id === values.newQuestionType)
              .value.toLowerCase()}`
          ],
          question: values.question,
          displayIndex
        }
      ]
    } else if (add && values.newQuestionType === 3) {
      productFilterRanges = [
        ...productFilterRanges,
        {
          ...values[`${filterQuestionTypes.find((t) => t.id === values.newQuestionType).name}`],
          label: values.question,
          displayIndex
        }
      ]
    } else if (add && values.newQuestionType === 4) {
      productFilterCheckBoxes = [
        ...productFilterCheckBoxes,
        {
          ...values[`${filterQuestionTypes.find((t) => t.id === values.newQuestionType).name}`],
          label: values.question,
          displayIndex
        }
      ]
    }

    try {
      const params = {
        productFilterQnAs:
          productFilterQnAs?.map((q) =>
            q.answerType === 'SINGLE'
              ? {
                  ...q,
                  answers: q.answers.map((ans) => {
                    return { answer: ans.answer, ...(ans.tag?.id && { tagId: ans.tag?.id }) }
                  })
                }
              : { ...q }
          ) || [],
        productFilterRanges:
          productFilterRanges?.map((q) => {
            if (StringToNum(q.lower) > StringToNum(q.higher)) rangeError = true
            const ques = {
              ...q,
              suffix: 'BHD',
              lower: StringToNum(q.lower),
              higher: StringToNum(q.higher),
              tagIds: q.tags.map((tag) => tag.id) || []
            }
            delete ques.tags
            return ques
          }) || [],
        productFilterCheckBoxes:
          productFilterCheckBoxes?.map((q) => {
            return {
              displayIndex: q.displayIndex,
              label: q.label,
              tagId: q.tag?.id || ''
            }
          }) || []
      }
      if (rangeError) {
        failureToast("Slider's maximum value should be greater than or equal to minimum value")
        setLoading(false)
        return
      }
      await dispatch(
        editCategoryById({
          id: `${id}/filter`,
          params,
          cb: () => {
            successToast('Saved')
            setAdd(false)
            if (
              !productFilterQnAs.length &&
              !productFilterRanges.length &&
              !productFilterCheckBoxes.length
            ) {
              setShowSave(false)
            } else {
              setShowSave(true)
            }
            setLoading(false)
            setValues({
              filters: values.filters,
              ...newQuesInitial
            })
          }
        })
      )
      let dataName = await dispatch(fetchCategoryById({ id }))
      setCategory(dataName.payload)
      if (
        dataName.payload?.filter?.productFilterQnAs.length ||
        dataName.payload?.filter?.productFilterRanges.length ||
        dataName.payload?.filter?.productFilterCheckBoxes.length
      ) {
        setShowSave(true)
      }
      setSelected(dataName.payload)
      setLoading(false)
      const data = await dispatch(getFilterTags())
      setFilter(data.payload)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
    setLoading(false)
  }

  return (
    <Box className={styles.cardProduct}>
      <Formik initialValues={initialState} enableReinitialize onSubmit={handleSubmit}>
        {({ values, handleChange, handleSubmit, setFieldValue, setValues }) => (
          <form onSubmit={handleSubmit}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} mb={2}>
              <Typography variant="bodyBig" component="p" color="common.darkPurple" my={3}>
                {t('admin.filters')}
              </Typography>
              <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
                <ToggleButton
                  sx={{
                    display: 'flex',
                    gap: '8px',
                    overflow: 'auto',
                    marginRight: '10px',
                    flexWrap: 'nowrap',
                    width: '100px',
                    height: '45px'
                  }}
                  selected={lang !== 'en'}
                  onChange={() => {
                    dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                  }}
                  value={'check'}>
                  {lang !== 'en' ? 'English' : 'Arabic'}
                </ToggleButton>
                <Permissions permission={'write:filter'}>
                  <BaseButton
                    customColor={palette.variables.orange}
                    variant="contained"
                    element={t('addQuestion')}
                    sx={{
                      display: 'block',
                      width: 'max-content',
                      height: 'max-content',
                      marginLeft: 3
                    }}
                    onClick={() => {
                      setAdd(true)
                    }}
                  />
                </Permissions>
              </Grid>
            </Box>
            {add && (
              <Box
                mb={5}
                sx={{ boxShadow: '0 1px 8px rgb(0 0 0 / 0.2)', borderRadius: 2, padding: 5 }}>
                <Box display={'flex'} alignItems={'center'}>
                  <Typography variant="bodyBig" component="p" my={2}>
                    {t('admin.newQuestion')}
                  </Typography>
                  <BaseButton
                    customColor={palette.variables.orange}
                    type="button"
                    onClick={() => {
                      setValues({
                        // productFilterQnAs: [...values.productFilterQnAs],
                        // productFilterRanges: [...values.productFilterRanges],
                        // productFilterCheckBoxes: [...values.productFilterCheckBoxes],
                        filters: [...values.filters],
                        ...newQuesInitial
                      })
                      setAdd(false)
                    }}
                    fullWidth
                    variant="contained"
                    element={t('cancel')}
                    sx={{ display: 'block', width: 100, margin: 2, marginLeft: 4 }}
                  />
                </Box>
                <BaseTextField
                  InputLabelProps={{ required: false }}
                  sx={{ marginBottom: '24px' }}
                  margin="normal"
                  fullWidth
                  id="productCategory"
                  label={t('fields.filterQuestion')}
                  name="filterQuestion"
                  onChange={(e) => {
                    handleChange({
                      ...e,
                      target: {
                        name: `question`,
                        value: e.target.value
                      }
                    })
                  }}
                  value={values.question}
                />
                <BaseSelect
                  name="questionType"
                  label={t('fields.questionType')}
                  items={filterQuestionTypes}
                  initvalue={filterQuestionTypes?.[0]?.id}
                  sx={{ width: '100%', marginBottom: 0 }}
                  onChange={(value) => setFieldValue('newQuestionType', value)}
                  translation={true}
                />
                {values.newQuestionType === filterQuestionTypes?.[0]?.id && (
                  <FilterMultiple
                    setFieldValue={setFieldValue}
                    handleChange={handleChange}
                    multiple={values.multiple}
                  />
                )}
                {values.newQuestionType === filterQuestionTypes?.[1]?.id && (
                  <FilterSingle
                    setFieldValue={setFieldValue}
                    handleChange={handleChange}
                    single={values.single}
                    filters={filters}
                  />
                )}
                {values.newQuestionType === filterQuestionTypes?.[2]?.id && (
                  <FilterRange
                    setFieldValue={setFieldValue}
                    handleChange={handleChange}
                    ranges={values.ranges}
                    filters={filters}
                  />
                )}
                {values.newQuestionType === filterQuestionTypes?.[3]?.id && (
                  <FilterCheckbox
                    setFieldValue={setFieldValue}
                    handleChange={handleChange}
                    checkboxes={values.checkboxes}
                    filters={filters}
                  />
                )}
              </Box>
            )}
            <SortableList
              useDragHandle={true}
              items={values.filters}
              onSortEnd={({ oldIndex, newIndex }) =>
                onSortEnd(oldIndex, newIndex, values.filters, setFieldValue)
              }
              values={values}
              handleChange={handleChange}
              setFieldValue={setFieldValue}></SortableList>

            {((category?.filter?.productFilterQnAs.length === 0 &&
              category?.filter?.productFilterRanges.length === 0 &&
              category?.filter?.productFilterCheckBoxes.length === 0 &&
              !add) ||
              !category?.filter) && (
              <Box display={'flex'} justifyContent={'center'}>
                <Typography variant="bodyBig" component="p" color="common.darkPurple" my={3}>
                  {'No filter questions are added yet.'}
                </Typography>
              </Box>
            )}
            <DisablePermissions permission={'write:filter'} disable>
              {(showSave || add) && (
                <BaseButton
                  customColor={palette.variables.darkPurple}
                  type="submit"
                  fullWidth
                  variant="contained"
                  element={t('save')}
                  sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
                />
              )}
            </DisablePermissions>
          </form>
        )}
      </Formik>
      <PageLoading loading={loading} />
    </Box>
  )
}

export default FilterDetailsPage;
