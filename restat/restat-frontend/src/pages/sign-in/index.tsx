import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  COMPANY,
  FIREBASE_AUTH_EXPIRED_VERIFICATION_CODE,
  FIREBASE_AUTH_INVALID_LOGIN_CREDENTIALS,
  FIREBASE_AUTH_INVALID_VERIFICATION_CODE,
  FIREBASE_AUTH_TOO_MANY_REQUESTS,
  FIREBASE_AUTH_USER_DISABLED,
  FIREBASE_AUTH_WRONG_PASSWORD,
  FIREBASE_USER_NOT_FOUND,
  apis,
  auth,
  routes,
  useLoader,
} from "../../services";
import { FormsTypes } from "../../services/types/forms";
import { ConfirmationResult, EmailAuthProvider, RecaptchaVerifier, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, linkWithCredential, signInWithEmailAndPassword, signInWithPhoneNumber, updateProfile } from "firebase/auth";
import { customNotification } from '../../components';
import { authenticateUser } from "../../services/apis-helper";
import onSignInWithGoogle from "../../services/apis-helper/on-signin-with-google";
import { setUser } from "../../services/redux/features/user/user-slice";
import { setCompany } from "../../services/redux/features/company/company-slice";
import { handleFirebaseError } from "../../services/utils/helpers";
import SigninForm from "../../components/auth/signin";
import { loginUser } from "../../services/apis-helper/authenticate";
import CustomerPasswordForm from "../../components/auth/customer-password-form";
import OTPVerification from "../../components/auth/otp-verification";
import "./sign-in.scss";
import { clearLocalStorage } from "../../services/hooks/handleLogout";

const SignIn = () => {
  const [socialAuthLoading, setSocialAuthLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
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

  const { loading, on, off } = useLoader();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  let recaptchaVerifier: RecaptchaVerifier | null = null

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

  const handleSignInWithGoogle = async () => {
    try {
      setSocialAuthLoading(true);
      const { user, token, googleUser } = await onSignInWithGoogle(false);
      setAuthUser(user)
      setToken(token)
      setGoogleUser(googleUser)

      setSignUp({ email: user.email, fullName: user.name, password: '', phoneNumber: '' })

      if (!user?.newUser && user?.companyId) {
        dispatch(setUser(user));
        loginUser({ token, user })
        navigate(routes.dashboard)
      }

      setPasswordForm(true)
    } catch (e: any) {
      handleFirebaseError(e)
    } finally {
      setSocialAuthLoading(false);
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
      console.error(error)
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
          const credential = EmailAuthProvider.credential(signUp.email, signUp.password);
          await linkWithCredential(googleUser!, credential);
          customNotification.success("OTP verified successfully.");
          loginUser({ token, user: authUser })
          dispatch(setUser(authUser));
          setIsVerifying(false);
          navigate(routes.onBoarding, { state: { phoneNumber: signUp.phoneNumber } });
          return
        } catch (_) {

        }
      }
      customNotification.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
      off();
    }
  };

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

  const onSignInWithEmailPassword = async (
    values: FormsTypes.SignInFormValues
  ) => {
    on();
    try {
      const { email, password } = values;
      const providers = await fetchSignInMethodsForEmail(auth, email);
      if (providers.length === 0) {
        // No providers found for this email, so the user doesn't have an account
        customNotification.error('No account found with this email!')
      } else if (providers.includes('password')) {
        // Email is linked to password-based sign-in, proceed with password sign-in
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const idToken: string = await user.getIdToken();
        const userObj = await authenticateUser({ idToken });
        dispatch(setUser(userObj));
        if (userObj?.companyId && (userObj.company?.subscription ? userObj.company.subscription?.isActive : true)) {
          const { data: company } = await apis.getCompany(userObj.companyId);
          await localStorage.setItem(COMPANY, JSON.stringify(company))
          dispatch(setCompany(company));
        }

        userObj?.companyId
          ? !userObj.onBoardingCompleted ? navigate(routes.onBoardingCenter) : navigate(routes.dashboard)
          : navigate(routes.onBoarding);
      } else {
        // Email is linked to a different provider (e.g., Google)
        customNotification.info('It looks like you logged in using Google. Please continue with Google Sign-In.')
      }

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
      } else if (error.message === FIREBASE_AUTH_INVALID_LOGIN_CREDENTIALS) {
        customNotification.error(
          "Invalid credentials! Please try again."
        );
      } else {
        customNotification.error(
          error?.response?.data?.message || "Something went wrong. Please check your internet connection."
        );
      }
    } finally {
      off();
    }
  };

  useEffect(() => {
    clearLocalStorage()
  }, [])


  return (
    <>
      {passwordForm ? <CustomerPasswordForm email={signUp.email} name={signUp.fullName} onContine={onPasswordFormContinue} /> :
        (showOtp ?
          <OTPVerification phone={signUp.phoneNumber} handleVerifyOtp={handleVerifyOtp} loading={loading} navigate={navigate} otp={otp} setOtp={setOtp} /> :
          <SigninForm handleSignInWithGoogle={handleSignInWithGoogle} loading={loading} onSignInWithEmailPassword={onSignInWithEmailPassword} socialAuthLoading={socialAuthLoading} />
        )
      }
    </>
  );
};

export default SignIn;
