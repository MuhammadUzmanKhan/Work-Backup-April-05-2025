import { Modal, Typography } from '@mui/material'
import { Box } from '@mui/system'
import PageLoading from 'components/PageLoading'
// import PageLoading from 'components/PageLoading'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { getUserById } from 'store/actions/user'
import palette from 'theme/palette'
import { LANGUAGE_ERROR } from 'utils/constants'

export default function CreatedByModal({ open, info, handleClose }) {
  const dispatch = useDispatch()
  const [publishedBy, setPublishedBy] = useState()
  const [lastModifiedBy, setLastModifiedBy] = useState()
  const [loading, setLoading] = useState(true)
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: `2px solid ${palette.variables.orange}`,
    boxShadow: 24,
    p: 4
  }

  useEffect(async () => {
    if (info?.publishedBy) {
      const pub = await dispatch(getUserById({ id: info?.publishedBy }))
      if (pub.payload !== LANGUAGE_ERROR) setPublishedBy(pub.payload)
    }
    if (info?.lastModifiedBy) {
      const last = await dispatch(getUserById({ id: info?.lastModifiedBy }))
      if (last.payload !== LANGUAGE_ERROR) setLastModifiedBy(last.payload)
    }
    setLoading(false)
  }, [])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description">
      <Box sx={style}>
        {[lastModifiedBy, publishedBy].map(
          (item, i) =>
            item && (
              <Box mb={3} key={i}>
                <Typography
                  id="modal-modal-title"
                  variant="h6"
                  component="h2"
                  color={palette.variables.orange}>
                  {i == 1 ? 'Published' : 'Last Modified'} By:
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: 14 }}>
                  <b>Name:</b> {item?.name}
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: 14 }}>
                  <b>Email: </b>
                  {item?.email}
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: 14 }}>
                  <b>Role:</b> {item?.role}
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: 14 }}>
                  <>
                    <b>{i == 1 ? `Published` : `Last Modified`} At: </b>
                    {i == 1
                      ? new Date(info.publishedAt).toString().slice(0, 25)
                      : new Date(info.lastModifiedAt).toString().slice(0, 25)}
                  </>
                </Typography>
              </Box>
            )
        )}
        {!publishedBy && !lastModifiedBy && !loading && (
          <Box>
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h2"
              display={'flex'}
              justifyContent={'center'}
              color={palette.variables.orange}>
              No User Found
            </Typography>
          </Box>
        )}
        <PageLoading loading={loading} />
      </Box>
    </Modal>
  )
}
