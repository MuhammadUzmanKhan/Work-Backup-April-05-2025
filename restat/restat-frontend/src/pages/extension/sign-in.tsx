// ExtensionSignIn.jsx
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import './index.scss';
import { images } from '../../assets';
import { apis, auth, useLoader } from '../../services';
import { GoogleAuthProvider } from 'firebase/auth';
import { socialLoginWithPopUp } from '../../services/utils/firebase-login';
import { customNotification } from '../../components';
import { useEffect } from 'react';

const ExtensionSignIn = () => {
  const { loading, on, off } = useLoader()

  const handleSignInWithGoogle = async () => {
    try {
      on()
      // const user = await onSignInWithGoogle();
      const provider = GoogleAuthProvider;
      const userIdToken = await socialLoginWithPopUp(auth, provider);
      const { data: { token, user } } = await apis.authenticateSignInForExtension({ idToken: userIdToken! });
  
      if (!user?.companyId) {
        return customNotification.error('Please complete the onboarding process to continue!')
      }

      window.postMessage({ action: 'restat-social-login', data: { user, token } }, '*');
      setTimeout(() => {
        window.close();
      }, 0);

    } catch (error: any) {
      console.error('Error in Extension Login:', error)
      if(error?.response?.status === 404){
        customNotification.error("User does not exist. Please sign up to get started.");
      } else customNotification.error(error?.response?.data?.message ?? 'An Error Occurred. Please try again')

    } finally {
      off()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSignInWithGoogle(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown); 
    };
  }, []); 


  return (
    <div className="extension-signin">
      <div className="left-side">
        <div className="icon">
          <img src={images.logoIcon} alt="Restat Icon" />
        </div>
        <h2>Welcome to Restat</h2>
        <p>Restat is designed to help businesses track, measure, and analyze their goals on Upwork and LinkedIn.</p>
      </div>
      <div className="right-side">
        <h2>Sign In</h2>
        <p>Sign in with your Google account to get started.</p>
        <Button loading={loading} type="primary" onClick={handleSignInWithGoogle} icon={<GoogleOutlined />} className="google-button">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default ExtensionSignIn;
