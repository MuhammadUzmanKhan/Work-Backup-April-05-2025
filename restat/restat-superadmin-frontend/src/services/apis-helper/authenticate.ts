import { customNotification } from "../../components";
import { apis } from "../apis";
import { ApiTypes } from "../types/api-types";

const authenticateUser = async ({ idToken }: ApiTypes.Authenticate) => {
  await apis.authenticate({ idToken: idToken });
  customNotification.success('We have sent otp to your email. Please check your email address.');
}

export default authenticateUser
