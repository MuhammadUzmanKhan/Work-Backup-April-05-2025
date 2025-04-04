import React, { useEffect, useState } from 'react'
import { Box, Typography, FormControl, ToggleButtonGroup, ToggleButton } from '@mui/material'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getTags } from 'store/actions/tag'
import { Formik } from 'formik'
import { getFaqById } from 'store/actions/faqs'
import PageLoading from 'components/PageLoading'

import { useTranslation } from 'react-i18next'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { setStateValue } from 'store/reducers/faqs'
import { ContentState, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'

function FaqPublishedViewPage() {
  const { t } = useTranslation()
  const lang = useSelector(selectLanguage)
  const { id } = useParams()
  const { pathname } = useLocation()
  const isPublished = pathname.split('/').at(-1) === 'published'
  const [searchParams] = useSearchParams()

  const { tags } = useSelector((state) => state.faqs)
  const { loading: faqLoading, faq, error } = useSelector((state) => state.faqs)
  const [ques, setQues] = useState('')
  const [ans, setAns] = useState('')
  const dispatch = useDispatch()

  useEffect(async () => {
    if (searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    }
  }, [])



  useEffect(async () => {
    await dispatch(setStateValue({ type: 'loading', data: true }))
    dispatch(setStateValue({ type: 'loading', data: false }))
  }, [ques, ans])

  useEffect(() => {
    if (lang === 'ar' && error === null && faq !== null) {
      setQues(faq.question)
      setAns(getAnswer(faq.answer))
    } else if (lang === 'ar' && error !== null) {
      setQues('')
      setAns(EditorState.createEmpty())
    }
  }, [lang, error, faq])

  useEffect(() => {
    dispatch(getFaqById({ id: isPublished ? `${id}/published` : id }))
  }, [lang])

  useEffect(() => {
    dispatch(getTags())
    return async () => await dispatch(setLanguage('en'))
  }, [])

  const getAnswer = (answer) => {
    const contentBlock = htmlToDraft(answer)
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      return EditorState.createWithContent(contentState)
    }
  }
  return (
    <>
      <Box sx={{ mt: 3 }}>
        <PageLoading loading={faqLoading} />

        <Formik
          initialValues={{
            id: faq?.id || '',
            question: lang === 'ar' ? ques : faq?.question,
            answer:
              lang === 'ar'
                ? ans
                : (faq?.answer && getAnswer(faq?.answer)) || EditorState.createEmpty(),
            _tags: faq?.faqTagIds || [],
            publish: faq?.publish || false
          }}
          enableReinitialize>
          {({ values, handleChange }) => (
            <form>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 4 }}>
                <Box sx={{ ml: 2, width: '100%' }}>
                  <BaseTextField
                    placeholder={t('fields.someText')}
                    fullWidth
                    id={`faq_question`}
                    label={t('fields.question')}
                    name={`question`}
                    defaultValue={values.question}
                    value={values.question}
                    color={'success'}
                    disabled
                  />
                  <RichTextEditor value={values.answer} disabled />

                  {/* <BaseTextField
                    placeholder={t('fields.someText')}
                    fullWidth
                    id={`faq_answer`}
                    label={t('fields.answer')}
                    name={`answer`}
                    defaultValue={values.answer}
                    onChange={handleChange}
                    value={values.answer}
                    disabled
                    color={'success'}
                  /> */}
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
                        disabled
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

                {/* <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  <ToggleButton
                    sx={{
                      display: 'flex',
                      gap: '8px',
                      marginRight: '10px',
                      flexWrap: 'nowrap',
                      width: '100px',
                      height: '50px'
                    }}
                    selected={lang !== 'en'}
                    onChange={() => {
                      dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                    }}
                    value={'check'}>
                    {lang !== 'en' ? 'English' : 'Arabic'}
                  </ToggleButton>
                </Box> */}
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </>
  )
}

export default FaqPublishedViewPage
