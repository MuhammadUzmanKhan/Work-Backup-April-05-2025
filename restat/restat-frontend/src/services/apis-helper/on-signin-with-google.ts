import { GoogleAuthProvider } from "firebase/auth";
import { socialLoginWithPopUp } from "../utils/firebase-login";
import { auth } from "../utils/firebase";
import authenticateUser, { authenticateOnly } from "./authenticate";

const onSignInWithGoogle = async (autoLogin: boolean = true): Promise<any> => {
  const provider = GoogleAuthProvider;
    const userIdToken = await socialLoginWithPopUp(auth, provider);
    if(autoLogin) {
      const user = await authenticateUser({ idToken: userIdToken! })
      return user
    } else {
      const {user, token} =  await authenticateOnly({ idToken: userIdToken! })
      return {user, token, googleUser: auth.currentUser}
    }
}

export default onSignInWithGoogle;
