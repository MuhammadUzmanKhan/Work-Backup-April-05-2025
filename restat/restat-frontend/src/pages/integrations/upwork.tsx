import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import './index.scss'


const IntegrationsUpwork = () => {
  const [authCode, setAuthCode] = useState("");
  const location = useLocation();

  useEffect(() => {
    const getQueryParam = (name: string) => {
      const params = new URLSearchParams(location.search);
      return params.get(name);
    };

    const code = getQueryParam('code');
    if (code) {
      setAuthCode(code);
    }
  }, [location.search]);

  return (
    authCode ?
      <h4>{authCode}</h4>
      :
      null
  )
}

export default IntegrationsUpwork;
