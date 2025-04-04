import { Formik } from "formik";
import { Button } from "antd";
import "./sign-in.scss";
import {
  FIREBASE_AUTH_TOO_MANY_REQUESTS,
  FIREBASE_AUTH_USER_DISABLED,
  FIREBASE_AUTH_WRONG_PASSWORD,
  FIREBASE_USER_NOT_FOUND,
  USER_NOT_FOUND,
  auth,
  generateRandomSigninCredentials,
  useLoader,
} from "../../services";
import { FormsTypes } from "../../services/types/forms";
import { Footer, Header, Input } from "../../components";
import { signInWithEmailAndPassword } from "firebase/auth";
import { customNotification } from "../../components";
import { authenticateUser } from "../../services/apis-helper";
import { useNavigate } from "react-router-dom";
import { signInValidationSchema } from "../../services/utils/validation-schemas";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

const SignIn = () => {
  const { on, off, loading } = useLoader();
  const navigate = useNavigate();

  const onSignInWithEmailPassword = async (
    values: FormsTypes.SignInFormValues
  ) => {
    on();
    try {
      const { email, password } = values;
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const idToken: string = await user.getIdToken();
      await authenticateUser({ idToken });
      navigate(`/otp-verification/${idToken}`);
    } catch (error: any) {
      if (error.code === FIREBASE_USER_NOT_FOUND) {
        customNotification.error("No user found with this email.");
      } else if (error.code === FIREBASE_AUTH_WRONG_PASSWORD) {
        customNotification.error(
          "The provided password is incorrect for the given email address."
        );
      } else if (error.code === FIREBASE_AUTH_USER_DISABLED) {
        customNotification.error(
          "User account associated with the provided email is disabled."
        );
      } else if (error.code === FIREBASE_AUTH_TOO_MANY_REQUESTS) {
        customNotification.error(
          "There have been too many unsuccessful sign-in attempts for the given email address. "
        );
      } else if (error.response.data.message === USER_NOT_FOUND) {
        customNotification.error(
          "There is no superadmin with this email. "
        );
      } else {
        customNotification.error(
          "Something went wrong. Please check your internet connection."
        );
      }
    } finally {
      off();
    }
  };

  return (
    <div className="content">
      <Header />
      <div className="form-card">
        <h2>Hey, welcome back!</h2>
        <Formik
          initialValues={generateRandomSigninCredentials(
            import.meta.env.VITE_APP_ENV!
          )}
          validationSchema={signInValidationSchema}
          onSubmit={onSignInWithEmailPassword}
        >
          {({
            values,
            handleChange,
            handleBlur,
            submitForm,
            errors,
            touched,
          }) => (
            <div className="inner-wrapper">
              <Input
                label="Email"
                type="email"
                placeholder="example123@gmail.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                name="email"
                srcLeft={
                  <MailOutlined
                    className="field-icon-left"
                    style={{ color: touched.email ? (errors.email ? "red" : "green") : "none" }}
                  />
                }
                errors={errors.email}
                touched={touched.email}
              />
              <Input
                label="Password"
                type="password"
                placeholder="minimum 8 characters"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                name="password"
                srcLeft={
                  <LockOutlined
                    className="field-icon-left"
                    style={{
                      color: touched.password
                        ? errors.password
                          ? "red"
                          : "green"
                        : undefined
                    }}
                    color={
                      touched.password
                        ? errors.password
                          ? "red"
                          : "green"
                        : undefined
                    }
                  />}
                errors={errors.password}
                touched={touched.password}
              />
              <div className="flex item-center justify-end mb-2">
              </div>
              <Button
                className="btn btn-lg blue-btn full-w"
                onClick={submitForm}
                type="primary"
                loading={loading}
              >
                {"Sign In"}
              </Button>
            </div>
          )}
        </Formik>
      </div>
      <Footer />
    </div>
  );
};

export default SignIn;
