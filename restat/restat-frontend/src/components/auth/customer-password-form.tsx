import React from 'react';
import { Form, Input, Button } from 'antd';
import { useFormik } from 'formik';
import PhoneInput from 'react-phone-input-2';
import * as Yup from 'yup';
import { passwordValidator } from '../../services/utils/validators';
import './customer-password-form.scss';
import { images } from '../../assets';
import { useLoader } from '../../services';

interface CustomerPasswordFormProps {
  name: string;
  email: string;
  onContine: ({ password, phone, off }: { password: string; phone: string, off: () => void }) => void;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

// Validation schema
const validationSchema = Yup.object({
  password: passwordValidator,
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .min(10, "Phone number must be at least 10 digits"),
});

const CustomerPasswordForm: React.FC<CustomerPasswordFormProps> = ({ name, email, onContine }) => {
  const { on, loading, off } = useLoader()
  const formik = useFormik<FormValues>({
    initialValues: {
      name,
      email,
      password: '',
      phoneNumber: '',
    },
    validationSchema,
    onSubmit: (values) => {
      on()
      onContine({ password: values.password, phone: values.phoneNumber, off });
    },
  });

  return (
    <div className="cpf-container">
      <div className="cpf-leftSection">
        <div className="cpf-logo"><img src={images.logoIcon} width={80} /></div>
        <div className="cpf-description">
          <h2>Get Started with Verification</h2>
          <p>Please enter your phone number to receive a verification code. Once verified, you'll be able to set up your password and access your account.</p>
        </div>
      </div>

      <div className="cpf-rightSection">
        <div className="cpf-formContainer">
          <div className="cpf-formCard">
            <Form onFinish={formik.handleSubmit} layout="vertical">
              <Form.Item label="Name" className="cpf-formItem">
                <Input className="cpf-inputField" value={formik.values.name} disabled />
              </Form.Item>

              <Form.Item label="Email" className="cpf-formItem">
                <Input className="cpf-inputField" value={formik.values.email} disabled />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                required
                className="cpf-formItem"
                validateStatus={formik.touched.phoneNumber && formik.errors.phoneNumber ? 'error' : 'success'}
                help={formik.touched.phoneNumber && formik.errors.phoneNumber}
              >
                <label className="cpf-labelText">
                  Phone Number <span>*</span>
                </label>
                <PhoneInput
                  country="pk"
                  value={formik.values.phoneNumber}
                  onChange={(phone) => formik.setFieldValue('phoneNumber', phone)}
                  onBlur={() => formik.setFieldTouched('phoneNumber', true)}
                  containerClass="cpf-phoneInputContainer"
                  inputClass="cpf-phoneInputField"
                  inputStyle={{ width: '100%', height: '3.125rem', border: '0.0625rem solid', fontSize: '1.125rem', color: 'var(--blue)' }}
                />
              </Form.Item>

              <Form.Item
                label="Password"
                required
                className="cpf-formItem"
                validateStatus={formik.touched.password && formik.errors.password ? 'error' : 'success'}
                help={formik.touched.password && formik.errors.password}
              >
                <label className="cpf-labelText">
                  Password <span>*</span>
                </label>
                <Input.Password
                  className="cpf-inputField"
                  value={formik.values.password}
                  onChange={(e) => formik.setFieldValue('password', e.target.value)}
                  onBlur={formik.handleBlur}
                />
              </Form.Item>

              <Form.Item className="cpf-formItem">
                <Button loading={loading} type="primary" htmlType="submit" className="cpf-submitButton">
                  Continue
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPasswordForm;
