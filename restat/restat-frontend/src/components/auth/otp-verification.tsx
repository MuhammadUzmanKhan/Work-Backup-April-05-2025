import React from 'react';
import { Input, Space, Button } from 'antd';
import './otp-verification.scss';
import Header from '../header';
import { images } from '../../assets';

interface OTPVerificationProps {
  otp: string;
  setOtp: (otp: string) => void;
  handleVerifyOtp: () => void;
  loading: boolean;
  navigate: (path: string) => void;
  phone: string
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ otp, setOtp, handleVerifyOtp, loading, navigate, phone }) => {

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleVerifyOtp();
    }
  };

  return (
    <div className="otp-verification">
      <div className="otp-verification__left">
        <div className="otp-verification__logo">
          <img src={images.logoIcon} width={80} alt="Restat Logo" />
        </div>
        <div className="otp-verification__description">
          <h2 className="otp-verification_heading">Welcome to Our Service</h2>
          <p>
            Please enter the OTP sent to your phone number to verify your account. This one-time verification helps us
            secure your information. Once verified, you'll be set to continue using our services.
          </p>
        </div>
      </div>

      <div className="otp-verification__right">
        <div className='otp_header'>
           <Header title="Sign In" subTitle="Already have an account?" handleClick={() => navigate('/sign-in')} />
        </div>
        <div className="otp-verification__card">
          <h2>OTP Verification</h2>
          <p className="otp-verification__subtitle p-3">Enter the OTP sent to your phone</p>
          <p className='otp-verification__phone'>+{phone}</p>
          <Space className="otp-verification__input">
            <Input.OTP
              value={otp}
              onChange={setOtp}
              onKeyDown={handleKeyPress}
              size="large"
            />
          </Space>
          <Button
            className="otp-verification__button"
            type="primary"
            onClick={handleVerifyOtp}
            disabled={loading}
            loading={loading}
          >
            Verify OTP
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
