import { useLocation } from "react-router-dom";
import './index.scss'
import { useEffect, useState } from "react";
import ClickUp from '../settings/integrations/clickup';
import { apis } from "../../services";
import { Folders, Space } from "../../services/types/common";
import ErrorPage from "./error-page";
import { customNotification } from "../../components";

interface IError {
  error: string;
  message: string;
  statusCode: number;
}

const IntegrationsClickup = () => {
  const [authCode, setAuthCode] = useState("");
  const [error, setError] = useState<IError | null>(null)
  const [clickupData, setClickupData] = useState<{ workspaces: Space[], spaces: Space[], folders: Folders[] }>({ workspaces: [], spaces: [], folders: [] });
  const location = useLocation();

  const getQueryParam = (name: string) => {
    const params = new URLSearchParams(location.search);
    return params.get(name);
  };

  const getClickUpData = async (hashCode: string) => {
    try {
      const response = await apis.getClickupWorkspaces(hashCode);
      if (response.data?.teams?.length) {
        setClickupData({
          workspaces: response.data.teams,
          spaces: response.data.spaces,
          folders: response.data.folders
        });
      }
    } catch (err: any) {
      setAuthCode('')
      setError(err?.response?.data)
      customNotification.error(err?.response?.data?.message || 'Something went wrong')
    }
  };

  useEffect(() => {
    const code = getQueryParam('code');

    if (code && !clickupData.workspaces.length) {
      setAuthCode(code);
      getClickUpData(code);
    }
  }, [location.search, clickupData.workspaces.length]);

  return (
    <>
      {error?.statusCode ? <ErrorPage error={error} /> : null}
      {authCode ?
        <ClickUp
          workspaces={clickupData.workspaces}
          space={clickupData.spaces}
          folders={clickupData.folders}
        />
        :
        null}
    </>
  )
}

export default IntegrationsClickup;
