import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  FormControl,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  IconButton
} from '@mui/material'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getTags } from 'store/actions/tag'
import { Formik } from 'formik'
import { createFaq, deleteFaq, updateFaqByExpert } from 'store/actions/faqs'
import { getFaqsByExpert } from 'store/actions/experts'
import PageLoading from 'components/PageLoading'
import { successToast } from 'utils'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { setStateValue } from 'store/reducers/faqs'
import { Permissions } from 'components/Permissions'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import DeleteIcon from '@mui/icons-material/Delete'
import { ContentState, convertToRaw, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import draftjsToHtml from 'draftjs-to-html'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import { removeSpaces } from 'utils/functions'
import BaseModel from 'components/modal/BaseModal'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect';
import { fetchCategory } from 'store/actions/products';

function ExpertsFaqPage() {
  const [show, setShow] = useState(false)
  const { t } = useTranslation()
  const [searchTags, setSearchTags] = useState([])
  const lang = useSelector(selectLanguage)
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    state: { expert }
  } = useLocation()
  const { tags } = useSelector((state) => state.faqs)
  const { expertFaqs: faqs, loading } = useSelector((state) => state.experts)
  const { loading: faqLoading, faq, error } = useSelector((state) => state.faqs)
  const { productCategory: categories } = useSelector((state) => state.products)
  const [ques, setQues] = useState('')
  const [ans, setAns] = useState(EditorState.createEmpty())
  const [delOpen, setDelOpen] = useState(false)
  const [delQuesId, setDelQuesId] = useState()

  const dispatch = useDispatch()

  useEffect(async () => {
    if (searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    }
    dispatch(getFaqsByExpert({ authorId: id }))
  }, [])

  const reset = async () => {
    // await dispatch(setLanguage('en'))
    dispatch(getFaqsByExpert({ authorId: id }))
    dispatch(setStateValue({ type: 'faq', data: null }))
    dispatch(setStateValue({ type: 'error', data: null }))
    setQues('')
    setAns(EditorState.createEmpty())
  }

  useEffect(async () => {
    await dispatch(setStateValue({ type: 'loading', data: true }))
    dispatch(setStateValue({ type: 'loading', data: false }))
  }, [ques, ans])

  useEffect(() => {
    if (lang === 'ar' && error === null && faq !== null) {
      setQues(faq.question)
      setAns(getAnswer(faq.answer))
    }
  }, [lang, error, faq])

  // useEffect(() => {
  //   // if (lang === 'ar' && quesId) {
  //   //   dispatch(getFaqById({ id: quesId }))
  //   // } else {
  //   reset()
  //   // }
  // }, [lang])

  useEffect(() => {
    dispatch(fetchCategory())
    dispatch(getTags())
    return async () => await dispatch(setLanguage('en'))
  }, [])

  const handleSearch = () => {
    dispatch(getFaqsByExpert({ authorId: id, tags: searchTags }))
  }

  const FaqSchema = Yup.object().shape({
    question: Yup.string().required(t('validation.required'))
    // answer: Yup.string().required(t('validation.required'))
  })

  const getAnswer = (answer) => {
    const contentBlock = htmlToDraft(answer)
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      return EditorState.createWithContent(contentState)
    }
  }

  const handleDeletion = () => {
    setDelOpen(false)
    dispatch(
      deleteFaq({
        id: delQuesId,
        cb: async () => {
          successToast('FAQ has successfully deleted.')
          dispatch(getFaqsByExpert({ authorId: id }))
        }
      })
    )
  }

  return (
    <>
      {(
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}>
          <Card
            sx={{
              boxShadow: 0,
              display: 'flex',
              alignItems: 'flex-start',
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
            <CardMedia
              component="img"
              height="140"
              image={expert.iconUrl}
              alt="green iguana"
              sx={{ maxWidth: '250px', borderRadius: 1 }}
            />
            <CardContent sx={{ pt: 0, pl: { xs: 0, sm: 2 } }} style={{ width: '100%' }}>
              <Typography variant="h5" component="h3" style={{ width: 'max-content' }}>
                {expert.name}
              </Typography>
              <Typography variant="h5" component="h4">
                {t('fields.expert')}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
      <Box sx={{ mt: 3 }}>
        {(
          <>
            <Typography variant="subtitle1" component="h3">
              {t('fields.faqs')}
            </Typography>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              mt={2}>
              <ToggleButtonGroup
                sx={{ flexWrap: 'wrap', gap: '7px' }}
                color="primary"
                value={searchTags}
                onChange={(event, value) => {
                  setSearchTags(value)
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
                    selected={searchTags.includes(tag.id)}
                    key={tag.id}
                    value={tag.id}>
                    {tag.name}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <BaseButton
                customColor={palette.variables.orange}
                variant="contained"
                element={t('search')}
                onClick={handleSearch}
                sx={{ display: 'flex', marginLeft: 3 }}
              />
            </Box>
            <Permissions permission={'write:faq'}>
              <Box
                sx={{ display: 'flex', justifyContent: 'center', margin: '40px 0px' }}
                color="#F29469">
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={async () => {
                    await dispatch(setLanguage('en'))
                    navigate(`/experts/${id}/faq/0${searchParams.get('lang') && searchParams.get('lang') === 'ar' ? '?lang=ar' : ''}`)
                  }}>
                  {t('addFaq')}
                </Button>
              </Box>
            </Permissions>
          </>
        )}
        {show && (
          <Formik
            initialValues={{
              question: '',
              answer: EditorState.createEmpty(),
              _tags: []
            }}
            validationSchema={FaqSchema}
            onSubmit={(values) => {
              dispatch(
                createFaq({
                  params: {
                    question: values.question,
                    answer: removeSpaces(
                      draftjsToHtml(convertToRaw(values.answer.getCurrentContent()))
                    ),
                    authorId: id,
                    faqTagIds: values._tags
                  },
                  cb: () => {
                    successToast('Faq has created')
                    // reset()
                  }
                })
              )
              setShow(false)
            }}>
            {({
              values,
              handleChange,
              handleSubmit,
              errors,
              setFieldValue
              /* and other goodies */
            }) => (
              <form onSubmit={handleSubmit}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    mt: 4,
                    boxShadow: '0 1px 8px rgb(0 0 0 / 0.2)',
                    borderRadius: 2
                  }}>
                  <Box sx={{ ml: 2, width: '100%', mt: 1 }}>
                    <BaseTextField
                      placeholder={t('fields.someText')}
                      fullWidth
                      id={`faq_question`}
                      label=" Question"
                      name={`question`}
                      defaultValue={values.question}
                      onChange={handleChange}
                      value={values.question}
                      error={!!errors.question}
                      helperText={errors.question}
                      color={!errors.question && values.question ? 'success' : ''}
                    />

                    <RichTextEditor
                      value={values.answer}
                      onChange={(editorState) => setFieldValue('answer', editorState)}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 3
                      }}>
                      <Typography variant="subtitle1" component="h4">
                        Tag
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

                  <Box
                    sx={{
                      display: 'flex'
                    }}>
                    <BaseButton
                      customColor={palette.variables.darkPurple}
                      type="submit"
                      fullWidth
                      variant="contained"
                      element={t('save')}
                      sx={{ display: 'block', maxWidth: 300, margin: 2 }}
                    />
                    <BaseButton
                      customColor={palette.variables.orange}
                      fullWidth
                      type="button"
                      onClick={() => setShow(false)}
                      variant="contained"
                      element={t('cancel')}
                      sx={{ display: 'block', maxWidth: 400, margin: 2, paddingRight: 3 }}
                    />
                  </Box>
                </Box>
              </form>
            )}
          </Formik>
        )}
        <PageLoading loading={loading || faqLoading} />
        {faqs &&
          !loading &&
          !faqLoading &&
          faqs.map((_faq, index) => {
            // if (lang === 'ar' && quesId && _faq.id !== quesId) return
            return (
              <Formik
                key={index}
                initialValues={{
                  id: _faq.id,
                  question: _faq.question,
                  categoryId: _faq?.categoryId || "",
                  // answer: lang === 'ar' ? ans : _faq.answer,
                  answer: getAnswer(_faq.answer),
                  _tags: _faq.faqTagIds || [],
                  publish: _faq.publish || false
                }}
                validationSchema={FaqSchema}
                onSubmit={(values) => {
                  dispatch(
                    updateFaqByExpert({
                      id: values.id,
                      params: {
                        question: values.question,
                        answer: removeSpaces(
                          draftjsToHtml(convertToRaw(values.answer.getCurrentContent()))
                        ),
                        authorId: id,
                        categoryId: values.categoryId,
                        faqTagIds: values._tags
                      },
                      cb: () => {
                        successToast('Faq has updated')
                        // if (lang === 'ar') {
                        reset()
                        // }
                      }
                    })
                  )
                }}>
                {({
                  values,
                  handleChange,
                  handleSubmit,
                  errors,
                  setFieldValue
                  /* and other goodies */
                }) => (
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
                          <DisablePermissions disable={true} permission={'publish:faq'}>
                            <ToggleButtonCustom
                              style={{ width: '100px', height: '50px' }}
                              text={'Publish'}
                              // disabled={_faq?.metaInfo?.version === _faq?.metaInfo?.publishedVersion}
                              // selected={values.publish}
                              onChange={() => {
                                // publishDevToast()
                                dispatch(
                                  updateFaqByExpert({
                                    id: `${_faq.id}/publish`,
                                    cb: () => {
                                      // setFieldValue('publish', !values.publish)
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
                              // marginRight: '10px',
                              flexWrap: 'nowrap',
                              width: '100px',
                              height: '50px'
                            }}
                            selected={lang !== 'en'}
                            onChange={() => {
                              setQuesId(_faq.id)
                              dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                            }}
                            value={'check'}>
                            {lang !== 'en' ? 'English' : 'Arabic'}
                          </ToggleButton> */}

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
                                marginRight: 0,
                                marginLeft: 0,
                              }}
                            />
                          </DisablePermissions>
                          <Box
                            sx={{
                              display: 'flex'
                            }}>
                            <IconButton
                              aria-label="delete"
                              onClick={() => {
                                setDelQuesId(_faq.id)
                                setDelOpen(true)
                              }}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box display={'flex'} justifyContent={'flex-end'} mr={2}>
                          <>
                            <Typography
                              color={palette.variables.orange}
                              variant="caption"
                              style={{ cursor: 'pointer', marginRight: '10px', marginLeft: '10px' }}
                              onClick={() => navigate(`/experts/published/${_faq.id}/faq/current${!!searchParams.get('lang') && searchParams.get('lang') === 'ar' ? '?lang=ar' : ''}`)}>
                              {`(View Current)`}
                            </Typography>

                            <Typography
                              color={palette.variables.orange}
                              variant="caption"
                              style={{ cursor: 'pointer' }}
                              onClick={() =>
                                navigate(`/experts/published/${_faq.id}/faq/published${!!searchParams.get('lang') && searchParams.get('lang') === 'ar' ? '?lang=ar' : ''}`)
                              }>
                              {`(View Published)`}
                            </Typography>
                          </>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          paddingLeft: '15px',
                          paddingRight: '10px'
                        }}>
                        <Typography variant="subtitle1" component="h4">
                          {index + 1}
                        </Typography>
                        <Box sx={{ ml: 2, width: '100%' }}>
                          <BaseTextField
                            placeholder={t('fields.someText')}
                            fullWidth
                            id={`faq_question_${index}`}
                            label={t('fields.question')}
                            name={`question`}
                            defaultValue={values.question}
                            onChange={handleChange}
                            value={values.question}
                            error={!!errors.question}
                            helperText={errors.question}
                            color={!errors.question && values.question ? 'success' : ''}
                          />
                          <RichTextEditor
                            value={values.answer}
                            onChange={(editorState) => setFieldValue('answer', editorState)}
                          />
                          <BaseSelect
                            name="category"
                            label={t('fields.category')}
                            items={categories}
                            initvalue={_faq?.categoryId}
                            sx={{ width: '98%', m: 0, mt: 5 }}
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
            )
          })}
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

export default ExpertsFaqPage;
