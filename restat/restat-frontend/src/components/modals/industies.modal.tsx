import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, notification } from 'antd';
import { IndustriesModalProps } from '../../services/types/industries';
import { apis } from '../../services';
import cleanAndTrimWhitespace from '../../services/utils/trimSpaces';

const IndustriesModal: React.FC<IndustriesModalProps> = ({ showModal, closeModal, data, fetchData }) => {
  const [form] = Form.useForm();

  const isEditing: boolean = !!data

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        description: data.description || '',
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);


  const handleSubmit = async (values: { name: string; description: string }) => {
    try {

      values = {
        name: cleanAndTrimWhitespace(values.name),
        description: cleanAndTrimWhitespace(values.description),
      }

      if (isEditing && data) {
        await apis.updateIndustry({ id: data.id, values })
      } else {
        await apis.createIndustry(values)
      }
      notification.success({
        message: 'Success',
        description: isEditing ? 'Industry updated successfully!' : 'Industry created successfully!',
      });
      fetchData();
      closeModal();
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error?.response?.data?.message || 'There was an error processing your request.',
      });
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit Industry' : 'Add Linkedin Industry'}
      visible={showModal}
      onCancel={closeModal}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter the name!' }]}
        >
          <Input placeholder="Enter the industry name" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
        >

          <Input.TextArea rows={4} placeholder="Enter the industry description" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" style={{ background: '#1A4895' }} htmlType="submit">
            {isEditing ? 'Update Industry' : 'Create Industry'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IndustriesModal;
