import React from 'react';
import PropTypes from 'prop-types';
import { Container, Box, Typography } from '@mui/material';

import styles from 'pages/accountSection/signUp/signUp.module.scss';
import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';

export default function StatusOfRequest({ title, subTitle, image, onClick, btnText, sx }) {
  return (
    <Container
      component="main"
      maxWidth="xs"
      style={{ paddingBottom: '40px', marginTop: '115px', ...sx }}>
      <Box
        className={styles.formContainer}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
        <Typography component="h2" variant="h3" sx={{ marginBottom: '16px' }}>
          {title}
        </Typography>
        <Typography
          component="h3"
          variant="body2"
          align="center"
          sx={{ marginBottom: '24px' }}
          color="common.grey">
          {subTitle}
        </Typography>
        {image}
        <BaseButton
          customColor={palette.variables.darkPurple}
          type="submit"
          fullWidth
          variant="contained"
          onClick={onClick}
          element={btnText}
        />
      </Box>
    </Container>
  );
}

StatusOfRequest.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  image: PropTypes.any,
  onClick: PropTypes.func,
  btnText: PropTypes.string,
  sx: PropTypes.object
};
