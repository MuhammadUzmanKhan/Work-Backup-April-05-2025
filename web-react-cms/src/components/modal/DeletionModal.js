import { Modal, Typography, Divider, Grid, IconButton, Tooltip } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import React from 'react'
import { useTranslation } from 'react-i18next'
import palette from 'theme/palette'
import RefreshIcon from '@mui/icons-material/Refresh'
import LaunchIcon from '@mui/icons-material/Launch'
import InfoOutlined from '@mui/icons-material/InfoOutlined'

export default function DeletionModal({
  handleClose,
  onReload,
  text,
  list,
  open,
  width,
  heading = 'Linked Entities',
  onPressGoTo
}) {
  const { t } = useTranslation()
  const published = list.filter((item, index) => list.indexOf(item) === index && item.published)

  // const styleCount = {}

  // list.forEach((obj) => {
  //   styleCount[obj.id] = (styleCount[obj.id] || 0) + 1
  // })

  // const unpublished = list.filter((obj) => styleCount[obj.id] === 1)

  const unpublished = list.filter((item) => !published.some((pub) => pub.id === item.id))
  // console.log(' -- Published -- ', published)
  // console.log(' -- Unpublished -- ', unpublished)
  console.log([...published, ...unpublished])

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: width ? width : '50%',
    maxHeight: '50%',
    bgcolor: 'background.paper',
    border: `2px solid ${palette.variables.orange}`,
    boxShadow: 24,
    borderRadius: 2,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description">
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ p: 2 }}
            component="p"
            variant="bodyBig"
            color={palette.variables.darkPurple}>
            {heading}
          </Typography>
          <IconButton size="small" aria-label="reload" onClick={onReload}>
            <RefreshIcon sx={{ display: 'flex', alignSelf: 'center', mr: 2, ml: 2 }} />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex' }}>
          <Typography
            sx={{ padding: 3, pl: 2 }}
            variant="body1"
            color={palette.variables.darkPurple}>
            {text}
          </Typography>
        </Box>
        <Divider />
        <Grid container spacing={2} sx={{ m: 1, mb: 3 }}>
          <Grid item xs={3}>
            <Typography
              sx={{ ml: 0 }}
              variant="subtitle1"
              component="h4"
              color={palette.variables.orange}>
              {t('fields.type')}
            </Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography
              sx={{ ml: 0 }}
              variant="subtitle1"
              component="h4"
              color={palette.variables.orange}>
              {t('fields.label')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography
              sx={{ ml: 0 }}
              variant="subtitle1"
              component="h4"
              color={palette.variables.orange}>
              {t('fields.published')}
            </Typography>
          </Grid>

          <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              sx={{ ml: 0 }}
              variant="subtitle1"
              component="h4"
              color={palette.variables.orange}>
              {t('fields.goToLink')}
            </Typography>
          </Grid>
        </Grid>
        <Box>
          {list &&
            [...published, ...unpublished].map((item, index) => (
              <Grid key={index} container spacing={2} mb={2}>
                <Grid item xs={3} sx={{ display: 'flex' }}>
                  <Typography sx={{ ml: 3 }} variant="subtitle1" component="h4">
                    {item.type}
                  </Typography>
                </Grid>

                <Grid item xs={3}>
                  <Typography sx={{ ml: 3 }} variant="subtitle1" component="h4">
                    {item.label}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography sx={{ ml: 3 }} variant="subtitle1" component="h4">
                    {item.published ? 'True' : 'False'}
                    {item.published && (
                      <Tooltip
                        title={
                          <span style={{ fontSize: 14 }}>
                            {'You need to publish the linked entity after saving it.'}
                          </span>
                        }>
                        <IconButton size="small" aria-label="info">
                          <InfoOutlined
                            style={{ fill: palette.variables.orange }}
                            fontSize="small"
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Typography>
                </Grid>

                <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    sx={{
                      ml: 3,
                      cursor: 'pointer',
                      color: palette.variables.orange,
                      textDecoration: 'underline'
                    }}
                    variant="subtitle1"
                    component="h4"
                    onClick={() => onPressGoTo(item.id, item.type)}>
                    {'Go To Link'}
                  </Typography>
                  <LaunchIcon
                    fontSize="20px"
                    style={{ marginLeft: 5, color: palette.variables.orange }}
                  />
                </Grid>
              </Grid>
            ))}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, alignSelf: 'flex-end' }}>
          <BaseButton
            customColor={palette.variables.darkPurple}
            variant="contained"
            element={'OK'}
            onClick={handleClose}
            sx={{ display: 'flex', width: 100 }}
          />
        </Box>
      </Box>
    </Modal>
  )
}
