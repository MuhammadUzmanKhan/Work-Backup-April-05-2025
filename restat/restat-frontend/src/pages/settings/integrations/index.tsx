import { useEffect, useState } from 'react';
import { images } from '../../../assets';
import './Integrations.scss'
import { NOT_ALLOWED_TIP, SINGLE_INTEGRATION_ONLY_TIP, apis } from '../../../services';
import ClickupWorkspaceDetails from './clickup/workspace-details';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import { ROLE, SelectedProperties } from '../../../services/types/common';
import HubspotIntegrationDetails from './hubspot/integration-details';
import { IClickupIntegrationDetails, IHubspotIntegrationDetails } from '../../../services/types/integrations';
import { Tooltip } from 'antd';
import { customNotification } from '../../../components';

interface Integrations_Available_Props {
  name: string;
  image: string;
  disabled: boolean;
  disabledImage?: string;
  color?: string;
  onClick?: () => void;
  allowed: boolean;
  notAllowedTooltip: string
}

const groupByHubspotCategory = (data: SelectedProperties[]): Record<string, SelectedProperties[]> => {
  return data.reduce((acc: Record<string, SelectedProperties[]>, item: SelectedProperties) => {
    const category = item.hubspotCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
}


const Integrations = () => {
  const [clickupIntegrations, setClickupIntegrations] = useState<IClickupIntegrationDetails[]>([]);


  const [hubspotIntegrations, sethubspotIntegrations] = useState<IHubspotIntegrationDetails>({
    user: { id: '', name: '', role: '' },
    pipelineName: '', stageName: '',
    updatedAt: '',
    customFields: []
  })


  const { user: { user }, configuration: { globalConfiguration } } = useSelector((state: RootState) => state);

  const clickUpHandler = () => {
    const clickUpAuthUrl = `https://app.clickup.com/api?client_id=${process.env.REACT_APP_CLICKUP_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_CLICKUP_REDIRECTION_URL}`
    window.location.replace(clickUpAuthUrl);
  }

  const hubspotHandler = () => {
    const hubspotAuthUrl = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.REACT_APP_HUBSPOT_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_HUBSPOT_REDIRECTION_URL}&scope=${process.env.REACT_APP_HUBSPOT_SCOPE}`
    window.location.replace(hubspotAuthUrl);
  }

  // const upworkHandler = () => {
  //   const upworkAuthUrl = `https://www.upwork.com/ab/account-security/oauth2/authorize?response_type=token&client_id=${process.env.REACT_APP_UPWORK_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_UPWORK_REDIRECTION_URL}`
  //   window.location.replace(upworkAuthUrl);
  // }

  const Integrations_Available: Integrations_Available_Props[] = [
    {
      name: 'Clickup',
      image: images.clickUp,
      disabled: (user.role !== ROLE.COMPANY_ADMIN && user.role !== ROLE.OWNER) || !globalConfiguration?.features?.clickUp,
      color: '#a91ff1',
      disabledImage: images.clickUpDisabled,
      onClick: clickUpHandler,
      allowed: (user.role === ROLE.COMPANY_ADMIN || user.role === ROLE.OWNER) && !hubspotIntegrations.pipelineName,
      notAllowedTooltip: !!hubspotIntegrations.pipelineName ? SINGLE_INTEGRATION_ONLY_TIP : NOT_ALLOWED_TIP,

    },
    {
      name: 'Hubspot',
      image: images.hubspot,
      disabled: (user.role !== ROLE.COMPANY_ADMIN && user.role !== ROLE.OWNER) || !globalConfiguration?.features?.hubSpot,
      color: '#ff7a59',
      disabledImage: images.hubspotDisabled,
      onClick: hubspotHandler,
      allowed: (user.role === ROLE.COMPANY_ADMIN || user.role === ROLE.OWNER) && clickupIntegrations.length === 0,
      notAllowedTooltip: clickupIntegrations.length > 0 ? SINGLE_INTEGRATION_ONLY_TIP : NOT_ALLOWED_TIP,
    },
    // {
    //   name: 'Upwork',
    //   image: images.upwork,
    //   disabled: true,
    //   color: '#70da45',
    //   disabledImage: images.upworkDisabled,
    //   // onClick: upworkHandler,
    //   allowed: user.role === ROLE.COMPANY_ADMIN,
    //   notAllowedTooltip: NOT_ALLOWED_TIP,
    // },
  ]

  const getClickUpIntegrations = async () => {
    try {
      const response = await apis.getClickupIntegration();
      if (response.status === 200) {
        const integrations = response.data.map((integration: any) => ({
          subType: integration.subType,
          user: integration.user,
          workspace: integration.workspaceName,
          space: integration.spaceName,
          folder: integration.folderName,
          list: integration.listName,
          status: integration.status,
          isFolderlessList: integration.isFolderlessList,
          isSharedHierarchy: integration.isSharedHierarchy,
          updatedAt: integration.updatedAt,
          customFields: integration.customFields,
        }));
        setClickupIntegrations(integrations);
      }
    } catch (error: any) {
      console.error('Error occurred in getClickUpIntegrations', error);
      customNotification.error(error?.response?.data?.message || 'Error occurred in getClickUpIntegrations');
    }
  };


  const getHubspotIntegrations = async () => {
    try {
      const response = await apis.getHubspotIntegration()
      if (response.status === 200) {
        sethubspotIntegrations({
          user: response.data?.user,
          pipelineName: response.data?.pipelineName,
          updatedAt: response.data?.updatedAt,
          stageName: response.data?.stageName,
          customFields: response.data?.customFields,
        })
      }
    } catch (error: any) {
      console.error('Error occurred in getHubspotIntegrations', error)
      customNotification.error(error?.response?.data?.message || 'Error occurred in getHubspotIntegrations')
    }
  }

  useEffect(() => {
    getClickUpIntegrations()
    getHubspotIntegrations()
  }, [])

  return (
    <div className='Integrations'>
      <h2>My Integrations</h2>
      <p className='description'>The Integrations section provides seamless connectivity with external tools and services, enhancing the functionality and versatility of the profile.</p>

      <div className='d-flex'>
        {Integrations_Available
          .sort((a, b) => (a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1))
          .map(integration => (
            <Tooltip title={integration.allowed ? '' : integration.notAllowedTooltip} >
              <button
                className={`button-integration d-flex g-2 ${(integration.disabled || !integration.allowed) && 'service-disabled'}`}
                type='button'
                onClick={(integration.disabled || !integration.allowed) ? undefined : integration.onClick}
              >
                <img src={integration.disabled ? integration.disabledImage : integration.image} width={30} alt={integration.name} />
                <b style={{ color: !integration.disabled ? integration.color : '' }}>{integration.name}</b>
              </button>
            </Tooltip>
          ))}

      </div>

      <div className='mt-2'>
        {clickupIntegrations.length > 0 &&
          <ClickupWorkspaceDetails
            integrations={clickupIntegrations}
            fetchData={getClickUpIntegrations}
            isAdmin={user.role === ROLE.COMPANY_ADMIN || user.role === ROLE.OWNER}
          />
        }
        {
          hubspotIntegrations.pipelineName &&
          <HubspotIntegrationDetails
            user={hubspotIntegrations.user}
            pipelineName={hubspotIntegrations.pipelineName}
            stageName={hubspotIntegrations.stageName}
            updatedAt={hubspotIntegrations.updatedAt}
            customFields={groupByHubspotCategory(hubspotIntegrations.customFields)}
            fetchData={getHubspotIntegrations}
            isAdmin={user.role === ROLE.COMPANY_ADMIN || user.role === ROLE.OWNER}
          />
        }
      </div>

    </div>
  );
};

export default Integrations;
