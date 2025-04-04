import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, IconButton, Grid } from '@mui/material'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import { useTranslation } from 'react-i18next'
import palette from 'theme/palette'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import { useDispatch } from 'react-redux'
import { deleteTagsByID, getCategoryTags, getCategoryTagsById } from 'store/actions/tag'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCategoryById } from 'store/actions/products'
import { Permissions } from 'components/Permissions'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LINKED_ENTITIES_TYPES, TAGS_DELETE_TYPE } from 'utils/constants'
import PageLoading from 'components/PageLoading'
import BaseModel from 'components/modal/BaseModal'
import { successToast } from 'utils'

function TagsProductCategory() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { id } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState([])
  const [tag, setTag] = useState([])
  // const [faqTag, setFaqTag] = useState([])
  const [open, setOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const anchorRef = useRef(null)
  const [tagId, setTagId] = useState()

  useEffect(async () => {
    let dataName = await dispatch(getCategoryTags())
    let tagCategory = dataName.payload.filter((item) => id == item.categoryId)

    setTag(tagCategory)
    if (+id !== 0) {
      const data = await dispatch(fetchCategoryById({ id }))
      setCategory(data)
    }
  }, [])

  const checkLink = async (id = tagId, reload = false) => {
    setLoading(true)
    const data = await dispatch(getCategoryTagsById({ id: `${id}/entity_links` }))

    if (data.payload) {
      if (!data.payload.length && !reload) {
        setOpen(false)
        setDelOpen(true)
      } else {
        setEntityLinks([...data.payload])
        setOpen(true)
      }
    }
    setLoading(false)
  }

  const goToFunction = async (id, type) => {
    setLoading(true)
    if (type === LINKED_ENTITIES_TYPES.PRODUCT) {
      anchorRef.current.href = `#/products/${id}`
    } else if (type === LINKED_ENTITIES_TYPES.PRODUCT_CATEGORY) {
      anchorRef.current.href = `#/products/${id}`
    }
    anchorRef.current.click()

    setLoading(false)
  }

  const handleDeletion = () => {
    setDelOpen(false)
    setLoading(true)
    dispatch(
      deleteTagsByID({
        type: TAGS_DELETE_TYPE.PRODUCT,
        id: tagId,
        cb: async () => {
          successToast('Tag has successfully deleted.')
          const res = await dispatch(getCategoryTags())
          if (res.payload) {
            let tagCategory = res.payload.filter((item) => id == item.categoryId)
            setTag(tagCategory)
          }

          setLoading(false)
        },
        cbF: () => setLoading(false)
      })
    )
  }

  return (
    <>
      <PageLoading loading={loading} />

      <Box>
        <Typography variant="h3"> {t('admin.productCategoryTags')}</Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            mt: 3
          }}>
          <Typography style={{ fontWeight: 500 }}>{category && category.payload?.name}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            mt: 3
          }}>
          <Typography style={{ fontWeight: 500 }}>{t('fields.primary')}</Typography>
          <Permissions permission={'write:tag'}>
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              onClick={() =>
                navigate('/tags/product/add/0', {
                  state: { categoryId: category.payload.id }
                })
              }
              sx={{ display: 'flex', ml: 3 }}
            />
          </Permissions>
        </Box>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('admin.tags')}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('fields.icon')}
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('edit')}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('delete')}
            </Typography>
          </Grid>
        </Grid>

        {tag &&
          tag.map((tagFilter) => (
            <Grid key={tagFilter.id} container spacing={2}>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <LocalOfferIcon />
                <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                  {tagFilter.name}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                  {t('fields.filename')}{' '}
                </Typography>
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  size="small"
                  aria-label="edit"
                  onClick={() => navigate(`/tags/product/add/${tagFilter.id}`)}>
                  <EditIcon fontSize="small" color="secondary" />
                </IconButton>
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  size="small"
                  aria-label="delete"
                  onClick={() => {
                    setTagId(tagFilter.id)
                    checkLink(tagFilter.id)
                  }}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Grid>
            </Grid>
          ))}
      </Box>
      <DeletionModal
        open={open}
        handleClose={() => setOpen(false)}
        list={entityLinks}
        text={ENTITY_DELETION_STATEMENT}
        onPressGoTo={(tagId, type) => goToFunction(tagId, type)}
        onReload={() => checkLink(undefined, true)}
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

export default TagsProductCategory
