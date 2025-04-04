import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik } from "formik";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { customNotification, Footer, Header, Input } from "../../components";
import {
  FIREBASE_AUTH_EMAIL_CODE,
  FIREBASE_AUTH_EXPIRED_CODE,
  FIREBASE_AUTH_INVALID_CODE,
  FIREBASE_AUTH_USER_DISABLED,
  FIREBASE_USER_NOT_FOUND,
  auth,
  routes,
  useLoader
} from "../../services";
import { changePasswordValidationSchema } from "../../services/utils/validation-schemas";
import Loader from "../../components/loader";
import { FormsTypes } from "../../services/types/forms";
import { Lock } from "../../assets/images/svg-react-component";

const ChangePassword = () => {

  const params = new URLSearchParams(window.location.search);
  const otp = params.get(FIREBASE_AUTH_EMAIL_CODE)!;
  const navigate = useNavigate();
  const { on, off, loading } = useLoader();

  const verifyOTP = async () => {
    try {
      await verifyPasswordResetCode(auth, otp)
    } catch (error: any) {
      switch (error.code) {
        case FIREBASE_AUTH_EXPIRED_CODE:
          return customNotification.error("The reset code has expired. ");
        case FIREBASE_AUTH_INVALID_CODE:
          return customNotification.error("The reset code is malformed or invalid.");
        case FIREBASE_AUTH_USER_DISABLED:
          return customNotification.error("The user associated with the reset code has been disabled.");
        case FIREBASE_USER_NOT_FOUND:
          return customNotification.error("The user associated with the reset code does not exist.")
        default:
          customNotification.error("Something went wrong. Please try again.")
      }
    }
  }

  useEffect(() => {
    verifyOTP();
  }, [])

  const onChangePassword = async (values: FormsTypes.ChangePasswordFormValues) => {
    on();
    const { password } = values;
    try {
      await confirmPasswordReset(auth, otp, password);
      customNotification.success("You have successfully changed the password.");
      navigate(routes.signIn);
    } catch (error: any) {
      switch (error.code) {
        case FIREBASE_AUTH_EXPIRED_CODE:
          return customNotification.error("The reset code has expired. ");
        case FIREBASE_AUTH_INVALID_CODE:
          return customNotification.error("The reset code is malformed or invalid.");
        case FIREBASE_AUTH_USER_DISABLED:
          return customNotification.error("The user associated with the reset code has been disabled.");
        case FIREBASE_USER_NOT_FOUND:
          return customNotification.error("The user associated with the reset code does not exist.")
        default:
          customNotification.error("Something went wrong. Please try again.")
      }
    } finally {
      off();
    }
  }

  return (
    <div className="content">
      <Header title='Sign Up' handleClick={() => navigate(routes.signUp)} subTitle="Don't have an account?" />
      <div className="form-card">
        <h2>Change Your Password</h2>
        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={changePasswordValidationSchema}
          onSubmit={onChangePassword}
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
              <Input label='Password' type='password' placeholder='minimum 8 characters' value={values.password} onChange={handleChange} onBlur={handleBlur} name='password' srcLeft={<Lock className="field-icon-left" fillColor={touched.password ? errors.password ? 'red' : 'green' : 'none'} />} errors={errors.password} touched={touched.password} />
              <Input label='Confirm Password' type='password' placeholder='minimum 8 characters' value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur} name='confirmPassword' srcLeft={<Lock className="field-icon-left" fillColor={touched.confirmPassword ? errors.confirmPassword ? 'red' : 'green' : null} />} errors={errors.confirmPassword} touched={touched.confirmPassword} />
              <button className="btn btn-lg blue-btn full-w" onClick={submitForm} type='submit' disabled={loading}>{loading ? <Loader /> : 'Change Password'}</button>
            </div>)}
        </Formik>
      </div>
      <Footer />
    </div>
  )
}

export default ChangePassword;
