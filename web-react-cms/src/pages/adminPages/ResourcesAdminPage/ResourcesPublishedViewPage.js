import { Box, Grid, ImageListItem, ToggleButton, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { useDispatch, useSelector } from 'react-redux'
import { setStateResourceValue } from 'store/reducers/resources'
import { getResourceById } from 'store/actions/resources'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ContentState, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import { getExperts } from 'store/actions/experts'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'

import { useTranslation } from 'react-i18next'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import palette from 'theme/palette'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  cursor: 'pointer',
  color: theme.palette.text.secondary
}))

function ResourcesPublishedViewPage() {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { id } = useParams()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isPublished = pathname.split('/').at(-1) === 'published'
  const [previewText, setPreviewText] = useState(EditorState.createEmpty())
  const [fullText, setFullText] = useState(EditorState.createEmpty())
  const { resource, loading, error: resError } = useSelector((state) => state.resources)
  const { experts } = useSelector((state) => state.experts)
  const lang = useSelector(selectLanguage)

  const setEditors = () => {
    if (resource?.previewText) {
      const contentBlock = htmlToDraft(resource.previewText)
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
        setPreviewText(EditorState.createWithContent(contentState))
      }
    }

    if (resource?.fullText) {
      const contentBlock = htmlToDraft(resource.fullText)
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
        setFullText(EditorState.createWithContent(contentState))
      }
    }
  }
  useEffect(() => {
    setEditors()
  }, [resource?.previewText, resource?.fullText])

  useEffect(() => {
    if (resError) {
      if (resource && lang === 'ar' && resError) {
        setPreviewText(EditorState.createEmpty())
        setFullText(EditorState.createEmpty())
        dispatch(
          setStateResourceValue({
            type: 'resource',
            data: { ...resource, name: '' }
          })
        )
        return
      }
    } else {
      setEditors()
    }
  }, [resError])

  useEffect(async () => {
    if (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    }
    dispatch(getResourceById({ id: isPublished ? `${id}/published` : id }))
  }, [lang])

  useEffect(() => {
    dispatch(getExperts())
    return async () => await dispatch(setLanguage('en'))
  }, [])

  if (loading || !resource) {
    return <>Loading</>
  }

  return (
    <>
      {resource?.metaInfo && (
        <Typography sx={{ marginBottom: '16px' }} variant="h6" color={palette.variables.darkPurple}>
          {isPublished
            ? `Published Version ${resource?.metaInfo?.publishedVersion}`
            : `Current Version ${resource?.metaInfo?.version}`}
        </Typography>
      )}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 6
        }}>
        <BaseTextField
          name="title"
          label={t('fields.title')}
          fullWidth
          value={resource?.name || ''}
          color={'success'}
          disabled
        />

        {!(searchParams.get('lang') && searchParams.get('lang') === 'ar') && <Box
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}>
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
        </Box>}
      </Box>

      <Box>
        <Grid container spacing={2} style={{ marginBottom: '1rem' }}>
          <Grid item xs={3}>
            <Item style={{ pointerEvents: 'none' }}>
              <h4>{t('fields.thumbnail')}</h4>
              <ImageListItem
                key={resource.iconUrl}
                style={{ height: '200px', objectFit: 'contain' }}>
                <img
                  src={`${resource.iconUrl}?w=164&h=164&fit=crop&auto=format`}
                  srcSet={`${resource.iconUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                  alt={'iconUrl'}
                  loading="lazy"
                />
              </ImageListItem>
            </Item>
          </Grid>
          <Grid item xs={3}>
            <Item style={{ pointerEvents: 'none' }}>
              <h4>{t('fields.fullsizeImage')}</h4>
              <ImageListItem
                key={resource.imageUrl}
                style={{ height: '200px', objectFit: 'contain' }}>
                <img
                  src={`${resource.imageUrl}?w=164&h=164&fit=crop&auto=format`}
                  srcSet={`${resource.imageUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                  alt={'imageUrl'}
                  loading="lazy"
                />
              </ImageListItem>
            </Item>
          </Grid>
        </Grid>

        <BaseSelect
          name="authorName"
          label={t('fields.authorName')}
          items={experts.map((x) => ({
            id: x.id,
            title: x.name
          }))}
          placeholder="expert"
          initvalue={resource?.authorId}
          sx={{ width: '100%', mb: 2, mt: 3 }}
          disabled
        />

        <Typography variant="subtitle1" component="h3" sx={{ mt: 3 }}>
          {t('fields.previewText')}
        </Typography>
        <RichTextEditor
          disabled
          value={previewText}
          onChange={(editorState) => setPreviewText(editorState)}
        />
        <Typography variant="subtitle1" component="h3" sx={{ mt: 3 }}>
          {t('fields.about')}
        </Typography>
        <RichTextEditor
          disabled
          value={fullText}
          onChange={(editorState) => setFullText(editorState)}
        />
      </Box>
    </>
  )
}

export default ResourcesPublishedViewPage
