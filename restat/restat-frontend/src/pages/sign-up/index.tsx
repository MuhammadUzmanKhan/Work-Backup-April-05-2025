import { useState } from 'react';
import Alert from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { FIREBASE_AUTH_EXPIRED_VERIFICATION_CODE, FIREBASE_AUTH_INVALID_VERIFICATION_CODE, apis, auth, routes, useLoader } from '../../services';
import { ConfirmationResult, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { customNotification } from '../../components';
import { FormsTypes } from '../../services/types/forms';
import { authenticateUser } from '../../services/apis-helper';
import onSignInWithGoogle from '../../services/apis-helper/on-signin-with-google';
import { setUser } from '../../services/redux/features/user/user-slice';
import CustomerPasswordForm from '../../components/auth/customer-password-form';
import { loginUser } from '../../services/apis-helper/authenticate';
import { handleFirebaseError } from '../../services/utils/helpers';
import OTPVerification from '../../components/auth/otp-verification';
import SignupForm from '../../components/auth/signup';
import 'react-phone-input-2/lib/style.css';
import './sign-up.scss'

const SignUp = () => {

  const { loading, on, off } = useLoader();
  const navigate = useNavigate();
  const [socialAuthLoading, setSocialAuthLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [googleUser, setGoogleUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')
  const [authUser, setAuthUser] = useState<any>(null)
  const [signUp, setSignUp] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: ''
  })
  const [isVerifying, setIsVerifying] = useState(false);


  let recaptchaVerifier: RecaptchaVerifier | null = null


  // Function to generate a unique ID
  function generateUniqueId() {
    return `recaptcha-container-${Date.now()}`;
  }

  function initializeRecaptcha() {
    // Generate a unique ID for the container
    const uniqueId = generateUniqueId();

    // Create a new div element for reCAPTCHA with a unique ID
    const recaptchaContainer = document.createElement("div");
    recaptchaContainer.setAttribute("id", uniqueId);

    // Append the container to the body or another parent element
    document.body.appendChild(recaptchaContainer);

    // Initialize reCAPTCHA with the new unique container
    if (!recaptchaVerifier) {
      // Only create a new instance if it doesn't already exist
      recaptchaVerifier = new RecaptchaVerifier(
        auth,
        uniqueId, // Use the dynamically generated ID here
        {
          size: "invisible",
          "expired-callback": () => {
            customNotification.error("reCAPTCHA expired, please try again.");
          },
        }
      );
    }
  }

  const handleVerifyOtp = async () => {
    if (isVerifying) return;
    try {
      on();
      setIsVerifying(true);
      if (!confirmationResult) {
        throw new Error("No OTP confirmation available");
      }

      await confirmationResult.confirm(otp);
      await auth.currentUser?.delete();
      const { user } = await createUserWithEmailAndPassword(auth, signUp.email, signUp.password);
      await updateProfile(user, { displayName: signUp.fullName });
      const userObj = await authenticateUser({ idToken: await user.getIdToken() });
      dispatch(setUser(userObj));
      customNotification.success("OTP verified successfully!");
      setIsVerifying(false);
      navigate(routes.onBoarding, { state: { phoneNumber: signUp.phoneNumber } });
    } catch (error: any) {
      if (error.message === "No OTP confirmation available") {
        return customNotification.error("OTP confirmation not available!");
      }
      if (error.code === FIREBASE_AUTH_INVALID_VERIFICATION_CODE) {
        return customNotification.error("Wrong Verification Code Entered!");
      }
      if (error.code === FIREBASE_AUTH_EXPIRED_VERIFICATION_CODE) {
        return customNotification.error("Verification Code Expired!");
      }
      if (error.code === "auth/email-already-in-use") {
        try {
          if (googleUser) {
            const credential = EmailAuthProvider.credential(signUp.email, signUp.password);
            await linkWithCredential(googleUser!, credential);
          }
          customNotification.success("OTP verified successfully.");
          loginUser({ token, user: authUser })
          dispatch(setUser(authUser));
          setIsVerifying(false);
          navigate(routes.onBoarding, { state: { phoneNumber: signUp.phoneNumber } });
          return
        } catch (err) {
          console.error({ err });
          return customNotification.error("Error Occurred.");

        }
      }
      customNotification.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
      off();
    }
  };

  const onSignUpWithEmailPassword = async (values: FormsTypes.SignUpFormValues) => {
    try {
      on();
      const { email, password, fullName, phoneNumber } = values;

      const { data: { userExists, message: text } } = await apis.userExists(email);
      if (userExists) {
        Alert.fire({
          title: "Registration Unsuccessful",
          text,
          icon: "info",
          showCancelButton: true,
          confirmButtonColor: "blue",
          cancelButtonText: "Try Again",
          confirmButtonText: "Contact Us",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = "https://forms.clickup.com/3316051/f/356ak-73198/C4NQHJD02M6VX0Y90D"
          }
        })
        return;
      }

      // Create a new RecaptchaVerifier
      if (!recaptchaVerifier) {
        recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            "expired-callback": () => {
              customNotification.error("reCAPTCHA expired, please try again.");
            }
          },
        );
      }

      const formattedPhoneNumber = '+' + phoneNumber;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier);

      setSignUp({ email, password, phoneNumber, fullName });
      setConfirmationResult(confirmationResult);
      customNotification.success("OTP sent to phone");
      setShowOtp(true);
    } catch (error: any) {
      handleFirebaseError(error)
    } finally {
      off();
      if (recaptchaVerifier) await recaptchaVerifier!.clear();
    }
  }

  const handleSignInWithGoogle = async () => {
    try {
      setSocialAuthLoading(true);
      const { user, token, googleUser } = await onSignInWithGoogle(false);
      setAuthUser(user)
      setToken(token)
      setGoogleUser(googleUser)

      setSignUp({ email: user.email, fullName: user.name, password: '', phoneNumber: '' })

      if (!user.newUser && user.companyId) {
        dispatch(setUser(user));
        loginUser({ token, user })
        !user.onBoardingCompleted ? navigate(routes.onBoardingCenter) : navigate(routes.dashboard)
      }

      setPasswordForm(true)
    } catch (e: any) {
      handleFirebaseError(e)
    } finally {
      setSocialAuthLoading(false);
    }
  }

  const onPasswordFormContinue = async ({
    password,
    phone,
    off,
  }: {
    password: string;
    phone: string;
    off: () => void;
  }) => {
    setSignUp((prev) => ({ ...prev, password, phoneNumber: phone }));

    try {
      // Call the function to initialize reCAPTCHA
      initializeRecaptcha();

      const formattedPhoneNumber = "+" + phone;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        recaptchaVerifier!
      );
      setConfirmationResult(confirmationResult);

      setPasswordForm(false);
      customNotification.success("OTP sent to phone");
      setShowOtp(true);
    } catch (error) {
      handleFirebaseError(error);
    } finally {
      off();
      if (recaptchaVerifier) recaptchaVerifier!.clear();
    }
  };

  return (
    <>
      <div id='recaptcha-container'></div>
      {passwordForm ? <CustomerPasswordForm email={signUp.email} name={signUp.fullName} onContine={onPasswordFormContinue} /> :
        (showOtp ?
          <OTPVerification phone={signUp.phoneNumber} handleVerifyOtp={handleVerifyOtp} loading={loading} navigate={navigate} otp={otp} setOtp={setOtp} /> :
          <SignupForm handleSignInWithGoogle={handleSignInWithGoogle} onSignUpWithEmailPassword={onSignUpWithEmailPassword} loading={loading} socialAuthLoading={socialAuthLoading} />
        )
      }
    </>
  )
}
export default SignUp;
