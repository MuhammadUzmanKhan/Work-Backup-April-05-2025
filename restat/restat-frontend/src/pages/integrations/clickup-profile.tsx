import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './index.scss'
import { apis, routes } from "../../services";
import { customNotification } from '../../components';
import { images } from "../../assets";

const ConnectToClickup = () => {
  const location = useLocation();
  const [user, setUser] = useState({})

  const navigate = useNavigate()

  const getQueryParam = (name: string) => {
    const params = new URLSearchParams(location.search);
    return params.get(name);
  };

  const saveClickupUserInfo = async (code: string) => {
    try {
      const response = await apis.saveClickupProfileInfo(code);
      setUser(response.data?.clickupUser)
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An Error Occurred! Please Try Again Later.')
      setTimeout(() => {
        navigate(routes.dashboard)
      }, 3000);
    }
  };

  useEffect(() => {
    const code = getQueryParam('code');
    if (code) {
      saveClickupUserInfo(code)
    }
  }, [location.search]);

  return (
    <div>
      {user ?
        <>
          <div className='connect-to-clickup-page'>
            <div className='connection-icons-page'>
              <img src={images.logoIcon} alt='Restat Icon' width={150} />
              <img src={images.connectedIcon} alt='Connect' width={90} />
              <img src={images.clickUp} alt='Clickup Icon' width={150} />
            </div>
            <h2 className='connect-text-page' style={{ color: '#1b4895' }}>Connected</h2>
            <div className="continue-div">
              <button onClick={() => navigate(routes.settings)} className="continue-button">Click to continue</button>
            </div>
          </div>
        </>
        :
        <>
          <div className='connect-to-clickup-page'>
            <div className='connection-icons-page'>
              <img src={images.logoIcon} alt='Restat Icon' width={150} />
              <img src={images.connectIcon} alt='Connect' width={90} />
              <img src={images.clickUp} alt='Clickup Icon' width={150} />
            </div>
            <h2 className='connect-text-page'>Connecting To Clickup...</h2>
          </div>
        </>
      }
    </div>
  )
}

export default ConnectToClickup;
