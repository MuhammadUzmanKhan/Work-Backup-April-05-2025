import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { ROLE, SendInviteFormProps } from "../../services/types/common";
import { Form, Input, InputNumber, Checkbox, Typography, Button } from 'antd';
import { Trash } from "../../assets/images/svg-react-component";

const { Title } = Typography;

const FormContent = ({ touched, member, handleChange, index, setFieldValue, errors, handleBlur, remove }: SendInviteFormProps) => {
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <div className="modal-in-card border border-[#b3cee19e] p-4 rounded-lg">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="text" icon={<Trash fillColor={'red'} />} title="Delete Entry" onClick={() => remove(index)} />
      </div>
      <Form.Item
        validateStatus={errors.members?.[index]?.name && touched.members?.[index]?.name ? 'error' : ''}
        help={errors.members?.[index]?.name && touched.members?.[index]?.name ? errors.members[index].name : ''}
        style={{ width: '90%' }}
        label='Name'
        rules={[{ required: true, message: 'Please enter a name' }]}
      >
        <Input
          type="text"
          id="name"
          placeholder="John Doe"
          name={`members.${index}.name`}
          value={member.name}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Item>

      <Form.Item
        validateStatus={errors.members?.[index]?.email && touched.members?.[index]?.email ? 'error' : ''}
        help={<div style={{ display: "inline-flex", maxWidth: "512px" }}>{errors.members?.[index]?.email && touched.members?.[index]?.email ? errors.members[index].email : ''}</div>}
        style={{ width: '90%' }}
        label='Email'
        rules={[
          { required: true, message: 'Please enter an email' },
          { type: 'email', message: 'Please enter a valid email' }
        ]}
        labelAlign="left"

      >
        <Input
          type="email"
          id="email"
          placeholder="John@mail.com"
          name={`members.${index}.email`}
          value={member.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Item>

      <Title level={4} className="mt-5">Assign a role</Title>
      <div className="mt-2">
        {(user.role === ROLE.COMPANY_ADMIN || user.role === ROLE.OWNER) && (
          <Form.Item style={{ margin: '0px' }}>
            <Checkbox
              name={`members.${index}.role`}
              checked={member.role === ROLE.COMPANY_ADMIN || member.role === ROLE.OWNER}
              onChange={() => setFieldValue(`members.${index}.role`, ROLE.COMPANY_ADMIN || ROLE.OWNER)}
            >
              Admin
            </Checkbox>
          </Form.Item>
        )}

        <Form.Item style={{ margin: '0px' }}>
          <Checkbox
            name={`members.${index}.role`}
            checked={member.role === ROLE.BIDDER}
            onChange={() => setFieldValue(`members.${index}.role`, ROLE.BIDDER)}
          >
            Business Developer
          </Checkbox>
        </Form.Item>
      </div>

      {errors.members?.[index]?.role && touched.members?.[index]?.role && (
        <div style={{ color: 'red' }}>
          {errors.members[index].role}
        </div>
      )}

      <Form.Item
        className="mt-2"
        validateStatus={errors.members?.[index]?.upworkTarget && touched.members?.[index]?.upworkTarget ? 'error' : ''}
        help={errors.members?.[index]?.upworkTarget && touched.members?.[index]?.upworkTarget ? errors.members[index].upworkTarget : ''}
        label='Monthly Upwork Target'
        rules={[{ required: true, message: 'Please enter Upwork Target' }]}
      >
        <InputNumber
          id="upworkTarget"
          name={`members.${index}.upworkTarget`}
          value={member.upworkTarget}
          onChange={(value) => setFieldValue(`members.${index}.upworkTarget`, value)}
          onBlur={handleBlur}
          min={0}
          defaultValue={0}
        />
      </Form.Item>

      <Form.Item
        validateStatus={errors.members?.[index]?.linkedinTarget && touched.members?.[index]?.linkedinTarget ? 'error' : ''}
        help={errors.members?.[index]?.linkedinTarget && touched.members?.[index]?.linkedinTarget ? errors.members[index].linkedinTarget : ''}
        label='Monthly LinkedIn Target'
        rules={[{ required: true, message: 'Please enter LinkedIn Target' }]}
      >
        <InputNumber
          id="linkedinTarget"
          name={`members.${index}.linkedinTarget`}
          value={member.linkedinTarget}
          onChange={(value) => setFieldValue(`members.${index}.linkedinTarget`, value)}
          onBlur={handleBlur}
          min={0}
          defaultValue={0}
        />
      </Form.Item>
    </div>
  );
};

export default FormContent;
