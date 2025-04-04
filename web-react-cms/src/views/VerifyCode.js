import React from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';

import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import CodeInput from 'components/formControl/codeInput/CodeInput';
import styles from 'pages/accountSection/forgotPassword/forgotPassword.module.scss';
import { DEADLINE_RESEND } from 'utils/constants';
import Timer from 'components/Timer';

export default function VerifyCode({
  title,
  subTitle,
  onVerify,
  onResend,
  buttonText,
  redirectLink,
  redirectLinkText,
  buttonSx,
  onInput,
  error,
  buttonLoading,
  redirectUrlParams
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deadlineStart } = useSelector((state) => state.user);

  const handleSubmit = (event) => {
    console.log('handleSubmit verifycode', event);
    onVerify(event);
  };

  const VerifyCodeSchema = Yup.object().shape({
    code: Yup.string().min(6).max(6).required(t('validation.required'))
  });
  const initialState = {
    code: ''
  };

  return (
    <Container component="main" maxWidth="xs" style={{ paddingBottom: '40px', marginTop: '115px' }}>
      <Formik
        validateOnChange={false}
        validateOnBlur={false}
        initialValues={initialState}
        validationSchema={VerifyCodeSchema}
        onSubmit={handleSubmit}>
        {({ values, handleChange, handleSubmit, errors }) => (
          <form onSubmit={handleSubmit}>
            {console.log('Formik verifycode', { values, errors })}
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

              <Box component="div" sx={{ width: '100%' }}>
                <CodeInput
                  name="code"
                  value={values.code}
                  error={
                    error && Object.values(error).length
                      ? error
                      : errors.code
                      ? { message: errors.code }
                      : ''
                  }
                  onChange={handleChange}
                  onInput={onInput}
                  qty={6}
                />
                {redirectLink ? (
                  <Typography
                    align="center"
                    component="h3"
                    variant="body2"
                    onClick={() => navigate(redirectLink + '/' + redirectUrlParams.type || '')}
                    sx={{ marginBottom: '61px', marginTop: '32px' }}
                    color="common.lightGreen">
                    {redirectLinkText}
                  </Typography>
                ) : (
                  <div />
                )}
                <BaseButton
                  customColor={palette.variables.darkPurple}
                  type="submit"
                  sx={{ marginBottom: '23px', marginTop: '32px', ...buttonSx }}
                  fullWidth
                  variant="contained"
                  loading={buttonLoading}
                  element={buttonText}
                />
                <Typography
                  align="center"
                  component="h3"
                  variant="caption"
                  color={palette.variables.greyLight}>
                  {t('dontReceiveCode')}

                  <Typography
                    sx={{ marginLeft: '5px' }}
                    align="center"
                    component="span"
                    color="common.lightGreen"
                    onClick={onResend}
                    variant="caption">
                    {t('resend')} {!!deadlineStart && <Timer initialSeconds={DEADLINE_RESEND} />}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
    </Container>
  );
}

VerifyCode.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  onVerify: PropTypes.func,
  onResend: PropTypes.func,
  onInput: PropTypes.func,
  buttonText: PropTypes.string,
  redirectLink: PropTypes.string,
  redirectLinkText: PropTypes.string,
  buttonSx: PropTypes.object,
  error: PropTypes.any,
  buttonLoading: PropTypes.bool,
  redirectUrlParams: PropTypes.object,
  timer: PropTypes.bool
};
