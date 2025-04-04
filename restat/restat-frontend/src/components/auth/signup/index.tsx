
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import PhoneInput from 'react-phone-input-2';
import Header from '../../header';
import { generateRandomSigninCredentials, signUpValidationSchema } from '../../../services';
import Input from '../../input';
import { Lock, Mail, UserCheck } from '../../../assets/images/svg-react-component';
import Loader from '../../loader';
import Footer from '../../footer';
import { images } from '../../../assets';
import { FormsTypes } from '../../../services/types/forms';


interface SignupFormProps {
  onSignUpWithEmailPassword: (values: FormsTypes.SignUpFormValues) => void,
  handleSignInWithGoogle: () => void,
  socialAuthLoading: boolean,
  loading: boolean
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignUpWithEmailPassword, handleSignInWithGoogle, socialAuthLoading, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="content">
      <Header
        title='Sign In'
        subTitle='Already have an account?'
        handleClick={() => navigate('/sign-in')}
      />
      <div className="form-card">
        <h2>Let's start!</h2>
        <Formik
          initialValues={generateRandomSigninCredentials(process.env.REACT_APP_ENV!)}
          validationSchema={signUpValidationSchema}
          onSubmit={onSignUpWithEmailPassword}
        >
          {({
            values,
            handleChange,
            handleBlur,
            submitForm,
            errors,
            touched,
            setFieldValue,
          }) => (
            <div className="inner-wrapper" onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); 
                submitForm(); 
              }
            }}>
              <Input
                label='Full Name'
                type='text'
                placeholder='John Doe'
                value={values.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                name='fullName'
                srcLeft={<UserCheck className="field-icon-left" fillColor={touched.fullName ? (errors.fullName ? 'red' : 'green') : 'none'} />}
                errors={errors.fullName}
                touched={touched.fullName}
              />
              <Input
                label='Email'
                type='email'
                placeholder='example123@gmail.com'
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                name='email'
                srcLeft={<Mail className="field-icon-left" fillColor={touched.email ? (errors.email ? 'red' : 'green') : 'none'} />}
                errors={errors.email}
                touched={touched.email}
              />
              <div>
                <label>Phone Number <span>*</span></label>
                <PhoneInput
                  country={'pk'}
                  value={values.phoneNumber}
                  containerClass="mb-3"
                  inputClass="form-control"
                  inputStyle={{ width: "100%", height: "3.125rem", border: "0.0625rem solid", fontSize: "1.125rem", color: "var(--blue)" }}
                  onChange={(ph) => setFieldValue('phoneNumber', ph)}
                  onBlur={() => handleBlur({ target: { name: 'phoneNumber' } })}
                />
              </div>
              <Input
                label='Password'
                type='password'
                placeholder='minimum 8 characters'
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                name='password'
                srcLeft={<Lock className="field-icon-left" fillColor={touched.password ? (errors.password ? 'red' : 'green') : null} />}
                errors={errors.password}
                touched={touched.password}
              />
              <Input
                label='Confirm Password'
                type='password'
                placeholder='minimum 8 characters'
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                name='confirmPassword'
                srcLeft={<Lock className="field-icon-left" fillColor={touched.confirmPassword ? (errors.confirmPassword ? 'red' : 'green') : null} />}
                errors={errors.confirmPassword}
                touched={touched.confirmPassword}
              />
              <button
                className="btn btn-lg blue-btn full-w"
                onClick={submitForm}
                type='submit'
                disabled={loading || socialAuthLoading}
              >
                {loading ? <Loader /> : 'Let\'s Go!'}
              </button>
            </div>
          )}
        </Formik>
        <div className='inner-wrapper'>
          <div className="saprator"><span>or</span></div>
          <ul className='social-link mt-4'>
            <li>
              <button
                className={socialAuthLoading || loading ? 'disabled' : ''}
                onClick={handleSignInWithGoogle}
              >
                {socialAuthLoading ? <Loader /> : <img src={images.google} alt='Google icon' />}
              </button>
            </li>
            <li>
              <button className='disabled'>
                <img src={images.linkedin} alt='LinkedIn icon' />
              </button>
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignupForm;
