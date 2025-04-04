import React, { useEffect, useRef, useState } from 'react'
import { Grid, Typography, IconButton, Link } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import { Link as Route } from 'react-router-dom'
import { deleteTagsByID, getTags, getTagsByID } from 'store/actions/tag'
import { useDispatch } from 'react-redux'
import { Permissions } from 'components/Permissions'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, TAGS_DELETE_TYPE } from 'utils/constants'
import { getFaqById } from 'store/actions/faqs'
import PageLoading from 'components/PageLoading'
import BaseModel from 'components/modal/BaseModal'
import { successToast } from 'utils'

function TagsFaqPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [faqTag, setFaqTag] = useState([])
  const [open, setOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const anchorRef = useRef(null)

  const [tagId, setTagId] = useState()

  useEffect(async () => {
    const res = await dispatch(getTags())
    if (res.payload) {
      setFaqTag(res.payload)
    }
  }, [])

  const checkLink = async (id = tagId, reload = false) => {
    setLoading(true)
    const data = await dispatch(getTagsByID(`${id}/entity_links`))

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

  const goToFunction = async (faqId) => {
    setLoading(true)
    const data = await dispatch(getFaqById({ id: faqId }))
    if (data.payload) {
      anchorRef.current.href = `#/experts/${data.payload.authorId}/faq/${faqId}`
      anchorRef.current.click()
    }
    setLoading(false)
  }

  const handleDeletion = () => {
    setDelOpen(false)
    setLoading(true)
    dispatch(
      deleteTagsByID({
        type: TAGS_DELETE_TYPE.FAQ,
        id: tagId,
        cb: async () => {
          successToast('Tag has successfully deleted.')
          const res = await dispatch(getTags())
          if (res.payload) {
            setFaqTag(res.payload)
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
        <Typography variant="h3">{t('admin.faqTags')}</Typography>
        <Permissions permission={'write:tag'}>
          <Link component={Route} to="/tags/faq/0" color="#29173B" underline="none">
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
            />
          </Link>
        </Permissions>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('fields.tag')}
          </Typography>
        </Grid>

        <Grid item xs={1}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('edit')}
          </Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
            {t('delete')}
          </Typography>
        </Grid>
      </Grid>
      {faqTag &&
        faqTag.map((faq) => (
          <Grid key={faq.id} container spacing={2}>
            <Grid item xs={6} sx={{ display: 'flex' }}>
              <LocalOfferIcon />
              <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                {faq.name}
              </Typography>
            </Grid>

            <Grid item xs={1}>
              <Link component={Route} to={`/tags/faq/${faq.id}`} color="#29173B" underline="none">
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
                  setTagId(faq.id)
                  checkLink(faq.id)
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
        onPressGoTo={(faqId) => goToFunction(faqId)}
        onReload={() => checkLink(undefined, true)}
        // unlinkPress={(faqId, published) => unlinkFaqTag(faqId, published)}
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

export default TagsFaqPage
