import React from 'react';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import Header from '../../header';
import { generateRandomSigninCredentials } from '../../../services';
import { signInValidationSchema } from '../../../services/utils/validation-schemas';
import Input from '../../input';
import { Lock, Mail } from '../../../assets/images/svg-react-component';
import Loader from '../../loader';
import { images } from '../../../assets';
import Footer from '../../footer';

interface SigninFormProps {
  onSignInWithEmailPassword: (values: any) => void;
  handleSignInWithGoogle: () => void;
  loading: boolean;
  socialAuthLoading: boolean;
}

const SigninForm: React.FC<SigninFormProps> = ({
  onSignInWithEmailPassword,
  handleSignInWithGoogle,
  loading,
  socialAuthLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="content">
      <Header
        title="Sign Up"
        handleClick={() => navigate('/sign-up')}
        subTitle="Don't have an account?"
      />
      <div className="form-card">
        <h2>Hey, welcome back!</h2>
        <Formik
          initialValues={generateRandomSigninCredentials(
            process.env.REACT_APP_ENV!
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
            <div className="inner-wrapper" onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitForm(); 
              }
            }}>
              <Input
                label="Email"
                type="email"
                placeholder="example123@gmail.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                name="email"
                srcLeft={
                  <Mail
                    className="field-icon-left"
                    fillColor={
                      touched.email ? (errors.email ? 'red' : 'green') : 'none'
                    }
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
                  <Lock
                    className="field-icon-left"
                    fillColor={
                      touched.password
                        ? errors.password
                          ? 'red'
                          : 'green'
                        : null
                    }
                  />
                }
                errors={errors.password}
                touched={touched.password}
              />
              <div className="flex item-center justify-end mb-2">
                <button onClick={() => navigate('/forgot-password')}>
                  Forgot Password?
                </button>
              </div>
              <button
                className="btn btn-lg blue-btn full-w"
                onClick={submitForm}
                type="submit"
                disabled={loading}
              >
                {loading ? <Loader /> : 'Sign In'}
              </button>
            </div>
          )}
        </Formik>
        <div className="inner-wrapper">
          <div className="saprator">
            <span>or</span>
          </div>
          <ul className="social-link mt-4">
            <li>
              <button
                className={socialAuthLoading || loading ? 'disabled' : ''}
                onClick={handleSignInWithGoogle}
              >
                {socialAuthLoading ? (
                  <Loader />
                ) : (
                  <img src={images.google} alt="google icon" />
                )}
              </button>
            </li>
            <li>
              <button className="disabled">
                <img src={images.linkedin} alt="linkedIn icon" />
              </button>
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SigninForm;
