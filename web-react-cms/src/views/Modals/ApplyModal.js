import React from 'react';
import { Box, Grid, Modal, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { t } from 'i18next';

import BaseButton from 'components/formControl/baseButton/BaseButton';
import palette from 'theme/palette';
import { ReactComponent as IconClose } from 'assets/icons/icon-close.svg';

export default function ApplyModal({ open, handleClose, handleApply }) {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          outline: 'none',
          position: 'absolute',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '17px 16px 24px',
          width: '80%',
          left: '6%',
          top: '30%'
        }}>
        <Grid container>
          <Grid item xs={12} textAlign="right">
            <IconClose onClick={handleClose} />
          </Grid>
          <Grid item xs={12} sx={{ marginBottom: '16px' }} textAlign="center">
            <Typography variant="bodyBig" color="common.darkPurple">
              Skip the Hassle!
            </Typography>
          </Grid>
          <Grid item xs={12} textAlign="center" sx={{ marginBottom: '16px' }}>
            <Typography variant="body1" color="common.darkPurple" sx={{ letterSpacing: '-0.01em' }}>
              Not sure what’s best for you?
              <br />
              Answer a couple of questions and we’ll help you find the most suitable product for
              you.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <BaseButton
              customColor={palette.variables.darkPurple}
              type="submit"
              fullWidth
              variant="contained"
              onClick={handleApply}
              element={t('next')}
            />
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}

ApplyModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  handleApply: PropTypes.func
};
