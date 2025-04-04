import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import { apis } from '../../../services';
import { RootState } from '../../../services/redux/store';
import { useSelector } from 'react-redux';
import './workspace.scss';
import { IWorkspaceData } from '../../../services/types/common';

const { Option } = Select;



const countries = [
  { code: 'us', name: 'United States' },
  { code: 'pk', name: 'Pakistan' },
];

const Workspace: React.FC = () => {
  const [form] = Form.useForm();
  const [workspaceData, setWorkspaceData] = useState<IWorkspaceData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user: { user } } = useSelector((state: RootState) => state);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const response = await apis.getCompany(user.companyId);
        setWorkspaceData(response.data);
        form.setFieldsValue(response.data);
      } catch (error: any) {
        message.error(error?.response?.data?.message || 'Failed to fetch workspace data');
      }
    };

    fetchWorkspaceData();
  }, [form, user.companyId]);

  const onFinish = async (values: IWorkspaceData) => {
    try {
      const { websiteUrl, ...rest } = values;

      const payload = {
        ...rest,
        ...(websiteUrl?.trim() ? { websiteUrl } : {}),
        logoUrl: file ? URL.createObjectURL(file) : rest.logoUrl,
      };
      const companyId = user.companyId;
      await apis.updateWorkspace({ id: companyId, values: payload });
      message.success('Workspace updated successfully');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to update workspace');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileUrl = URL.createObjectURL(selectedFile);
    form.setFieldsValue({ logoUrl: fileUrl });
    message.success('File ready for upload!');
  };

  if (!workspaceData) return null;

  return (
    <div className="Workspace">
      <h2>Workspace Settings</h2>
      <Form form={form} onFinish={onFinish} layout="horizontal" className="workspace-form">
        <Form.Item label="Company Name:" name="name">
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="Website URL:"
          name="websiteUrl"
          rules={[{ type: 'url', required: false, message: 'Please enter a valid URL' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Company Size:"
          name="companySize"
          rules={[{ message: 'Please select the company size' }]}
        >
          <Select placeholder="Select company size">
            <Option value="Just me">Just Me</Option>
            <Option value="Small">Small</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Enterprise">Enterprise</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Location" name="location" rules={[{ message: 'Please select your country' }]}>
          <Select placeholder="Select your country">
            {countries.map((country) => (
              <Option key={country.code} value={country.code}>
                {country.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Logo Upload" rules={[{ message: 'logo is mandortory' }]}>
          <div className="infield upload">
            <input
              className="custom-input"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileUpload}
            />
            {form.getFieldValue('logoUrl') && (
              <span className="success">File Uploaded!</span>
            )}
            <span className='innerText absolute'>
              {form.getFieldValue('logoUrl') ?
                <img src={form.getFieldValue('logoUrl')} style={{ width: '50px', height: '30px' }} /> :
                <>Drop your files here OR&nbsp;<span> Browse</span></>}
            </span>
          </div>
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" className="submit-button">
            Update Workspace!
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Workspace;