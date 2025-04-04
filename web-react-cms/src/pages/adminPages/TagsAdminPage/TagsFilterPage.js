import React, { useEffect, useRef, useState } from 'react'
import { Grid, Typography, IconButton, Link } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import EditIcon from '@mui/icons-material/Edit'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import { Link as Route } from 'react-router-dom'
import { deleteTagsByID, getFilterTags, getFilterTagsById } from 'store/actions/tag'
import { useDispatch } from 'react-redux'
import { Permissions } from 'components/Permissions'
import { NumToString } from 'utils/functions'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LINKED_ENTITIES_TYPES, TAGS_DELETE_TYPE } from 'utils/constants'
import PageLoading from 'components/PageLoading'
import BaseModel from 'components/modal/BaseModal'
import { successToast } from 'utils'
import DeleteIcon from '@mui/icons-material/Delete'

function TagsFilterPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [filterTag, setFilter] = useState([])
  const [open, setOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const anchorRef = useRef(null)
  const [tagId, setTagId] = useState()

  useEffect(async () => {
    const resFilter = await dispatch(getFilterTags())
    setFilter(resFilter.payload.reverse())
  }, [])

  const checkLink = async (id = tagId, reload = false) => {
    setLoading(true)
    const data = await dispatch(getFilterTagsById({ id: `${id}/entity_links` }))
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
    if (type === LINKED_ENTITIES_TYPES.PRODUCT_CATEGORY) {
      anchorRef.current.href = `#/filter/${id}`
    } else if (type === LINKED_ENTITIES_TYPES.PRODUCT) {
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
        type: TAGS_DELETE_TYPE.FILTER,
        id: tagId,
        cb: async () => {
          successToast('Tag has successfully deleted.')
          const res = await dispatch(getFilterTags())
          if (res.payload) {
            setFilter(res.payload.reverse())
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('fields.filterTag')}</Typography>
        <Permissions permission={'write:tag'}>
          {/* <Link component={Route} to="/tags/filter/add" color="#29173B" underline="none"> */}
          <BaseButton
            customColor={palette.variables.orange}
            variant="contained"
            element={t('add')}
            href="/#/tags/filter/0"
          />
          {/* </Link> */}
        </Permissions>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.tag')}
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.value')}
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.type')}
          </Typography>
        </Grid>
        <Grid item xs={2}>
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
      {filterTag &&
        filterTag.map((filter) => (
          <Grid key={filter.id} container spacing={2}>
            <Grid item xs={3} sx={{ display: 'flex' }}>
              <LocalOfferIcon />
              <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                {filter.value || filter.valueSuffix}
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ display: 'flex' }}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {filter?.lowerValue !== undefined && filter?.higherValue !== undefined
                  ? `${NumToString(filter?.lowerValue)} - ${NumToString(filter?.higherValue)}`
                  : ''}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {filter.valueSuffix ? 'Range' : 'Text Based'}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Link
                component={Route}
                to={`/tags/filter/${filter.id}`}
                color="#29173B"
                underline="none">
                <IconButton size="small" aria-label="edit">
                  <EditIcon fontSize="small" color="secondary" />
                </IconButton>
              </Link>
            </Grid>
            <Grid item xs={1}>
              <IconButton
                size="small"
                aria-label="delete"
                onClick={() => {
                  setTagId(filter.id)
                  checkLink(filter.id)
                }}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Grid>
          </Grid>
        ))}
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

export default TagsFilterPage
