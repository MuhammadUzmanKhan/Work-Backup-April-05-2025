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
import { deleteTagsByID, getRewardByID, getRewardsTags } from 'store/actions/tag'
import { useDispatch } from 'react-redux'
// import { deleteFuncToast } from 'utils'
import { Permissions } from 'components/Permissions'
import DeletionModal from 'components/modal/DeletionModal'
import { ENTITY_DELETION_STATEMENT, LINKED_ENTITIES_TYPES, TAGS_DELETE_TYPE } from 'utils/constants'
import PageLoading from 'components/PageLoading'
import BaseModel from 'components/modal/BaseModal'
import { successToast } from 'utils'

function TagsRewardsPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [quizTag, setQuizTag] = useState([])

  const [open, setOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [entityLinks, setEntityLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const anchorRef = useRef(null)

  const [tagId, setTagId] = useState()

  useEffect(async () => {
    const res = await dispatch(getRewardsTags())
    setQuizTag(res.payload.reverse())
  }, [])

  const checkLink = async (id = tagId, reload = false) => {
    setLoading(true)
    const data = await dispatch(getRewardByID({ id: `${id}/entity_links` }))
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
    if (type === LINKED_ENTITIES_TYPES.REWARD) {
      anchorRef.current.href = `#/rewards/${id}`
    }
    anchorRef.current.click()

    setLoading(false)
  }

  const handleDeletion = () => {
    setDelOpen(false)
    setLoading(true)
    dispatch(
      deleteTagsByID({
        type: TAGS_DELETE_TYPE.REWARD,
        id: tagId,
        cb: async () => {
          successToast('Tag has successfully deleted.')
          const res = await dispatch(getRewardsTags())
          if (res.payload) {
            setQuizTag(res.payload.reverse())
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
        <Typography variant="h3">{t('admin.rewardTags')}</Typography>
        <Permissions permission={'write:tag'}>
          <Link component={Route} to="/tags/rewards/0" color="#000000" underline="none">
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
      {quizTag &&
        quizTag.map((quiz) => (
          <Grid key={quiz.id} container spacing={2}>
            <Grid item xs={6} sx={{ display: 'flex' }}>
              <LocalOfferIcon />
              <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                {quiz.name}
              </Typography>
            </Grid>
            <Grid item xs={1}>
              <Link
                component={Route}
                to={`/tags/rewards/${quiz.id}`}
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
                  setTagId(quiz.id)
                  checkLink(quiz.id)
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

export default TagsRewardsPage
