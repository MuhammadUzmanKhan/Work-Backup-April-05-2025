import { Modal, Typography, Divider } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import React from 'react'
import palette from 'theme/palette'

export default function BaseModel({
  handleClose,
  handleSuccess,
  text,
  open,
  width,
  heading = 'Warning'
}) {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: width ? width : '30%',
    bgcolor: 'background.paper',
    border: `2px solid ${palette.variables.orange}`,
    boxShadow: 24,
    borderRadius: 2
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description">
      <Box sx={style}>
        <Box>
          <Typography
            sx={{ p: 2 }}
            component="p"
            variant="bodyBig"
            color={palette.variables.darkPurple}>
            {heading}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex' }}>
          <Typography sx={{ padding: 3 }} variant="body1" color={palette.variables.darkPurple}>
            {text}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <BaseButton
            customColor={palette.variables.darkPurple}
            variant="contained"
            element={'Ok'}
            onClick={handleSuccess}
            sx={{ display: 'flex', width: 100, ml: 3 }}
          />
          <BaseButton
            customColor={palette.variables.orange}
            variant="contained"
            element={'Cancel'}
            onClick={handleClose}
            sx={{ display: 'flex', ml: 3, width: 100 }}
          />
        </Box>
      </Box>
    </Modal>
  )
}
