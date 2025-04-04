import { Modal, Card, Row, Col, Descriptions, List, Button, Typography, message, Tooltip, Checkbox, Badge, Tag } from 'antd';
import { convertDateFormat } from '../../services/utils/convertDate';
import { IModal, apis, routes, useLoader } from '../../services';
import { CheckSquareOutlined, SnippetsOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { IContact } from '../../services/types/contacts';
import { CONTACT_SOURCE } from '../../services/types/common';
import { BidStatus } from '../../services/types/bids';
import customNotification from '../notification';
import { stringToColor } from '../../services/utils/helpers';

const ContactDetailsModal = ({ modal, handleCloseModal }: { modal: IModal, handleCloseModal: () => void }) => {
  const [contact, setContact] = useState<IContact | null>(null)
  const [iconClicked, setIconClicked] = useState(false);

  const { loading, on, off } = useLoader()

  const getContactBySlug = async (id: string) => {
    try {
      on()
      const { data } = await apis.getContactBySlug(id);
      setContact(data?.contact as IContact)
    } catch (error: any) {
      console.error('Error: ', error)
      customNotification.error(error?.response?.data?.message || 'An Error occurred! Please try again later')
    } finally { off() }
  }

  useEffect(() => {
    if (modal.show) {
      getContactBySlug(modal.slug!)
    }
  }, [modal.slug])

  const name = contact?.name || "";
  const regex = /\(([^)]+)\)/; // remove ( )
  const displayName = contact?.source === CONTACT_SOURCE.UPWORK ? (name.match(regex)?.[1] || name) : name;

  return (
    <Modal
      footer={null}
      width={'95%'}
      height={'95vh'}
      loading={loading}
      title={<div className="flex justify-between items-center">
        <Typography.Title level={4}>Contact Details</Typography.Title>
        <div className="d-flex gap-3 mr-14 mb-14">
          <Tooltip title="Copy Link">
            <Button type="primary"
              size={"middle"}
              className="bg-[#1A4895] text-white"
              onClick={() => {
                setIconClicked(true)
                navigator.clipboard.writeText(`${window.location.origin}${routes.contacts}/${contact?.slug}`)
                message.success("Link Copied to Clipboard", 1)
                setTimeout(() => setIconClicked(false), 500)
              }}
            >
              Copy Link
              {
                iconClicked ? <CheckSquareOutlined /> : <SnippetsOutlined />
              }
            </Button>
          </Tooltip>
        </div>
      </div>
      }
      open={modal.show}
      onCancel={handleCloseModal}
      style={{ top: 20, overflowY: 'auto' }}

    >
      <Row gutter={16}>
        {/* Left Column */}
        <Col span={8}>
          <Card title="Profile Information">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{displayName}</Descriptions.Item>
              <Descriptions.Item label="Email">{contact?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{contact?.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="Location">{contact?.location}</Descriptions.Item>
              <Descriptions.Item label="Country">{contact?.locationCountry}</Descriptions.Item>
              <Descriptions.Item label="State">{contact?.locationState}</Descriptions.Item>
              <Descriptions.Item label="First Connection Date">{convertDateFormat(contact?.createdAt!)}</Descriptions.Item>
              <Descriptions.Item label="Timezone">{contact?.timeZone}</Descriptions.Item>
              <Descriptions.Item label="LinkedIn Headline">{contact?.profileHeadline}</Descriptions.Item>
              <Descriptions.Item label="LinkedIn Profile URL">
                <a href={`https://${contact?.linkedinProfileLink}`} target="_blank" rel="noopener noreferrer">
                  {contact?.linkedinProfileLink}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="LinkedIn Connections Count">{contact?.linkedinConnections}</Descriptions.Item>
              <Descriptions.Item label="LinkedIn Followers Count">{contact?.linkedinFollowers}</Descriptions.Item>
              <Descriptions.Item label="Websites">
                {contact?.websites?.map((website, index) => (
                  <span key={index}>
                    {website}
                    <br />
                  </span>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="Industry">
                {contact?.linkedInReference?.map(ref =>
                  ref?.industry?.name ? (
                    <Badge

                      key={ref?.industry?.name}
                      count={ref?.industry?.name}
                      style={{ backgroundColor: stringToColor(ref?.industry?.name), marginRight: 8 }}
                    />
                  ) : null
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Business Developers">
                {contact?.source === CONTACT_SOURCE.UPWORK ? contact?.bid?.map((ref, index) =>
                  <span key={ref?.user?.name}>
                    {ref?.user?.name}
                    {ref?.user?.deletedAt && <Tag color="red">Deleted</Tag>}
                    {index < contact?.bid.length - 1 && ', '}
                  </span>
                )
                  : contact?.source === CONTACT_SOURCE.LINKEDIN ? contact?.linkedInReference?.map((ref, index) => (
                    <span key={ref?.user?.name}>
                      {ref?.user?.name}
                      {ref?.user?.deletedAt && <Tag color="red">Deleted</Tag>}
                      {index < contact?.linkedInReference.length - 1 && ', '}
                    </span>)
                  ) : null
                }
              </Descriptions.Item>
              <Descriptions.Item label="Profiles">
                {contact?.source === CONTACT_SOURCE.UPWORK ? (
                  contact?.bid?.map((ref, index) => (
                    <span key={ref?.bidProfile?.name}>
                      {ref?.bidProfile?.name}
                      {ref?.bidProfile?.deletedAt && <Tag color="red">Deleted</Tag>}
                      {index < contact?.bid.length - 1 && ', '}
                    </span>
                  ))
                ) : contact?.source === CONTACT_SOURCE.LINKEDIN ? (
                  contact?.linkedInReference?.map((ref, index) => (
                    <span key={ref?.profile?.name}>
                      {ref?.profile?.name}
                      {ref?.profile?.deletedAt && <Tag color="red">Deleted</Tag>}
                      {index < contact?.linkedInReference.length - 1 && ', '}
                    </span>
                  ))
                ) : null}
              </Descriptions.Item>
              <Descriptions.Item label="Decision Maker">
                <Checkbox
                  disabled
                  checked={contact?.decisionMaker}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Designation">{contact?.designation}</Descriptions.Item>
              <Descriptions.Item label="Social Media">
                {contact?.socialMediaLinks && contact.socialMediaLinks.length > 0 ? (
                  contact.socialMediaLinks.map((link) => (
                    <div key={link?.name}>
                      {link?.name}: {link?.url}
                    </div>
                  ))
                ) : null}
              </Descriptions.Item>
              {/* Upwork */}
              <Descriptions.Item label="Upwork Payment Method">{contact?.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Upwork Rating">{contact?.rating}</Descriptions.Item>
              <Descriptions.Item label="Upwork Plus">
                <Checkbox
                  disabled
                  checked={!!contact?.upworkPlus}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Total Spent on Upwork">{contact?.historyTotalSpent}</Descriptions.Item>
              <Descriptions.Item label="Open Jobs on Upwork">{contact?.historyOpenJobs}</Descriptions.Item>
              <Descriptions.Item label="Jobs Posted on Upwork">{contact?.historyJobsPosted}</Descriptions.Item>
              <Descriptions.Item label="Interviews on Upwork">{contact?.historyInterviews}</Descriptions.Item>
              <Descriptions.Item label="Hours Billed on Upwork">{contact?.historyHoursBilled}</Descriptions.Item>
              <Descriptions.Item label="Member Since on Upwork">{contact?.historyMemberJoined ? convertDateFormat(contact?.historyMemberJoined) : ''}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Middle Column */}
        <Col span={10}>
          <Card title="Companies" style={{ marginBottom: '16px' }}>
            <List
              itemLayout="vertical"
              dataSource={contact?.companies}
              renderItem={company => (
                <List.Item>
                  <List.Item.Meta title={company?.name} description={`${company?.location ? company.location : ''} ${(company.experiences?.length && company.experiences[0]?.totalDuration) ? ' - Total Duration: ' + company.experiences[0]?.totalDuration : ''}`} />
                  {company.experiences.length > 0 && (
                    <List
                      itemLayout="vertical"
                      dataSource={company.experiences}
                      renderItem={experience => (
                        <List.Item>
                          <Descriptions size="small">
                            {experience.title && <Descriptions.Item style={{ width: '50%' }} label="Title">{experience.title}</Descriptions.Item>}
                            {experience.duration && <Descriptions.Item label="Duration">{experience.duration}</Descriptions.Item>}
                          </Descriptions>
                        </List.Item>
                      )}
                    />
                  )}
                </List.Item>
              )}
            />
          </Card>

          <Card title="Institutions" style={{ marginBottom: '16px' }}>
            <List
              itemLayout="vertical"
              dataSource={contact?.institutions}
              renderItem={institution => (
                <List.Item>
                  <List.Item.Meta title={institution?.name} />
                  {institution.education.length > 0 && (
                    <List
                      itemLayout="vertical"
                      dataSource={institution.education}
                      renderItem={education => (
                        <List.Item>
                          <Descriptions size="small">
                            <Descriptions.Item style={{ width: '60%' }} label="Degree">{education.degree}</Descriptions.Item>
                            <Descriptions.Item label="Duration">{education.duration}</Descriptions.Item>
                          </Descriptions>
                        </List.Item>
                      )}
                    />
                  )}
                </List.Item>
              )}
            />
          </Card>

          <Card title="Skills">
            <List
              itemLayout="horizontal"
              dataSource={contact?.skills}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta title={item?.name} />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column */}
        <Col span={6}>
          <Card title="Associations" style={{ marginBottom: '16px' }}>
            <Card title="Bids" style={{ marginBottom: '16px' }}>
              <List
                itemLayout="vertical"
                dataSource={contact?.bid}
                renderItem={bid => (
                  <List.Item>
                    <List.Item.Meta title={
                      <a href={bid.upworkProposalURL} target='_blank'><h3>{`View Upwork ${bid.status === BidStatus.PENDING ? 'Proposal' : bid.status === BidStatus.ACTIVE ? 'Lead' : 'Contract'}`}</h3></a>
                    }
                      description={
                        <>
                          <Typography.Paragraph
                            style={{ cursor: 'pointer' }}
                            onClick={() => window.open(`${window.location.origin}${routes.deals}/${bid?.slug}`, '_blank')}
                            copyable={{ tooltips: false, text: `${window.location.origin}${routes.deals}/${bid?.slug}` }}
                          >
                            View Deal
                          </Typography.Paragraph>
                          <Descriptions column={1}>
                            <Descriptions.Item label="Proposal Date">{convertDateFormat(bid.createdAt)}</Descriptions.Item>
                            {bid.responseDate && <Descriptions.Item label="Lead Date">{convertDateFormat(bid.responseDate)}</Descriptions.Item>}
                            {bid.contractDate && <Descriptions.Item label="Contract Date">{convertDateFormat(bid.contractDate)}</Descriptions.Item>}
                          </Descriptions>
                        </>
                      } />
                  </List.Item>
                )}
              />
            </Card>


            <Card title="Job" style={{ marginBottom: '16px' }}>
              {contact?.job && <Descriptions column={1}>
                <Descriptions.Item label="Title">{contact?.job?.title}</Descriptions.Item>
                {contact?.job?.category && <Descriptions.Item label="Category">{contact?.job?.category}</Descriptions.Item>}
                <Descriptions.Item label="URL"> <a href={contact?.job?.url} target='_blank'>{contact?.job?.url}</a></Descriptions.Item>
                {contact?.job?.postedDate && <Descriptions.Item label="Posted Date">{convertDateFormat(contact?.job?.postedDate)}</Descriptions.Item>}
              </Descriptions>}
            </Card>

          </Card>

        </Col>
      </Row>
    </Modal>
  );
};

export default ContactDetailsModal;
