import Alert, { SweetAlertIcon } from 'sweetalert2';
import { customNotification } from '../../components';
import { resetStore, RootState } from "../redux/store";
import { AUTH_TOKEN, COMPANY, DISMISSED_NOTIFICATIONS, routes, USER_OBJECT } from "../constants";
import { useNavigate, } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { apis } from '../apis';

export const useAuth = () => {
  const { user: { user } } = useSelector((state: RootState) => state);
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = (
    title: string,
    text: string,
    icon: SweetAlertIcon,
    showCancelButton: boolean,
    confirmButtonColor: string,
    cancelButtonColor: string,
    confirmButtonText: string) => {
    Alert.fire({
      title,
      text,
      icon,
      showCancelButton,
      confirmButtonColor,
      cancelButtonColor,
      confirmButtonText,
    }).then(async (result) => {
      if (result.isConfirmed) {
        localStorage.removeItem(USER_OBJECT);
        localStorage.removeItem(AUTH_TOKEN);
        localStorage.removeItem(COMPANY);
        localStorage.removeItem(DISMISSED_NOTIFICATIONS);
        dispatch(resetStore());
        navigate(routes.signIn, { replace: true });
        customNotification.success(`You’ve logged out successfully.`);
        try {
          await apis.revokeUserSession(user.id)
        } catch(e) {
          console.error(e)
        }
      }
    });
  };
  return {
    handleLogout
  }
}

export const clearLocalStorage = () => {
  localStorage.removeItem(AUTH_TOKEN);
  localStorage.removeItem(COMPANY);
  localStorage.removeItem(DISMISSED_NOTIFICATIONS);
  localStorage.removeItem(USER_OBJECT);
}

export const handleAuthLogout = (message: string, forced: boolean = false) => {
  if(forced){
    clearLocalStorage()
  } else {
    Alert.fire({
      title: "Logging you out!",
      text: message,
      icon: "warning",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Proceed",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        clearLocalStorage()
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 1000);
      }
    });
  }
 
};
