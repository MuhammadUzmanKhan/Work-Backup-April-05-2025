import { signInWithPopup } from "firebase/auth";

export const socialLoginWithPopUp = async (auth: any, provider: any) => {

  try {
    const result = await signInWithPopup(auth, new provider());
    // This gives you a Social Acess Token. You can use it to access the Social API.
    // const credential = await provider?.credentialFromResult(result);
    // const token = credential?.accessToken;
    // The signed-in user info.
    const user = result.user;
    // IdP data available using getAdditionalUserInfo(result)
    return await user.getIdToken();
  } catch (error: any) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = await provider.credentialFromError(error);
    console.error(errorCode, errorMessage, email, credential, 'Show this error message to the Toast')
  }
}