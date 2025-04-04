import { GoogleAuthProvider } from "firebase/auth";
import { socialLoginWithPopUp } from "../utils/firebase-login";
import { auth } from "../utils/firebase";
import authenticateUser from "./authenticate";





const onSignInWithGoogle = async () => {
    const provider = GoogleAuthProvider;
    const userIdToken = await socialLoginWithPopUp(auth, provider);
    const user = await authenticateUser({ idToken: userIdToken! });
    return user;
}

export default onSignInWithGoogle;
