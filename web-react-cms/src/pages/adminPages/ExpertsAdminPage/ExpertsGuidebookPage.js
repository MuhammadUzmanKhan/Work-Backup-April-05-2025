import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, CardMedia, Typography, IconButton, Grid } from '@mui/material';
// import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchFilter from 'views/Products/SearchFilter';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getExpertById,
  getResoucesByExpert,
  getResoucesByExpertByLang
} from 'store/actions/experts'
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import { useTranslation } from 'react-i18next'
import palette from 'theme/palette'
import BaseButton from 'components/formControl/baseButton/BaseButton'
// import { deleteFuncToast } from 'utils'
import { DisablePermissions } from 'components/DisablePermissions'

function ExpertsGuidebookPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { expert, expertResources } = useSelector((state) => state.experts)
  const [resources, setResources] = useState([])
  const [backupRes, setBackupRes] = useState([])
  const { t } = useTranslation()

  useEffect(async () => {
    const res = await dispatch(getResoucesByExpert({ authorId: id }))
    if (res?.payload) setBackupRes(res.payload)

    const _res = await dispatch(getResoucesByExpertByLang({ authorId: id, lang: 'AR' }))

    if (_res?.payload) setBackupRes([...backupRes, ..._res.payload])

    dispatch(getExpertById({ id }))
  }, [])

  useEffect(() => {
    setResources([...expertResources])
  }, [expertResources])

  const asyncFunction = (query) => dispatch(getResoucesByExpert({ authorId: id, name: query }))

  const asyncFunctionDebounced = AwesomeDebouncePromise(asyncFunction, 1000)

  const onSearch = async (query) => {
    if (query.length < 3) {
      setResources([...backupRes])
      return
    }
    const _resources = await asyncFunctionDebounced(query)
    if (_resources.payload) {
      setResources([..._resources.payload])
    }
  }

  return (
    <>
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
            image={expert?.iconUrl}
            alt="green iguana"
            sx={{ maxWidth: '250px', borderRadius: 1 }}
          />
          <CardContent sx={{ pt: 0, pl: { xs: 0, sm: 2 } }} style={{ width: '100%' }}>
            <Typography variant="bodyBig" color="common.darkPurple">
              {expert?.name}
            </Typography>
            <Typography color="common.darkPurple">{t('fields.expert')}</Typography>
          </CardContent>
        </Card>
        <DisablePermissions permission={'write:guidebook'} disable>
          <Box
            sx={{
              display: 'flex'
            }}>
            <BaseButton
              onClick={() => navigate('/resources/add', { state: { expertId: id } })}
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              sx={{ display: 'flex', ml: 3 }}
            />
          </Box>
        </DisablePermissions>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ mt: 3 }} variant="subtitle1" component="h3">
          {t('admin.guidebooks')}
        </Typography>
        <Box>
          <SearchFilter withFilter={false} onChange={onSearch} />
        </Box>

        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {t('fields.file')}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
                {t('fields.publisher')}
              </Typography>
            </Grid>
          </Grid>
          {resources.length !== 0 ? (
            resources.map((r) => (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={6} sx={{ display: 'flex' }}>
                    <DescriptionIcon />
                    <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                      {r.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="subtitle1" component="h4">
                      {expert?.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={2} sx={{ display: 'flex' }}>
                    <IconButton
                      size="small"
                      aria-label="edit"
                      onClick={() =>
                        navigate(`/resources/${r?.id}${r.type ? '?lang=' + r.type : ''}`)
                      }>
                      <EditIcon fontSize="small" color="secondary" />
                    </IconButton>
                    {/* <IconButton size="small" aria-label="delete" onClick={() => deleteFuncToast()}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton> */}
                  </Grid>
                </Grid>
              </>
            ))
          ) : (
            <Box display={'flex'} justifyContent={'center'} mt={10}>
              <Typography variant="h3" mt={3}>
                {'No Guidebook Found'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}

export default ExpertsGuidebookPage;
