import {
  Grid,
  InputLabel,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { quizTypes } from 'utils/staticValues'
import { useTranslation } from 'react-i18next'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategory } from 'store/actions/products'
import {
  createQuiz,
  deleteQuiz,
  getQuizById,
  getQuizLinksById,
  getQuizTags,
  updateQuiz
} from 'store/actions/quizes'
import { getResources } from 'store/actions/resources'
import { useNavigate, useParams } from 'react-router-dom'
import PageLoading from 'components/PageLoading'
import ValidationCheckbox from 'components/formControl/ValidationCheckbox'
import { setQuizStateValue } from 'store/reducers/quizes'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import DeleteIcon from '@mui/icons-material/Delete'
import CreatedByModal from 'components/modal/CreatedByModal'

import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LINKED_ENTITIES_TYPES } from 'utils/constants'
import BaseModel from 'components/modal/BaseModal'
import { infoFuncToast, successToast } from 'utils'

function QuizzesCreatePage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { productCategory } = useSelector((state) => state.products)
  const { tags } = useSelector((state) => state.quizes)
  const { resources } = useSelector((state) => state.resources)
  const { quiz, quizLoading, error } = useSelector((state) => state.quizes)
  const lang = useSelector(selectLanguage)
  const [open, setOpen] = useState(false)

  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const anchorRef = useRef(null)
  const [delLinksOpen, setDelLinksOpen] = useState(false)

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    if (id) {
      dispatch(getQuizById({ id }))
    }
  }, [lang])

  useEffect(async () => {
    if (id) {
      dispatch(getQuizById({ id }))
    } else {
      await dispatch(setQuizStateValue({ type: 'quizLoading', data: true }))
      dispatch(setQuizStateValue({ type: 'quiz', data: null }))
      dispatch(setQuizStateValue({ type: 'quizLoading', data: false }))
    }
    dispatch(fetchCategory())
    dispatch(getQuizTags())
    dispatch(getResources())
  }, [])

  const initialState = {
    type: quizTypes.find((q) => q.value === quiz?.answerType)?.id || 1,
    questions: lang === 'ar' && error ? '' : quiz?.question || '',
    multipleAnswer1:
      lang === 'ar' && error
        ? ''
        : (quiz?.choices && quiz.choices[Object.keys(quiz.choices)[0]]) || '',
    multipleAnswer2:
      lang === 'ar' && error
        ? ''
        : (quiz?.choices && quiz.choices[Object.keys(quiz.choices)[1]]) || '',
    multipleAnswer3:
      lang === 'ar' && error
        ? ''
        : (quiz?.choices && quiz.choices[Object.keys(quiz.choices)[2]]) || '',
    multipleAnswer4:
      lang === 'ar' && error
        ? ''
        : (quiz?.choices && quiz.choices[Object.keys(quiz.choices)[3]]) || '',
    multipleQuestions1: (quiz?.choices && Object.keys(quiz.choices)[0]) || '1',
    multipleQuestions2: (quiz?.choices && Object.keys(quiz.choices)[1]) || '2',
    multipleQuestions3: (quiz?.choices && Object.keys(quiz.choices)[2]) || '3',
    multipleQuestions4: (quiz?.choices && Object.keys(quiz.choices)[3]) || '4',
    correctAnswer: lang === 'ar' && error ? '' : quiz?.answers?.join(',') || '',
    guidebook: quiz?.guidebookId || '',
    checkbox: quiz?.guidebookId ? true : false,
    points: quiz?.points || 1,
    products: quiz?.categoryIds || [],
    quizTagIds: quiz?.quizTagIds || []
  }

  const PartnerCreateSchema = Yup.object().shape({
    type: Yup.number().required(t('validation.required')),
    questions: Yup.string().required(t('validation.required')),
    correctAnswer: Yup.string().required(t('validation.required')),
    multipleAnswer1: Yup.string().required(t('validation.required')),
    multipleAnswer2: Yup.string().when('type', {
      is: 1,
      then: Yup.string().required(t('validation.required'))
    })
  })

  const handleSubmit = (values) => {
    const quizData = {
      answerType: quizTypes.find((q) => q.id === values.type).value,
      question: values.questions,
      choices: {
        ...(values.multipleAnswer1 !== '' && {
          [values.multipleQuestions1]: values.multipleAnswer1
        }),
        ...(values.multipleAnswer2 !== '' && {
          [values.multipleQuestions2]: values.multipleAnswer2
        }),
        ...(values.multipleAnswer3 !== '' && {
          [values.multipleQuestions3]: values.multipleAnswer3
        }),
        ...(values.multipleAnswer4 !== '' && {
          [values.multipleQuestions4]: values.multipleAnswer4
        })
      },
      answers: values.correctAnswer.split(',').map((a) => a.toUpperCase()),
      guidebookId: values.checkbox ? values.guidebook : '',
      categoryIds: values.products,
      quizTagIds: values.quizTagIds,
      points: values.points
    }
    if (!id)
      dispatch(
        createQuiz({
          params: quizData,
          cb: (res) => {
            successToast('Quiz has created')
            navigate(`/quizzes/${res.id}`, { replace: true })
          }
        })
      )
    else
      dispatch(
        updateQuiz({
          id: lang === 'en' ? id : `${id}/i18n_data`,
          params: quizData,
          cb: () => {
            successToast('Quiz has updated')
            // navigate('/quizzes')
          }
        })
      )
  }

  const checkLink = async (id, reload = false) => {
    // setLoading(true)
    const data = await dispatch(getQuizLinksById({ id: `${id}/entity_links` }))
    if (data.payload) {
      if (!data.payload.length && !reload) {
        setDelLinksOpen(false)
        setDelOpen(true)
      } else {
        setEntityLinks([...data.payload])
        // setDelLinksOpen(true)
        infoFuncToast('You need to unlink Guidebook below and save it.')
      }
    }
    // setLoading(false)
  }

  const goToFunction = async (id, type) => {
    // setLoading(true)
    if (type === LINKED_ENTITIES_TYPES.GUIDEBOOK) {
      anchorRef.current.href = `#/quizzes/${id}`
    }
    anchorRef.current.click()

    // setLoading(false)
  }

  const handleDeletion = () => {
    setDelOpen(false)
    // setLoading(true)
    dispatch(
      deleteQuiz({
        id,
        cb: async () => {
          successToast('Quiz has successfully deleted.')
          await dispatch(getQuizById({ id }))
          navigate(-1, { replace: true })
        },
        cbF: () => {}
      })
    )
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h3">{`${id ? t('admin.editQuiz') : t('admin.addQuiz')}`}</Typography>
        {id && (
          <Box display={'flex'} flexDirection={'column'}>
            <Box sx={{ display: 'flex' }}>
              <DisablePermissions disable={true} permission={'publish:quizqna'}>
                <ToggleButtonCustom
                  text={'Publish'}
                  disabled={quiz?.metaInfo?.version === quiz?.metaInfo?.publishedVersion}
                  onChange={() => {
                    dispatch(
                      updateQuiz({
                        id: `${id}/publish`,
                        cb: () => {
                          dispatch(getQuizById({ id }))
                          successToast('Quiz has been published.')
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
                  // marginRight: '30px',
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
              {(quiz?.metaInfo?.publishedVersion || quiz?.metaInfo?.lastModifiedBy) && (
                <>
                  <ToggleButton
                    sx={{
                      display: 'flex',
                      gap: '8px',
                      overflow: 'auto',
                      // marginBottom: '15px',
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
                      info={quiz?.metaInfo}
                    />
                  )}
                </>
              )}
              <Box
                sx={{
                  display: 'flex'
                }}>
                <IconButton
                  aria-label="delete"
                  onClick={() => {
                    checkLink(id)
                  }}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Box>
            </Box>
            <Box display={'flex'} justifyContent={'flex-end'} mt={1}>
              <>
                {(quiz?.metaInfo?.version || quiz?.metaInfo?.version === 0) && (
                  <Typography
                    color={palette.variables.orange}
                    variant="caption"
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                    onClick={() => navigate(`/quizzes/published/${id}/current`)}>
                    {`(Current ${quiz?.metaInfo?.version})`}
                  </Typography>
                )}
                {(quiz?.metaInfo?.publishedVersion || quiz?.metaInfo?.publishedVersion === 0) && (
                  <Typography
                    color={palette.variables.orange}
                    variant="caption"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/quizzes/published/${id}/published`)}>
                    {`(Published ${quiz?.metaInfo?.publishedVersion})`}
                  </Typography>
                )}
              </>
            </Box>
          </Box>
        )}
      </Box>
      {!quizLoading ? (
        <Formik
          validateOnChange={false}
          initialValues={initialState}
          validationSchema={PartnerCreateSchema}
          onSubmit={handleSubmit}>
          {({ values, handleChange, handleSubmit, setFieldValue, errors }) => (
            <form onSubmit={handleSubmit}>
              <Box sx={{ mt: 5 }}>
                <BaseSelect
                  name="type"
                  label={t('fields.type')}
                  items={quizTypes}
                  initvalue={values.type}
                  sx={{ width: '100%', marginBottom: 0, ml: 0 }}
                  onChange={(value) => {
                    setFieldValue('type', value)
                  }}
                  translation={true}
                  disabled={lang === 'ar'}
                />

                <InputLabel sx={{ mt: 6 }} variant="outlined">
                  {t('fields.question')}
                </InputLabel>
                <BaseTextField
                  sx={{ mt: 0 }}
                  fullWidth
                  placeholder={t('fields.someText')}
                  id="questions"
                  name="questions"
                  value={values.questions}
                  onChange={handleChange}
                  error={!!errors.questions}
                  helperText={errors.questions}
                  color={!errors.questions && values.questions ? 'success' : ''}
                />
                <InputLabel sx={{ mt: 6 }} variant="outlined">
                  {t('fields.multipleAnswer')}
                </InputLabel>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={1}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleQuestions1"
                      name="multipleQuestions1"
                      placeholder="A"
                      value={values.multipleQuestions1}
                      onChange={handleChange}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} md={11}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      value={values.multipleAnswer1}
                      onChange={handleChange}
                      id="multipleAnswer"
                      name="multipleAnswer1"
                      placeholder={t('fields.someText')}
                      error={!!errors.multipleAnswer1}
                      helperText={errors.multipleAnswer1}
                      color={!errors.multipleAnswer1 && values.multipleAnswer1 ? 'success' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleQuestions2"
                      name="multipleQuestions2"
                      placeholder="B"
                      value={values.multipleQuestions2}
                      onChange={handleChange}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} md={11}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleAnswer2"
                      name="multipleAnswer2"
                      placeholder={t('fields.someText')}
                      value={values.multipleAnswer2}
                      onChange={handleChange}
                      error={!!errors.multipleAnswer2}
                      helperText={errors.multipleAnswer2}
                      color={!errors.multipleAnswer2 && values.multipleAnswer2 ? 'success' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleQuestions3"
                      name="multipleQuestions3"
                      placeholder="C"
                      value={values.multipleQuestions3}
                      onChange={handleChange}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} md={11}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleAnswer3"
                      name="multipleAnswer3"
                      placeholder={t('fields.someText')}
                      value={values.multipleAnswer3}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleQuestions4"
                      name="multipleQuestions4"
                      placeholder="D"
                      value={values.multipleQuestions4}
                      onChange={handleChange}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} md={11}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      id="multipleAnswer4"
                      name="multipleAnswer4"
                      placeholder={t('fields.someText')}
                      value={values.multipleAnswer4}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>

                <InputLabel sx={{ mt: 6 }} variant="outlined">
                  {t('fields.correctAnswer')}
                </InputLabel>
                <BaseTextField
                  sx={{ mt: 0 }}
                  fullWidth
                  id="correctAnswer"
                  name="correctAnswer"
                  placeholder={t('fields.someText')}
                  value={values.correctAnswer}
                  onChange={handleChange}
                  error={!!errors.correctAnswer}
                  helperText={errors.correctAnswer}
                  color={!errors.correctAnswer && values.correctAnswer ? 'success' : ''}
                />

                <InputLabel sx={{ mt: 6 }} variant="outlined">
                  {t('fields.points')}
                </InputLabel>
                <BaseTextField
                  sx={{ mt: 0 }}
                  fullWidth
                  id="points"
                  name="points"
                  placeholder={1}
                  value={values.points}
                  onChange={handleChange}
                  disabled={lang === 'ar'}
                />

                <Box display={'flex'} alignItems={'center'}>
                  <InputLabel sx={{ mt: 6 }} variant="outlined">
                    {t('fields.linkedToGuideBook') + t('fields.questionSign')}
                  </InputLabel>
                  <ValidationCheckbox
                    defaultChecked={values.checkbox}
                    name="checkbox"
                    sx={{ paddingBottom: 0, paddingTop: 1, paddingLeft: 2 }}
                    id="checkbox"
                    onChange={handleChange}
                    value={values.checkbox}
                    disabled={lang === 'ar'}
                  />
                </Box>
                <BaseSelect
                  name="guidebook"
                  items={resources}
                  initvalue={quiz?.guidebookId || resources[0]?.id}
                  sx={{ width: '100%', marginBottom: 0, m: 0 }}
                  onChange={(value) => setFieldValue('guidebook', value)}
                  setInitialValue={(value) => setFieldValue('guidebook', value)}
                  disabled={!values.checkbox || lang === 'ar'}
                />
                <Box sx={{ mt: 5 }}>
                  <InputLabel sx={{ mt: 6 }} variant="outlined">
                    {t('admin.productCategory')}
                  </InputLabel>
                  <ToggleButtonGroup
                    disabled={lang === 'ar'}
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.products}
                    onChange={(e, newValues) => {
                      setFieldValue('products', newValues)
                    }}>
                    {productCategory.map((product) => (
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
                <Box sx={{ mt: 5 }}>
                  <InputLabel sx={{ mt: 6 }} variant="outlined">
                    {t('admin.tags')}
                  </InputLabel>
                  <ToggleButtonGroup
                    disabled={lang === 'ar'}
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.quizTagIds}
                    onChange={(e, newValues) => {
                      setFieldValue('quizTagIds', newValues)
                    }}>
                    {tags.map((product) => (
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
              </Box>
              <DisablePermissions permission={'write:quizqna'} disable>
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
      ) : (
        <PageLoading loading={quizLoading} />
      )}
      <DeletionModal
        open={delLinksOpen}
        handleClose={() => setDelLinksOpen(false)}
        list={entityLinks}
        text={ENTITY_DELETION_STATEMENT}
        onPressGoTo={(tagId, type) => goToFunction(id, type)}
        onReload={() => checkLink(id, true)}
      />
      <BaseModel
        open={delOpen}
        handleClose={() => setDelOpen(false)}
        text={t('delConfirmation')}
        handleSuccess={handleDeletion}
      />
      <a ref={(r) => (anchorRef.current = r)} target="_blank"></a>
    </>
  )
}

export default QuizzesCreatePage
