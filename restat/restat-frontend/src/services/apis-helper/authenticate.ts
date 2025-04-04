import { customNotification } from '../../components';
import { apis } from "../apis";
import { ApiTypes } from "../types/api-types";
import { AUTH_TOKEN, USER_OBJECT } from "../constants";
import { UserState } from "../types/user";

const authenticateUser = async ({ idToken }: ApiTypes.Authenticate): Promise<UserState> => {
  const { data: { token, user } } = await apis.authenticate({ idToken: idToken });
  localStorage.setItem(USER_OBJECT, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN, token);
  customNotification.success(`You've successfully signed in.`);
  return user;
}

export const authenticateOnly = async ({ idToken }: ApiTypes.Authenticate): Promise<{user: UserState, token: string}> => {
  const { data: { token, user } } = await apis.authenticate({ idToken: idToken });
  return {user, token};
}

export const loginUser = async ({ token, user}: {token: string, user: any}) => {
  localStorage.setItem(USER_OBJECT, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN, token);
  customNotification.success(`You've successfully signed in.`);
}



export default authenticateUser
