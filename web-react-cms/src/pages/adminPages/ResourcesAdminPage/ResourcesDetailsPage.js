import { Box, Grid, IconButton, ImageListItem, ToggleButton, Typography } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { useDispatch, useSelector } from 'react-redux'
import { setStateResourceValue } from 'store/reducers/resources'
import {
  deleteResourceById,
  getResourceById,
  getResourceLinksById,
  updateResourceById
} from 'store/actions/resources'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ContentState, convertToRaw, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import draftToHtml from 'draftjs-to-html'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import { setImage } from 'store/actions/image'
import { getExpertsByArabicLang } from 'store/actions/experts'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { successToast } from 'utils'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import CreatedByModal from 'components/modal/CreatedByModal'
import { removeSpaces } from 'utils/functions'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LINKED_ENTITIES_TYPES } from 'utils/constants'
import PageLoading from 'components/PageLoading'
import BaseModel from 'components/modal/BaseModal'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  cursor: 'pointer',
  color: theme.palette.text.secondary
}))

function ResourcesDetailsPage() {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [previewText, setPreviewText] = useState(EditorState.createEmpty())
  const [fullText, setFullText] = useState(EditorState.createEmpty())
  const { productCategory: categories } = useSelector((state) => state.products)
  const inputFile = useRef(null)
  const [selectedFile, setSeletectedFile] = useState('')
  const { resource, loading, error: resError } = useSelector((state) => state.resources)
  const { experts } = useSelector((state) => state.experts)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const lang = useSelector(selectLanguage)
  const [_loading, setLoading] = useState(false)
  const [delLinksOpen, setDelLinksOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const anchorRef = useRef(null)

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

      setPreviewText(EditorState.createEmpty())
      setFullText(EditorState.createEmpty())
      dispatch(
        setStateResourceValue({
          type: 'resource',
          data: { ...resource, name: '' }
        })
      )
      return

    } else {
      setEditors()
    }
  }, [resError])

  useEffect(async () => {
    if (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    }
    await dispatch(getResourceById({ id }))
    await dispatch(getExpertsByArabicLang({ lang: 'EN' }))
    await dispatch(getExpertsByArabicLang({ lang: 'AR' }))
  }, [lang])

  useEffect(() => {

    return async () => await dispatch(setLanguage('en'))
  }, [])

  const uploadImage = (fileName) => {
    setSeletectedFile(fileName)
    inputFile.current.click()
  }

  const onChangeFile = async (event) => {
    event.stopPropagation()
    event.preventDefault()
    var file = event.target.files[0]
    const url = await dispatch(setImage(file))
    if (url?.payload?.url) {
      dispatch(
        setStateResourceValue({
          type: 'resource',
          data: { ...resource, [selectedFile]: url.payload.url }
        })
      )
    }
  }

  const handleChange = (name, value) => {
    if (name === 'author') {
      const expert = experts.find((x) => x.id === value)
      dispatch(
        setStateResourceValue({
          type: 'resource',
          data: { ...resource, authorId: expert.id }
        })
      )
    } else if (name === 'title') {
      dispatch(
        setStateResourceValue({
          type: 'resource',
          data: { ...resource, name: value }
        })
      )
    }
    else if (name === 'categoryId') {
      dispatch(
        setStateResourceValue({
          type: 'resource',
          data: { ...resource, categoryId: value }
        })
      )
    }
  }

  const saveChanges = () => {
    if (resource.name.length <= 0) {
      setError(true)
      return
    }
    error && setError(false)
    dispatch(
      updateResourceById({
        id: lang === 'en' ? resource.id : `${resource.id}/i18n_data`,
        params: {
          id: resource.id,
          name: resource.name,
          iconUrl: resource.iconUrl,
          imageUrl: resource.imageUrl,
          previewText: removeSpaces(draftToHtml(convertToRaw(previewText.getCurrentContent()))),
          fullText: removeSpaces(draftToHtml(convertToRaw(fullText.getCurrentContent()))),
          authorId: resource.authorId,
          categoryId: resource.categoryId
        },
        cb: () => {
          dispatch(getResourceById({ id }))
          successToast('Resource has updated')
        }
      })
    )
  }

  const checkLink = async (id, reload = false) => {
    setLoading(true)
    const data = await dispatch(getResourceLinksById({ id: `${id}/entity_links` }))
    if (data.payload) {
      if (!data.payload.length && !reload) {
        setDelLinksOpen(false)
        setDelOpen(true)
      } else {
        setEntityLinks([...data.payload])
        setDelLinksOpen(true)
      }
    }
    setLoading(false)
  }

  const goToFunction = async (id, type) => {
    if (type === LINKED_ENTITIES_TYPES.QUIZ_QA || type === LINKED_ENTITIES_TYPES.FAQ) {
      anchorRef.current.href = `#/quizzes/${id}`
    }
    anchorRef.current.click()
  }

  const handleDeletion = () => {
    setLoading(true)
    setDelOpen(false)
    dispatch(
      deleteResourceById({
        id,
        cb: () => {
          successToast('Resources / Guidebook has successfully deleted.')
          navigate(-1, { replace: true })
          setLoading(false)
        },
        cbf: () => setLoading(false)
      })
    )
  }

  if (loading || !resource) {
    return <>Loading</>
  }

  return (
    <>
      <PageLoading loading={_loading} />
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
          onChange={(event) => handleChange('title', event.target.value)}
          // error={!!errors.name}
          helperText={error && t('validation.required')}
          color={!error ? 'success' : ''}
        />
        <Box display={'flex'} flexDirection={'column'}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}>
            <DisablePermissions disable={true} permission={'publish:guidebook'}>
              <ToggleButtonCustom
                text={'Publish'}
                disabled={resource?.metaInfo?.version === resource?.metaInfo?.publishedVersion}
                onChange={() => {
                  dispatch(
                    updateResourceById({
                      id: `${id}/publish`,
                      cb: () => {
                        dispatch(getResourceById({ id }))
                        successToast('Resource has been published.')
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
                navigate(`/resources/${id}`)
              }}
              value={'check'}>
              {lang !== 'en' ? 'English' : 'Arabic'}
            </ToggleButton>
            {(resource?.metaInfo?.publishedVersion || resource?.metaInfo?.lastModifiedBy) && (
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
                    info={resource?.metaInfo}
                  />
                )}
              </>
            )}
            <IconButton aria-label="delete" onClick={() => checkLink(id)}>
              <DeleteIcon color="error" />
            </IconButton>
          </Box>
          <Box display={'flex'} justifyContent={'flex-end'} mt={1}>
            <>
              {resource?.metaInfo?.version !== undefined && (
                <Typography
                  color={palette.variables.orange}
                  variant="caption"
                  style={{ cursor: 'pointer', marginRight: '10px' }}
                  onClick={() =>
                    navigate(
                      `/resources/published/${id}/current${searchParams.get('lang') === 'ar' ? '?lang=' + 'ar' : ''
                      }`
                    )
                  }>
                  {`(Current ${resource?.metaInfo?.version})`}
                </Typography>
              )}
              {resource?.metaInfo?.publishedVersion !== undefined && (
                <Typography
                  color={palette.variables.orange}
                  variant="caption"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    navigate(
                      `/resources/published/${id}/published${searchParams.get('lang') === 'ar' ? '?lang=' + 'ar' : ''
                      }`
                    )
                  }>
                  {`(Published ${resource?.metaInfo?.publishedVersion})`}
                </Typography>
              )}
            </>
          </Box>
        </Box>
      </Box>
      <Box>
        <Grid container spacing={2} style={{ marginBottom: '1rem' }}>
          <Grid item xs={3}>
            <Item
              onClick={() => (lang === 'en' ? uploadImage('iconUrl') : null)}
              style={lang === 'ar' ? { pointerEvents: 'none' } : {}}>
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
            <Item
              onClick={() => (lang === 'en' ? uploadImage('imageUrl') : null)}
              style={lang === 'ar' ? { pointerEvents: 'none' } : {}}>
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
          onChange={(value) => handleChange('author', value)}
          sx={{ width: '100%', mb: 2, mt: 3, ml: 0 }}
        // disabled={!((searchParams.get('lang') && searchParams.get('lang') === 'ar') || lang === 'en')}
        />
        <BaseSelect
          name="categoryId"
          label={t('fields.category')}
          items={categories}
          initvalue={resource?.categoryId}
          sx={{ width: '100%', marginBottom: 0, ml: 0, mt: 5 }}
          onChange={(value) => {
            handleChange(`categoryId`, value)
          }}
        />

        <Typography
          style={{ fontWeight: 500 }}
          variant="body2"
          color={'common.darkPurple'}
          sx={{ mt: 3 }}>
          {t('fields.previewText')}
        </Typography>
        <RichTextEditor
          value={previewText}
          onChange={(editorState) => setPreviewText(editorState)}
        />
        <Typography
          style={{ fontWeight: 500 }}
          variant="body2"
          color={'common.darkPurple'}
          sx={{ mt: 3 }}>
          {t('fields.about')}
        </Typography>
        <RichTextEditor value={fullText} onChange={(editorState) => setFullText(editorState)} />
        <DisablePermissions permission={'write:guidebook'} disable>
          <BaseButton
            customColor={palette.variables.darkPurple}
            onClick={saveChanges}
            fullWidth
            variant="contained"
            element={t('save')}
            sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
          />
        </DisablePermissions>
      </Box>
      <input
        type="file"
        id="file"
        ref={inputFile}
        style={{ display: 'none' }}
        onChange={onChangeFile}
      />
      <DeletionModal
        open={delLinksOpen}
        handleClose={() => setDelLinksOpen(false)}
        list={entityLinks}
        text={ENTITY_DELETION_STATEMENT}
        onPressGoTo={(_id, type) => goToFunction(_id, type)}
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

export default ResourcesDetailsPage
