import { useState } from 'react';
import { images } from '../../../../assets';
import { HUBSPOT_CATEGORYS, ROLE, SelectedProperties, INTEGRATION_TYPE } from '../../../../services/types/common';
import './index.scss';
import { Button, Popconfirm, PopconfirmProps, Tag } from 'antd';
import { apis } from '../../../../services';
import { Trash } from '../../../../assets/images/svg-react-component';
import moment from 'moment';
import { customNotification } from '../../../../components';

interface HubspotIntegrationProps {
  pipelineName: string;
  stageName: string;
  updatedAt?: string;
  user: { id: string, name: string, role: string, deletedAt?: string },
  customFields: { [key: string]: SelectedProperties[] }
  fetchData: () => void;
  isAdmin: boolean;
}

const HubspotIntegrationDetails: React.FC<HubspotIntegrationProps> = ({
  pipelineName,
  customFields,
  fetchData,
  stageName,
  updatedAt,
  isAdmin,
  user,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<INTEGRATION_TYPE | null>(null);

  const handleViewFieldsMapping = () => {
    setShowModal(true);
    setCurrentStep(INTEGRATION_TYPE.UPWORK); // Default to the first step
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStep(null);
  };

  const confirm: PopconfirmProps['onConfirm'] = async () => {
    try {
      await apis.deleteHubspotIntegration();
      customNotification.success('Hubspot Integration Deleted');
      fetchData();
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An error occurred in deleting the Hubspot integration!');
    }
  };

  const filteredFields = (category: HUBSPOT_CATEGORYS) =>
    customFields[category]?.filter(field => field?.integration === currentStep) || [];

  return (
    <div className="hubspot-details"
      style={user?.deletedAt ? { width: "450px" } : undefined}
    >
      <div className="detail-top">
        <img src={images.hubspot} width={30} height={30} />
        <h2 className="title">Hubspot Integrated</h2>
        {isAdmin && (
          <Popconfirm
            title="Delete Hubspot Integration"
            description="Are you sure to delete the integration with Restat?"
            onConfirm={confirm}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button icon={<Trash width={20} fillColor="red" />} type="link" />
          </Popconfirm>
        )}
      </div>
      <div className="detail">
        <span className="label">Integration Date:</span>
        <span className="value">
          <b>{moment(updatedAt).format('LLL')}</b>
        </span>
      </div>
      <div className="detail">
        <span className="label">Integrated By:</span>
        <span className="value">
          <b>
            {user?.name} ({user?.role === ROLE.OWNER ? "Owner" : user?.role === ROLE.COMPANY_ADMIN ? 'ADMIN' : user?.role})
            {user?.deletedAt && <Tag color='red' style={{ marginLeft: '10px' }}>Deleted</Tag>}
          </b>
        </span>
      </div>
      <div className="detail">
        <span className="label">Pipeline:</span>
        <span className="value">{pipelineName}</span>
      </div>
      <div className="detail">
        <span className="label">Stage:</span>
        <span className="value">{stageName}</span>
      </div>
      <div className="detail-button-hubspot">
        <button onClick={handleViewFieldsMapping}>View Properties Mapping</button>
      </div>

      {showModal && (
        <div className={`custom-modal ${showModal ? 'open' : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Properties Mapping</h2>
              <button className="close-btn" onClick={handleCloseModal}>Close</button>
            </div>

            <div className="modal-body">
              <div className="step-navigation">
                <Button className={`${currentStep === INTEGRATION_TYPE.UPWORK && 'active'}`} icon={<img width={20} src={images.upwork} />} onClick={() => setCurrentStep(INTEGRATION_TYPE.UPWORK)}>Upwork</Button>
                <Button className={`${currentStep === INTEGRATION_TYPE.LINKEDIN && 'active'}`} icon={<img width={20} src={images.linkedin} />} onClick={() => setCurrentStep(INTEGRATION_TYPE.LINKEDIN)}>LinkedIn</Button>
              </div>

              {currentStep && (
                <>
                  {currentStep !== INTEGRATION_TYPE.LINKEDIN && <>
                    <h2 className="property-title">Deal Properties - {currentStep}</h2>
                    {filteredFields(HUBSPOT_CATEGORYS.DEALS).map(field => (
                      <>
                        <div key={field?.key} className="fields-container">
                          <h2>
                            {field?.label} <span className="red">{!field?.hubspotDefined ? ' (Custom)' : ''}</span>
                          </h2>
                          <h2>
                            <b>{field?.valueName}</b> <span className="red">{field?.isStaticValue ? ' (Static)' : ''}</span>
                          </h2>
                        </div>
                        <hr style={{ marginBottom: '15px' }} />
                      </>
                    ))}
                  </>}

                  <h2 className="property-title">Contact Properties - {currentStep}</h2>
                  {filteredFields(HUBSPOT_CATEGORYS.CONTACTS).map(field => (
                    <>
                      <div key={field?.key} className="fields-container">
                        <h2>
                          {field?.label} <span className="red">{!field?.hubspotDefined ? ' (Custom)' : ''}</span>
                        </h2>
                        <h2>
                          <b>{field?.valueName}</b> <span className="red">{field?.isStaticValue ? ' (Static)' : ''}</span>
                        </h2>
                      </div>
                      <hr style={{ marginBottom: '15px' }} />
                    </>
                  ))}

                  {currentStep !== INTEGRATION_TYPE.LINKEDIN && <>
                    <h2 className="property-title">Company Properties - {currentStep}</h2>
                    {filteredFields(HUBSPOT_CATEGORYS.COMPANIES).map(field => (
                      <>
                        <div key={field?.key} className="fields-container">
                          <h2>
                            {field?.label} <span className="red">{!field?.hubspotDefined ? ' (Custom)' : ''}</span>
                          </h2>
                          <h2>
                            <b>{field?.valueName}</b> <span className="red">{field?.isStaticValue ? ' (Static)' : ''}</span>
                          </h2>
                        </div>
                        <hr style={{ marginBottom: '15px' }} />
                      </>
                    ))}
                  </>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubspotIntegrationDetails;
