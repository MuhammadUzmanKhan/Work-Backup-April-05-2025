import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  FormControl,
  ToggleButtonGroup,
  ToggleButton
  // IconButton
} from '@mui/material'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getTags } from 'store/actions/tag'
import { Formik } from 'formik'
import { createFaq, getFaqById, updateFaqByExpert } from 'store/actions/faqs'
import PageLoading from 'components/PageLoading'
import { successToast } from 'utils'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
// import DeleteIcon from '@mui/icons-material/Delete'
// import { toast } from 'react-toastify'
import { ContentState, convertToRaw, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import draftjsToHtml from 'draftjs-to-html'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import { removeSpaces } from 'utils/functions'
import { fetchCategory } from 'store/actions/products'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'

function FaqCreatePage() {
  const { t } = useTranslation()
  const lang = useSelector(selectLanguage)
  const [searchParams] = useSearchParams()
  const { id, fid } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { tags } = useSelector((state) => state.faqs)
  const { loading: faqLoading, faq, error } = useSelector((state) => state.faqs)
  const { productCategory: categories } = useSelector((state) => state.products)

  const [ques, setQues] = useState('')
  const [ans, setAns] = useState(EditorState.createEmpty())
  console.log(ques, ans)
  const dispatch = useDispatch()


  // const reset = async () => {
  //   await dispatch(setLanguage('en'))
  //   // dispatch(getFaqsByExpert({ authorId: id }))
  //   dispatch(setStateValue({ type: 'faq', data: null }))
  //   dispatch(setStateValue({ type: 'error', data: null }))
  //   setQues('')
  //   setAns(EditorState.createEmpty())
  // }

  useEffect(async () => {
    if (searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    }
    dispatch(getTags())
    dispatch(fetchCategory())
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(() => {
    if (lang === 'ar' && error === null && faq !== null) {
      setQues(faq.question)
      setAns(getAnswer(faq.answer))
    }
  }, [lang, error, faq])

  useEffect(() => {
    if (+fid !== 0) {
      dispatch(getFaqById({ id: fid }))
    } else {
      // reset()
    }
  }, [lang])
  const FaqSchema = Yup.object().shape({
    question: Yup.string().required(t('validation.required'))
  })

  const getAnswer = (answer) => {
    const contentBlock = htmlToDraft(answer)
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      return EditorState.createWithContent(contentState)
    }
  }

  const handleSubmitFunc = (values) => {
    setLoading(true)
    const cb = async (res) => {
      successToast(`Faq has ${+fid === 0 ? 'created' : 'updated'}`)
      await dispatch(getFaqById({ id: res.id }))
      if (+fid === 0) navigate(`/experts/${id}/faq/${res.id}${searchParams.get('lang') && searchParams.get('lang') === 'ar' ? '?lang=ar' : ''}`, { replace: true })
    }
    if (+fid === 0) {
      dispatch(
        createFaq({
          params: {
            question: values.question,
            answer: removeSpaces(draftjsToHtml(convertToRaw(values.answer.getCurrentContent()))),
            authorId: id,
            faqTagIds: values._tags,
            categoryId: values.categoryId
          },
          cb
        })
      )
    } else {
      dispatch(
        updateFaqByExpert({
          id: fid,
          params: {
            question: values.question,
            answer: removeSpaces(draftjsToHtml(convertToRaw(values.answer.getCurrentContent()))),
            authorId: id,
            faqTagIds: values._tags,
            categoryId: values.categoryId
          },
          cb
        })
      )
    }
    setLoading(false)
  }

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <PageLoading loading={loading || faqLoading} />

        <Formik
          initialValues={{
            question: +fid === 0 ? '' : faq?.question || '',
            categoryId: faq?.categoryId || "",
            answer:
              +fid === 0
                ? EditorState.createEmpty()
                : (faq?.answer && getAnswer(faq?.answer)) || EditorState.createEmpty(),
            _tags: faq?.faqTagIds || [],
          }}
          enableReinitialize
          validationSchema={FaqSchema}
          onSubmit={handleSubmitFunc}>
          {({ values, handleChange, handleSubmit, errors, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  boxShadow: '0 1px 8px rgb(0 0 0 / 0.2)',
                  margin: '20px 0px'
                }}>
                <Box display={'flex'} flexDirection={'column'}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                    {+fid !== 0 && (
                      <>
                        <DisablePermissions disable={true} permission={'publish:faq'}>
                          <ToggleButtonCustom
                            style={{ width: '100px', height: '50px' }}
                            text={'Publish'}
                            onChange={() => {
                              dispatch(
                                updateFaqByExpert({
                                  id: `${fid}/publish`,
                                  cb: () => {
                                    successToast('Faq has been published.')
                                  }
                                })
                              )
                            }}></ToggleButtonCustom>
                        </DisablePermissions>
                        {/* <ToggleButton
                          sx={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'nowrap',
                            width: '100px',
                            height: '50px'
                          }}
                          selected={lang !== 'en'}
                          onChange={() => {
                            // setQuesId(faq.id)
                            dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                          }}
                          value={'check'}>
                          {lang !== 'en' ? 'English' : 'Arabic'}
                        </ToggleButton> */}
                      </>
                    )}

                    <DisablePermissions permission={'write:faq'} disable>
                      <BaseButton
                        customColor={palette.variables.darkPurple}
                        type="submit"
                        fullWidth
                        variant="contained"
                        element={t('save')}
                        sx={{
                          display: 'block',
                          maxWidth: '100px',
                          margin: 2,
                          marginRight: 2,
                          marginLeft: 0,
                        }}
                      />
                    </DisablePermissions>
                    {/* {+fid !== 0 && (
                      <Box
                        sx={{
                          display: 'flex'
                        }}>
                        <IconButton
                          aria-label="delete"
                          onClick={() =>
                            toast('Delete functionality is under development.', {
                              type: 'info'
                            })
                          }>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Box>
                    )} */}
                  </Box>
                  {+fid !== 0 && (
                    <Box display={'flex'} justifyContent={'flex-end'} mr={2}>
                      <Typography
                        color={palette.variables.orange}
                        variant="caption"
                        style={{ cursor: 'pointer', marginRight: '10px', marginLeft: '10px' }}
                        onClick={() => navigate(`/experts/published/${faq.id}/faq/current${!!searchParams.get('lang') && searchParams.get('lang') === 'ar' ? '?lang=ar' : ''}`)}>
                        {`(View Current)`}
                      </Typography>

                      <Typography
                        color={palette.variables.orange}
                        variant="caption"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/experts/published/${faq.id}/faq/published${!!searchParams.get('lang') && searchParams.get('lang') === 'ar' ? '?lang=ar' : ''}`)}>
                        {`(View Published)`}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    paddingLeft: '15px',
                    paddingRight: '10px'
                  }}>
                  <Box sx={{ ml: 2, width: '100%' }}>
                    <BaseTextField
                      placeholder={t('fields.someText')}
                      fullWidth
                      id={`faq_question`}
                      label={t('fields.question')}
                      name={`question`}
                      defaultValue={values.question}
                      onChange={handleChange}
                      value={values.question}
                      error={!!errors.question}
                      helperText={errors.question}
                      color={!errors.question && values.question ? 'success' : ''}
                    />
                    <Typography mt={3} variant="body1" fontSize={14} fontWeight={500}>
                      Answer
                    </Typography>
                    <RichTextEditor
                      value={values.answer}
                      onChange={(editorState) => setFieldValue('answer', editorState)}
                    />
                    <BaseSelect
                      name="category"
                      label={t('fields.category')}
                      items={categories}
                      sx={{ width: '98%', mt: 5, marginEnd: 3 }}
                      onChange={(value) => {
                        setFieldValue(`categoryId`, value)
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 3
                      }}>
                      <Typography variant="subtitle1" component="h4">
                        {t('fields.tag')}
                      </Typography>
                      <FormControl sx={{ m: 1, width: '75%' }} size="small">
                        <ToggleButtonGroup
                          sx={{ flexWrap: 'wrap', gap: '7px' }}
                          color="primary"
                          value={values._tags}
                          onChange={(event, value) => {
                            handleChange({
                              ...event,
                              target: { name: '_tags', value }
                            })
                          }}>
                          {tags.map((tag) => (
                            <ToggleButton
                              sx={{
                                display: 'flex',
                                gap: '8px',
                                overflow: 'auto',
                                marginBottom: '15px',
                                flexWrap: 'nowrap',
                                width: 'max-content'
                              }}
                              selected={values._tags.includes(tag.id)}
                              key={tag.id}
                              value={tag.id}>
                              {tag.name}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </>
  )
}

export default FaqCreatePage
