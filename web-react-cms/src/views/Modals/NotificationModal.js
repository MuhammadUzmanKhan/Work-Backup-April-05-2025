import React from 'react';
import { Box, Grid, Modal, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { ReactComponent as IconClose } from 'assets/icons/icon-close.svg';
import { ReactComponent as IconCheckmark } from 'assets/icons/Icon-Checkmark.svg';

export default function NotificationModal({
  withoutIcon,
  title,
  description,
  open,
  handleClose,
  titleSx
}) {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          outline: 'none',
          position: 'absolute',
          left: '6%',
          top: '30%',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '17px 20px 24px',
          width: '80%'
        }}>
        <Grid container>
          <Grid item xs={12} textAlign="right">
            <IconClose onClick={handleClose} />
          </Grid>
          {!withoutIcon ? (
            <Grid item xs={12} sx={{ marginBottom: '16px' }} textAlign="center">
              <IconCheckmark
                style={{
                  height: '26px',
                  width: '36px'
                }}
              />
            </Grid>
          ) : (
            <div />
          )}
          <Grid item xs={12} sx={{ textAlign: 'center', padding: '20px', ...titleSx }}>
            <Typography variant="bodyBig" color="common.darkPurple">
              {title}
            </Typography>
          </Grid>
          {description ? (
            <Grid item xs={12} style={{ marginTop: '16px' }}>
              <Typography variant="body2" color="common.darkPurple">
                {description}
              </Typography>
            </Grid>
          ) : (
            <div />
          )}
        </Grid>
      </Box>
    </Modal>
  );
}

NotificationModal.defaultProps = {
  withoutIcon: false,
  titleSx: {}
};

NotificationModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  withoutIcon: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  titleSx: PropTypes.object
};
