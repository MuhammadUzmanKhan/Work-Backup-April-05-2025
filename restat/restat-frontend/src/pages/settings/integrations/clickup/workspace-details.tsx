import { useState } from 'react';
import { images } from '../../../../assets';
import './ClickupWorkspaceDetails.scss';
import './CustomFieldsModal.scss';
import { ROLE } from '../../../../services/types/common';
import { Button, Modal, Popconfirm, Tag, Typography } from 'antd';
import { Trash } from '../../../../assets/images/svg-react-component';
import { apis } from '../../../../services';
import moment from 'moment';
import { customNotification } from '../../../../components';
import { IClickupIntegrationDetails } from '../../../../services/types/integrations';

interface ClickupWorkspaceProps {
  integrations: IClickupIntegrationDetails[];
  fetchData: () => void;
  isAdmin: boolean;
}

const ClickupWorkspaceDetails: React.FC<ClickupWorkspaceProps> = ({
  integrations,
  fetchData,
  isAdmin,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IClickupIntegrationDetails | null>(null);

  const handleViewFieldsMapping = (integration: IClickupIntegrationDetails) => {
    setSelectedIntegration(integration);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIntegration(null);
  };

  const confirmDelete = async () => {
    try {
      await apis.deleteClickupIntegration();
      customNotification.success('ClickUp Integration Deleted');
      fetchData();
    } catch (error: any) {
      customNotification.error(
        error?.response?.data?.message || 'An error occurred while deleting the ClickUp integration!'
      );
    }
  };

  return (
    <div className="flex flex-col justify-between items-center w-full gap-5 p-5 border rounded-md">
      <div className='w-full flex items-center justify-between'>
        <p className="heading">ClickUp Integrations</p>
        {isAdmin && (
          <Popconfirm
            title="Delete ClickUp Integration"
            description="Are you sure you want to delete this integration?"
            onConfirm={() => confirmDelete()}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button icon={<Trash width={20} fillColor="red" />} type="link" />
          </Popconfirm>
        )}
      </div>
      <div className='flex justify-between items-center w-full gap-5 px-5'>
        {integrations.map((integration) => (
          <div
            key={integration.workspace}
            className="clickup-details"
            style={integration.user?.deletedAt ? { width: '450px' } : undefined}
          >
            <div className="detail-top">
              <img src={images.clickUp} width={30} height={30} alt="ClickUp Logo" />
              <h2 className="title">ClickUp Integrated ({integration.subType})</h2>
            </div>
            <div className="detail">
              <span className="label">Integration Date:</span>
              <span className="value">
                <b>{moment(integration.updatedAt).format('LLL')}</b>
              </span>
            </div>
            <div className="detail">
              <span className="label">Integrated By:</span>
              <span className="value">
                <b>
                  {integration.user?.name} (
                  {integration.user?.role === ROLE.OWNER
                    ? 'Owner'
                    : integration.user?.role === ROLE.COMPANY_ADMIN
                      ? 'Admin'
                      : 'User'}
                  )
                  {integration.user?.deletedAt && (
                    <Tag color="red" style={{ marginLeft: '10px' }}>
                      Deleted
                    </Tag>
                  )}
                </b>
              </span>
            </div>
            <div className="detail">
              <span className="label">Workspace:</span>
              <span className="value">{integration.workspace || '---'}</span>
            </div>
            <div className="detail">
              <span className="label">Space:</span>
              <span className={`value ${integration.isSharedHierarchy && 'folderless'}`}>
                {integration.isSharedHierarchy ? '---' : integration.space || '---'}
              </span>
            </div>
            <div className="detail">
              <span className="label">Folder:</span>
              <span className={`value ${integration.isFolderlessList && 'folderless'}`}>
                {integration.isFolderlessList ? '---' : integration.folder || '---'}
              </span>
            </div>
            <div className="detail">
              <span className="label">List:</span>
              <span className="value">{integration.list || '---'}</span>
            </div>
            <div className="detail">
              <span className="label">Status:</span>
              <span className="value">{integration.status || '---'}</span>
            </div>
            <div className="detail-button-clickup">
              <button onClick={() => handleViewFieldsMapping(integration)}>View Fields Mapping</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && selectedIntegration && (
        <Modal
          title={
            <Typography.Title level={5} style={{ color: '#1A4895' }}>
              ClickUp Fields Mapping
            </Typography.Title>
          }
          open={showModal}
          onCancel={handleCloseModal}
          footer={null}
        >
          <div className="fields-container mb-2">
            <h2 className="red">
              <b>ClickUp Fields</b>
            </h2>
            <h2 className="red">
              <b>Restat Fields</b>
            </h2>
          </div>

          <hr style={{ marginBottom: '15px', marginTop: '10px' }} />
          {selectedIntegration.customFields?.map((field) => (
            <>
              <div key={field?.customFieldName} className="fields-container mb-2">
                <h2>
                  {field?.customFieldName} <span className="red">{field?.required ? '*' : ''}</span>
                </h2>
                <h2>
                  <b>{field?.name}</b>
                </h2>
              </div>
              <hr style={{ marginBottom: '15px', marginTop: '10px' }} />
            </>
          ))}
        </Modal>
      )}
    </div>
  );
};

export default ClickupWorkspaceDetails;
