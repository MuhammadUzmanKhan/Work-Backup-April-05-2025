import { Grid, InputLabel, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect } from 'react'
import { Formik } from 'formik'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { quizTypes } from 'utils/staticValues'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategory } from 'store/actions/products'
import { getQuizById, getQuizTags } from 'store/actions/quizes'
import { getResources } from 'store/actions/resources'
import { useLocation, useParams } from 'react-router-dom'
import PageLoading from 'components/PageLoading'
import ValidationCheckbox from 'components/formControl/ValidationCheckbox'
import { setQuizStateValue } from 'store/reducers/quizes'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import palette from 'theme/palette'

function QuizzesPublishedViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const isPublished = pathname.split('/').at(-1) === 'published'
  const dispatch = useDispatch()
  const { productCategory } = useSelector((state) => state.products)
  const { tags } = useSelector((state) => state.quizes)
  const { resources } = useSelector((state) => state.resources)
  const { quiz, quizLoading, error } = useSelector((state) => state.quizes)
  const lang = useSelector(selectLanguage)

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    if (id) {
      dispatch(getQuizById({ id: isPublished ? `${id}/published` : id }))
    }
  }, [lang])

  useEffect(async () => {
    if (id) {
      dispatch(getQuizById({ id: isPublished ? `${id}/published` : id }))
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

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        {quiz?.metaInfo && (
          <Typography
            sx={{ marginBottom: '16px' }}
            variant="h6"
            color={palette.variables.darkPurple}>
            {isPublished
              ? `Published Version ${quiz?.metaInfo?.publishedVersion}`
              : `Current Version ${quiz?.metaInfo?.version}`}
          </Typography>
        )}
        <Box sx={{ display: 'flex' }}>
          <ToggleButton
            sx={{
              display: 'flex',
              gap: '8px',
              overflow: 'auto',
              marginRight: '30px',
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
      {!quizLoading ? (
        <Formik initialValues={initialState}>
          {({ values, setFieldValue }) => (
            <form>
              <Box sx={{ mt: 5 }}>
                <BaseSelect
                  name="type"
                  label={t('fields.type')}
                  items={quizTypes}
                  initvalue={values.type}
                  sx={{ width: '100%', marginBottom: 0, ml: 0 }}
                  translation={true}
                  disabled
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
                  disabled
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
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} md={11}>
                    <BaseTextField
                      sx={{ mt: 0 }}
                      fullWidth
                      value={values.multipleAnswer1}
                      id="multipleAnswer"
                      name="multipleAnswer1"
                      placeholder={t('fields.someText')}
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                  disabled
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
                  disabled
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
                    disabled
                    value={values.checkbox}
                  />
                </Box>
                <BaseSelect
                  name="guidebook"
                  items={resources}
                  initvalue={quiz?.guidebookId || resources[0]?.id}
                  sx={{ width: '100%', marginBottom: 0, m: 0 }}
                  setInitialValue={(value) => setFieldValue('guidebook', value)}
                  disabled
                />
                <Box sx={{ mt: 5 }}>
                  <InputLabel sx={{ mt: 6 }} variant="outlined">
                    {t('admin.productCategory')}
                  </InputLabel>
                  <ToggleButtonGroup
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.products}
                    disabled>
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
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.quizTagIds}
                    disabled>
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
            </form>
          )}
        </Formik>
      ) : (
        <PageLoading loading={quizLoading} />
      )}
    </>
  )
}

export default QuizzesPublishedViewPage
