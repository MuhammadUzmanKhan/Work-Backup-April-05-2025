import { useLocation } from "react-router-dom";
import './index.scss'
import { useEffect, useState } from "react";
import { apis } from "../../services";
import { IPipeline } from "../../services/types/integrations";
import Hubspot from "../settings/integrations/hubspot";
import { customNotification } from "../../components";


const IntegrationsHubspot = () => {
  const [authCode, setAuthCode] = useState<string>("");
  const [pipelines, setPipelines] = useState<IPipeline[]>([])
  const location = useLocation();

  const getQueryParam = (name: string) => {
    const params = new URLSearchParams(location.search);
    return params.get(name);
  };

  const getHubspotPipelines = async (hashCode: string) => {
    try {
      const response = await apis.getHubspotPipelines(hashCode);
      if (response.data?.pipelines?.length) {
        setPipelines(response.data?.pipelines)
      }
    } catch (err: any) {
      setAuthCode('')
      customNotification.error(err?.response?.data?.message || 'An Error Occurred in getting pipelines from Hubspot.');
    }
  };

  useEffect(() => {
    const code = getQueryParam('code');
    if (code) {
      setAuthCode(code);
      getHubspotPipelines(code)
    }
  }, [location.search]);

  return (
    <>
      {authCode ?
        <Hubspot pipelines={pipelines} />
        :
        null}
    </>
  )
}

export default IntegrationsHubspot;
