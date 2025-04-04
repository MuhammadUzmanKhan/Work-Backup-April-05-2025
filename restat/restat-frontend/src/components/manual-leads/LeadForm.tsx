import { Select, Input, Checkbox, Button, Card, Col, Row, Modal, Tooltip } from "antd";
import "../index.scss";
import { apis } from "../../services";
import { BusinessManagerProfile, AccountManagerProfile, ProfileSource, LeadFormData } from "../../services/types/common";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import cleanAndTrimWhitespace from "../../services/utils/trimSpaces";
import customNotification from "../notification";

interface LeadFormProps {
  onClose: () => void;
  fetchData?: () => void
  show: boolean;
}

interface FieldProps {
  field: {
    name: string;
    value: any;
    onChange: (event: React.ChangeEvent<any>) => void;
    onBlur: (event: React.FocusEvent<any>) => void;
  };
  form: {
    touched: { [field: string]: boolean };
    errors: { [field: string]: string };
  };
  meta: {
    error?: string;
    touched?: boolean;
  };
}

const LeadForm: React.FC<LeadFormProps> = ({ onClose, fetchData, show }) => {
  const [businessManagers, setBusinessManagers] = useState<BusinessManagerProfile[]>([]);
  const [accountManagers, setAccountManagers] = useState<AccountManagerProfile[]>([]);

  const fetchManagers = async () => {
    try {
      const { data: upworkProfiles } = await apis.getAllCompanyUpworkProfiles(ProfileSource.UPWORK);
      const { data: companyUsers } = await apis.getAllCompanyUsers();
      setBusinessManagers(upworkProfiles.profiles);
      setAccountManagers(companyUsers.users);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const handleSave = async (formData: LeadFormData) => {
    try {
      formData = {
        ...formData,
        upworkProposalUrl: cleanAndTrimWhitespace(formData.upworkProposalUrl),
        jobUrl: cleanAndTrimWhitespace(formData.jobUrl),
        jobTitle: cleanAndTrimWhitespace(formData.jobTitle),
        jobDescription: cleanAndTrimWhitespace(formData.jobDescription),
        contactName: cleanAndTrimWhitespace(formData.contactName),
        contactCountry: cleanAndTrimWhitespace(formData.contactCountry),
        contactState: cleanAndTrimWhitespace(formData.contactState),
        bidProfileFreelancer: cleanAndTrimWhitespace(formData.bidProfileFreelancer),
        bidProfileAgency: cleanAndTrimWhitespace(formData.bidProfileAgency),
        bidProfileBusinessManager: cleanAndTrimWhitespace(formData.bidProfileBusinessManager),
        proposedProfile: cleanAndTrimWhitespace(formData.proposedProfile),
        proposedRate: cleanAndTrimWhitespace(formData.proposedRate),
        receivedAmount: cleanAndTrimWhitespace(formData.receivedAmount),
        bidCoverLetter: cleanAndTrimWhitespace(formData.bidCoverLetter),
      }
      const resp = await apis.createManualLead(formData);
      customNotification.success("Success", resp?.data?.message);
      fetchData && fetchData();
      onClose();
    } catch (error: any) {
      console.error("Error creating lead:", error);
      customNotification.error(
        error?.response?.data?.message ||
          "A Bid with same URL is already exists!"
      );
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const validationSchema = Yup.object().shape({
    bidProfileId: Yup.string().required("Upwork Profile is required."),
    userId: Yup.string().required("Account Manager is required."),
    upworkProposalUrl: Yup.string().url("Invalid URL format").required("Upwork Proposal URL is required."),
    jobUrl: Yup.string().url("Invalid URL format").required("Job URL is required."),
    jobTitle: Yup.string().required("Job Title is required."),
    contactName: Yup.string().required("Contact Name is required."),
    responseDate: Yup.string().optional().when('isContract', (isContract, schema) => {
      return isContract?.includes(false) ? schema.required('Response Date is required.') : schema.optional();
    }),
    contractDate: Yup.string().optional().when('isContract', (isContract, schema) => {
      return isContract?.includes(true) ? schema.required('Contract Date is required.') : schema.optional();
    }),
  });

  return (
    <Formik
      initialValues={{
        bidProfileId: "",
        bidCoverLetter: "",
        bidProfileFreelancer: "",
        bidProfileAgency: "",
        bidProfileBusinessManager: "",
        userId: "",
        upworkProposalUrl: "",
        connects: '',
        boosted: false,
        bidResponse: true,
        isContract: false,
        contractDate: '',
        responseDate: '',
        invite: false,
        proposedProfile: "",
        proposedRate: "",
        receivedAmount: "",
        jobUrl: "",
        jobTitle: "",
        jobDescription: "",
        jobPosted: "",
        contactName: "",
        contactCountry: "",
        contactState: "",
        isManual: true,
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        const result = await Swal.fire({
          title: "Are you sure?",
          text: "Do you want to save these changes?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, save it!",
        });

        if (result.isConfirmed) {
          await handleSave(values)
        }
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, setFieldValue, values }) => (
        <Modal
          title="Create Custom Deal"
          open={show}
          onCancel={onClose}
          footer={[
            <Button key="cancel" type="text" onClick={onClose}>
              Cancel
            </Button>,
            <Button key="submit" htmlType="submit" loading={isSubmitting} form="lead-form">
              Save
            </Button>,
          ]}
          width={'95%'}
          height={'95vh'}
          centered
          style={{ top: 20, overflowY: 'auto' }}
        >
          <Form id="lead-form">
            <Row gutter={16}>
              {/* Bids Card */}
              <Col span={8}>
                <Card title="Bid Information" bordered={false}>
                  {/* Upwork Profile Dropdown */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">
                      Upwork Profile:<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Field name="bidProfileId">
                      {({ field }: FieldProps) => (
                        <Select
                          {...field}
                          placeholder="Select Upwork Profile"
                          className="w-full"
                          allowClear
                          onChange={(value) => setFieldValue("bidProfileId", value)}
                          options={businessManagers.map((manager) => ({
                            label: manager.name,
                            value: manager.id,
                          }))}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="bidProfileId" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Account Manager Dropdown */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">
                      Account Manager:<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Field name="userId">
                      {({ field }: FieldProps) => (
                        <Select
                          {...field}
                          placeholder="Select Account Manager"
                          className="w-full"
                          allowClear
                          options={accountManagers.map((manager) => ({
                            label: manager.name,
                            value: manager.id,
                          }))}
                          onChange={(value) => setFieldValue("userId", value)}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="userId" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Upwork Proposal URL */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Upwork Proposal URL:<span className="text-red-500 ml-1">*</span></label>
                    <Field name="upworkProposalUrl">
                      {({ field }: FieldProps) => <Input {...field} placeholder="https://example.com/proposal" />}
                    </Field>
                    <ErrorMessage name="upworkProposalUrl" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Contract Date OR Response Date */}
                  {values.isContract ? (
                    <div className="mb-4 pb-2">
                      <label className="block text-m font-medium">Contract Date:<span className="text-red-500 ml-1">*</span></label>
                      <Field type="datetime-local" name="contractDate" className="border p-2 rounded w-full" placeholder='Enter the Contract Date' />
                      <ErrorMessage name="contractDate" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  ) : (
                    <div className="mb-4 pb-2">
                      <label className="block text-m font-medium">Response Date:<span className="text-red-500 ml-1">*</span></label>
                      <Field type="datetime-local" name="responseDate" className="border p-2 rounded w-full" placeholder='Enter the Response Date' />
                      <ErrorMessage name="responseDate" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Bid Cover Letter</label>
                    <Field as="textarea" name="bidCoverLetter" className="border p-2 rounded w-full" rows={4} placeholder="Add Cover Letter" />
                    <ErrorMessage name="bidCoverLetter" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Freelancer's Name */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Freelancer's Name</label>
                    <Field type="text" name="bidProfileFreelancer" className="border p-2 rounded w-full" placeholder="Provide freelancer's name" />
                    <ErrorMessage name="bidProfileFreelancer" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Agency's Name */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Agency's Name</label>
                    <Field type="text" name="bidProfileAgency" className="border p-2 rounded w-full" placeholder="Provide agency name" />
                    <ErrorMessage name="bidProfileAgency" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Proposed Proile */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Proposed Profile:</label>
                    <Field type="text" name="proposedProfile" className="border p-2 rounded w-full" placeholder="Provide the proposed Upwork profile (e.g., general profile)" />
                    <ErrorMessage name="proposedProfile" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Proposed Rate */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Proposed Rate:</label>
                    <Field name="proposedRate" className="border p-2 rounded w-full" placeholder='Enter the proposed rate. i.e $40.00/hr' />
                    <ErrorMessage name="proposedRate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Received Amount */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Received Amount:</label>
                    <Field name="receivedAmount" className="border p-2 rounded w-full" placeholder='Enter the received amount. i.e $36.00/hr' />
                    <ErrorMessage name="receivedAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Connects */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Connects:</label>
                    <Field type="number" min={0} name="connects" className="border p-2 rounded w-full" placeholder='Enter the connects consumed. i.e 12' />
                    <ErrorMessage name="connects" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                </Card>
              </Col>

              {/* Jobs Card */}
              <Col span={8}>
                <Card title="Job Information" bordered={false}>
                  {/* Job Title */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Job Title:<span className="text-red-500 ml-1">*</span></label>
                    <Field name="jobTitle">
                      {({ field }: FieldProps) => <Input {...field} placeholder="Enter Job Title" />}
                    </Field>
                    <ErrorMessage name="jobTitle" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Job URL */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Job URL:<span className="text-red-500 ml-1">*</span></label>
                    <Field name="jobUrl">
                      {({ field }: FieldProps) => <Input {...field} placeholder="https://example.com/job" />}
                    </Field>
                    <ErrorMessage name="jobUrl" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Job Posted */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Job Posted:</label>
                    <Field name="jobPosted">
                      {({ field }: FieldProps) => <Input type="date" {...field} placeholder="Enter Job Posted" />}
                    </Field>
                    <ErrorMessage name="jobPosted" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Job Description */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Job Description</label>
                    <Field as="textarea" name="jobDescription" className="border p-2 rounded w-full" rows={4} placeholder="Add Job Description" />
                    <ErrorMessage name="jobDescription" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </Card>
              </Col>

              {/* Contact Card */}
              <Col span={8}>
                <Card title="Contact Information" bordered={false}>
                  {/* Contact Name */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Contact Name:<span className="text-red-500 ml-1">*</span></label>
                    <Field name="contactName">
                      {({ field }: FieldProps) => <Input {...field} placeholder="Enter Contact Name" />}
                    </Field>
                    <ErrorMessage name="contactName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Country */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">Country</label>
                    <Field name="contactCountry">
                      {({ field }: FieldProps) => <Input {...field} placeholder="Enter Country" />}
                    </Field>
                    <ErrorMessage name="contactCountry" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* State */}
                  <div className="mb-4 pb-2">
                    <label className="block text-m font-medium">State</label>
                    <Field name="contactState">
                      {({ field }: FieldProps) => <Input {...field} placeholder="Enter State" />}
                    </Field>
                    <ErrorMessage name="contactState" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </Card>
              </Col>
            </Row>
            <Row gutter={16} className="mt-4">
              <Card title='Options' bordered={false}>
                <div className="d-flex gap-5">
                  <div className="mb-4">
                    <Field name="isManual" type="checkbox">
                      {({ field }: any) => <Tooltip title='Marks this as a direct entry.'> <Checkbox disabled {...field} >Direct</Checkbox></Tooltip>}
                    </Field>
                  </div>
                  <div className="mb-4">
                    <Field name="bidResponse" type="checkbox">
                      {({ field }: any) => <Tooltip title='Marks this response as a lead.'> <Checkbox disabled {...field}>Lead</Checkbox></Tooltip>}
                    </Field>
                  </div>
                  <div className="mb-4">
                    <Field name="boosted" type="checkbox">
                      {({ field }: any) => <Tooltip title='Marks this as a boosted lead.'> <Checkbox {...field} >Boosted</Checkbox></Tooltip>}
                    </Field>
                  </div>
                  <div className="mb-4">
                    <Field name="isContract" type="checkbox">
                      {({ field }: any) => <Tooltip title='Marks this entry as a contract.'> <Checkbox {...field}>Contract</Checkbox></Tooltip>}
                    </Field>
                  </div>
                </div>
              </Card>
            </Row>
          </Form>
        </Modal>
      )}
    </Formik>
  );
};

export default LeadForm;
