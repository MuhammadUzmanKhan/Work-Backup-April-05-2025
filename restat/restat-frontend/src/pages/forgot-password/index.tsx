import { useNavigate } from 'react-router-dom';
import { Footer, Header, Input } from '../../components';
import './forgot-password.scss';
import { Formik } from 'formik';
import { forgotPasswordValidationSchema } from '../../services/utils/validation-schemas';
import { FIREBASE_AUTH_TOO_MANY_REQUESTS, FIREBASE_USER_NOT_FOUND, auth, routes, useLoader } from '../../services';
import Loader from '../../components/loader';
import { FormsTypes } from '../../services/types/forms';
import { sendPasswordResetEmail } from 'firebase/auth';
import { customNotification } from '../../components';
import { Mail } from '../../assets/images/svg-react-component';

const ForgotPassword = () => {

  const navigate = useNavigate();
  const { on, off, loading } = useLoader();

  const onSendMeLink = async (values: FormsTypes.ForgotPasswordFormValues) => {
    try {
      on();
      const { email } = values;
      await sendPasswordResetEmail(auth, email);
      customNotification.success("Reset link has been successfully sent.")
    } catch (e: any) {
      switch (e.code) {
        case FIREBASE_USER_NOT_FOUND:
          return customNotification.error("User with this email not found.")
        case FIREBASE_AUTH_TOO_MANY_REQUESTS:
          return customNotification.error("There have been too many requests")
        default:
          return customNotification.error("Something went wrong. Please make sure you have stable internet connection.")
      }
    } finally {
      off();
    }
  }

  return (
    <div className="content">
      <Header title='Sign Up' handleClick={() => navigate(routes.signUp)} subTitle="Don't have an account?" />
      <div className="form-card">
        <h2>Forgot your password</h2>
        <Formik
          initialValues={{ email: '' }}
          validationSchema={forgotPasswordValidationSchema}
          onSubmit={onSendMeLink}
        >
          {({
            values,
            handleChange,
            handleBlur,
            submitForm,
            touched,
            errors
          }) => (
            <div className="inner-wrapper">
              <Input label='Email' type='email' placeholder='example123@gmail.com' value={values.email} onChange={handleChange} onBlur={handleBlur} name='email' srcLeft={<Mail className="field-icon-left" fillColor={touched.email ? errors.email ? 'red' : 'green' : 'none'} />} errors={errors.email} touched={touched.email} />
              <button className="btn btn-lg blue-btn full-w" onClick={submitForm} type='submit' disabled={loading}>{loading ? <Loader /> : 'Send me the link'}</button>
            </div>)}
        </Formik>
      </div>
      <Footer />
    </div>)
}

export default ForgotPassword;
