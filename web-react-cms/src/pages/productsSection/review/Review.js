import React from 'react';
import { Box, Typography, Grid, Rating } from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { t } from 'i18next';

import { ReactComponent as ImageCardDefault } from 'assets/images/image-card-default.svg';
import BaseInput from 'components/formControl/baseInput/BaseInput';
import BaseTextarea from 'components/formControl/baseTextarea/BaseTextarea';
import palette from 'theme/palette';
import ValidationCheckbox from 'components/formControl/ValidationCheckbox';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import NotificationModal from 'views/Modals/NotificationModal';

export default function Review() {
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  const initialState = {
    username: '',
    text: ''
  };
  const validationSchema = Yup.object().shape({
    username: Yup.string().required(t('validation.required')),
    text: Yup.string().required(t('validation.required'))
  });
  const handleSubmit = () => ({});

  return (
    <Box>
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: '24px' }}>
          <Typography variant="h3" color="common.darkPurple">
            Write a Review
          </Typography>
        </Grid>
        <Grid item sx={{ marginBottom: '24px', margin: 'auto' }}>
          <ImageCardDefault
            style={{
              width: '210px',
              height: '130px'
            }}
          />
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '8px' }}>
          <Typography component="h2" variant="subtitle1" color={palette.variables.greyLight}>
            Credit card
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '15px' }}>
          <Typography component="h3" variant="h3" color="common.darkPurple">
            NBB Signature Card
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '8px' }}>
          <Typography variant="body2" component="h3">
            Rate the product
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '16px' }}>
          <Rating
            size="large"
            value={value}
            color="red"
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Formik
            initialValues={initialState}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}>
            {({ values, handleSubmit, handleChange, errors }) => (
              <form onSubmit={handleSubmit}>
                <BaseInput
                  sx={{
                    marginBottom: '24px',
                    marginTop: '8px',
                    maxHeight: '44px',
                    borderRadius: '44px !important'
                  }}
                  fullWidth
                  id="email"
                  label="Username"
                  name="username"
                  rounded={'true'}
                  placeholder="Display the name for the review"
                  autoComplete="username"
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  value={values.username}
                  color={!errors.username && values.username ? 'success' : ''}
                />
                <BaseTextarea
                  style={{ marginBottom: '16px' }}
                  label="Write your review"
                  id="text"
                  name="text"
                  onChange={handleChange}
                  error={!!errors.text}
                  helperText={errors.text}
                  value={values.text}
                  placeholder="What do you think of the product?"
                />
                <ValidationCheckbox
                  name="checkbox"
                  sx={{ paddingBottom: 0, paddingTop: 0 }}
                  label={
                    <Typography component="h3" variant="body2" color={palette.variables.darkPurple}>
                      Submit anonymously
                    </Typography>
                  }
                  id="checkbox"
                  error={!!errors.checkbox}
                  textHelper={errors.checkbox}
                  onChange={handleChange}
                  value={values.checkbox}
                />
                <BaseButton
                  customColor={palette.variables.darkPurple}
                  type="submit"
                  fullWidth
                  variant="contained"
                  element={'Submit your review'}
                  sx={{ marginBottom: '30px', marginTop: '32px', letterSpacing: '0.75px' }}
                />
              </form>
            )}
          </Formik>
        </Grid>
      </Grid>
      <NotificationModal open={open} handleClose={handleClose} />
    </Box>
  );
}
