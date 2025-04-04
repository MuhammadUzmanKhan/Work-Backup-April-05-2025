import { useEffect, useState } from "react"
import { ICompanies } from "../../services/types/companies"
import customNotification from "../notification"
import { apis, IModal, routes, useLoader } from "../../services";
import { Button, Card, Col, Descriptions, List, message, Modal, Row, Tooltip, Typography } from "antd";
import { CheckSquareOutlined, SnippetsOutlined } from "@ant-design/icons";
import { convertDateFormat } from "../../services/utils/convertDate";
import { IContact } from "../../services/types/contacts";


function CompaniesDetailsModal({ modal, handleCloseModal }: { modal: IModal, handleCloseModal: () => void }): JSX.Element {
  const [company, setCompany] = useState<ICompanies | null>(null);
  const [iconClicked, setIconClicked] = useState(false);
  const [contacts, setContacts] = useState<IContact[]>([])

  const { loading, on, off } = useLoader()

  const fetchCompanyDetails = async (id: string) => {
    try {
      on()
      const { data } = await apis.getCompanyBySlug(id);
      setCompany(data?.company as ICompanies);
      setContacts(data?.company?.contact as IContact[])
    } catch (error: any) {
      console.error('Error: ', error)
      customNotification.error(error?.response?.data?.message || 'An Error occurred! Please try again later')
    } finally { off() }
  }

  useEffect(() => {
    if (modal.show) {
      fetchCompanyDetails(modal.id!)
    }
  }, [modal.slug])

  return (
    <Modal
      footer={null}
      width={'95%'}
      height={'95vh'}
      loading={loading}
      title={<div className="flex justify-between items-center">
        <Typography.Title level={4}>Company Details</Typography.Title>
        <div className="d-flex gap-3 mr-14 mb-14">
          <Tooltip title="Copy Link">
            <Button type="primary"
              size={"middle"}
              className="bg-[#1A4895] text-white"
              onClick={() => {
                setIconClicked(true)
                navigator.clipboard.writeText(`${window.location.origin}${routes.companies}/${company?.slug}`)
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
          <Button
            type="primary"
            size="middle"
            className="bg-[#1A4895] text-white"
            onClick={handleCloseModal}
          >
            Close
          </Button>
        </div>
      </div>}
      visible={modal.show}
      onCancel={handleCloseModal}
      style={{ top: 20, overflowY: 'auto' }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Profile Information">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Company Name">{company?.name}</Descriptions.Item>
              <Descriptions.Item label="Company Founded Year">{company?.foundedYear ? convertDateFormat(company?.foundedYear.toISOString()) : ''}</Descriptions.Item>
              <Descriptions.Item label="Company Founded Information">{company?.fundedInfo}</Descriptions.Item>
              <Descriptions.Item label="Company Business Type">{company?.businessType}</Descriptions.Item>
              <Descriptions.Item label="Number of Employees">{company?.numberOfEmployees}</Descriptions.Item>
              <Descriptions.Item label="Company Address">{company?.address}</Descriptions.Item>
              <Descriptions.Item label="Company Country">{company?.country}</Descriptions.Item>
              <Descriptions.Item label="Company State">{company?.state}</Descriptions.Item>
              <Descriptions.Item label="Company Website">{company?.website}</Descriptions.Item>
              <Descriptions.Item label="Company Social Media URLs">{company?.socialMediaUrls}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={16}>
          <Card title={
            <div className="flex justify-between items-center">
              <Typography.Title level={4}>Contacts</Typography.Title>
              <Typography.Text type="secondary">Total Contacts: {contacts?.length}</Typography.Text>
            </div>
          }>
            <List
              itemLayout="vertical"
              dataSource={contacts || []}
              renderItem={item => (
                <List.Item>
                  <div className="flex justify-between items-center">
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{item?.name}</p>
                      <p style={{ fontSize: '12px' }}>{item?.email}</p>
                      {item?.ContactExperience?.totalDuration && <p style={{ fontSize: '12px' }}>Total Experenience : {item?.ContactExperience?.totalDuration}</p>}
                      <Typography.Paragraph
                        className="cursor-pointer"
                        onClick={() => window.open(`${window.location.origin}${routes.contacts}/${item?.slug}`, '_blank')}
                        copyable={{ tooltips: false, text: `${window.location.origin}${routes.contacts}/${item?.slug}` }}
                      >
                        View Contact
                      </Typography.Paragraph>
                    </div>
                    <div>
                      {item?.contactExperiences?.length ?
                        <>
                          <Row gutter={16}>
                            {item?.contactExperiences?.map((experience, index) => (
                              <Col key={index} span={10} >
                                <Card
                                  size="small"
                                  bordered={false}
                                  className="bg-[#f5f5f5] text-center min-w-[185px] min-h-[90px] mr-5"
                                >
                                  <Tooltip title={experience?.title} >
                                    <Typography.Text strong style={{ fontSize: '12px', display: 'block', cursor: 'pointer' }}>
                                      {experience?.title && experience.title.length > 20 ? `${experience.title.slice(0, 20)}...` : experience?.title}
                                    </Typography.Text>
                                  </Tooltip>
                                  <Typography.Text style={{ fontSize: '12px' }}>
                                    {experience?.duration}
                                  </Typography.Text>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </>
                        : <div style={{ padding: '10px 0' }}>
                          <Card size="small" bordered={false} className="bg-[#f5f5f5] text-center">
                            <Typography.Text strong style={{ fontSize: '12px', display: 'block' }}>
                              {item?.ContactExperience?.title}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: '12px' }}>
                              {item?.ContactExperience?.duration} {item?.ContactExperience?.totalDuration ? "|" : ""} {item?.ContactExperience?.totalDuration}
                            </Typography.Text>
                          </Card>
                        </div>}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Modal >
  )
}

export default CompaniesDetailsModal