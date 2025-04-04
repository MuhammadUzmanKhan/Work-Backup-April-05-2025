import { useEffect, useRef, useState } from 'react';
import { CustomFieldsAvailableContacts, apis } from '../../../../services';
import { customNotification } from '../../../../components';
import { ClickupCustomField, Member, SelectedFields } from '../../../../services/types/common';
import { Select, Spin } from 'antd';
import './CustomFieldsModal.scss';

interface CustomFieldsContactsProps {
  on: () => void;
  off: () => void;
  loading: boolean;
  listId: string;
  onContinue?: ({ selectedFields, members }: { selectedFields: SelectedFields[], members: Member[] }) => void;
}

const staticFieldsContacts: ClickupCustomField[] = [
  {
    id: 'name',
    name: 'Title',
    type: 'text',
    required: true,
    isStaticField: true,
  },
  {
    id: 'description',
    name: 'Description',
    type: 'text',
    required: false,
    isStaticField: true,
  },
];

const CustomFieldsContacts: React.FC<CustomFieldsContactsProps> = ({ on, off, listId, onContinue, loading }) => {
  const [load, setLoad] = useState<boolean>(false);
  const [customFields, setCustomFields] = useState<ClickupCustomField[]>(staticFieldsContacts);
  const [upworkProfileFieldSelected, setUpworkProfileFieldSelected] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedFields[]>(
    customFields.map(field => ({
      key: field.id,
      type: field.type,
      name: field.name,
      required: field.required,
      isStaticField: field.isStaticField,
      isBlank: field.required && field.id ? false : true,
      value: field.required ? CustomFieldsAvailableContacts[0].id : '',
      customFieldName: field.required ? (field.isStaticField ? field.name : CustomFieldsAvailableContacts[0].name) : '',
    }))
  );

  const integratedCustomFields = useRef<SelectedFields[]>([]);

  const firstIndexUpworkProfile = customFields.findIndex(field => field.type === 'upwork_profile');
  const lastIndexUpworkProfile = customFields.length - 1 - customFields.slice().reverse().findIndex(field => field.type === 'upwork_profile');


  const handleFieldSelect = (
    id: string | undefined,
    value: string,
    isStaticField: boolean | undefined,
    name: string | undefined,
    type: string,
  ) => {
    setSelectedFields((prevs: SelectedFields[]) =>
      prevs.map(prev => prev.key === id ? {
        ...prev,
        value,
        isStaticField,
        name,
        type: value === '' ? '' : type,
        isBlank: value === '',
      } : prev)
    );
  }

  const getFields = async () => {
    try {
      on();
      setLoad(true);
      const resp = await apis.getClickupFields(listId);
      const custom_fields = resp.data.custom_fields;
      const members = resp.data.members;
      integratedCustomFields.current = resp.data?.integratedCustomFields;
      setMembers(members);
      setCustomFields([...staticFieldsContacts, ...custom_fields]);
      setLoad(false);
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An Error Occurred in getting fields from Clickup.');
      console.error(error);
      setLoad(false);
    }
  };

  useEffect(() => {
    listId && getFields();
  }, [listId]);

  useEffect(() => {
    if (integratedCustomFields.current?.length) {
      setSelectedFields(integratedCustomFields.current);
    } else {
      setSelectedFields(
        customFields.map(field => ({
          key: field.id,
          type: field.type,
          required: field.required,
          customFieldName: field.name,
          isStaticField: field.isStaticField,
          isBlank: field.required && field.id ? false : true,
          value: field.required ? CustomFieldsAvailableContacts[0].id : '',
          name: field.required ? CustomFieldsAvailableContacts[0]?.name : '',
        }))
      );
    }
    off();
  }, [customFields, integratedCustomFields.current]);

  useEffect(() => {
    if (selectedFields.find(field => field.type === 'users' && field.value === 'profile')) {
      setUpworkProfileFieldSelected(true);
    } else {
      setUpworkProfileFieldSelected(false);
    }
    onContinue && onContinue({ selectedFields, members });
  }, [selectedFields]);

  return (
    <div className="h-[90%] overflow-y-auto w-[60%] p-4">
      <div className='clickup-custom-container'>
        <Spin spinning={load}>
          <div className="flex justify-between mb-3">
            <div className="field-title text-center red">ClickUp Fields</div>
            <div className="field-title text-center red">Restat Fields</div>
          </div>
          {customFields.map((field, index) => (
            <>
              {(index === firstIndexUpworkProfile && upworkProfileFieldSelected) && (
                <div className={`upwork_profile_area ${index === firstIndexUpworkProfile && 'firstIndexUpworkProfile'}`}>
                  <h3>Select Clickup profiles against Upwork Accounts</h3>
                  <span><b>Note: </b>This will be used to add upwork profile on ClickUp task</span>
                </div>
              )}
              {(field.type === 'upwork_profile' && upworkProfileFieldSelected) && (
                <div className={`upwork_profile_area ${(index === lastIndexUpworkProfile && upworkProfileFieldSelected) && 'lastIndexUpworkProfile'}`}>
                  <div key={index} className='flex justify-between p-2'>
                    <div className="field-title mr-10">
                      {field.name} <b className='red'>{field.required ? '*' : ''}</b>
                    </div>
                    <Select
                      loading={loading}
                      showSearch
                      placeholder={`Select ${field.name}`}
                      optionFilterProp="label"
                      onChange={value => handleFieldSelect(
                        field.id,
                        value,
                        field.isStaticField,
                        CustomFieldsAvailableContacts.find(x => x.id === value)?.name,
                        field.type
                      )}
                      options={
                        members.map(member => ({ label: `${member.username} | ${member.email}`, value: '' + member.id }))
                      }
                      defaultValue={selectedFields.find(sf => field.id === sf.key)?.name || (field.required ? CustomFieldsAvailableContacts[0].id : undefined)}
                      allowClear={!field.required}
                      size="middle"
                      style={{ marginBottom: "10px", minWidth: '280px', maxWidth: '450px' }}
                    />
                  </div>
                </div>
              )}
              {(field.type !== 'upwork_profile') && (
                <div key={index} className={`flex justify-between p-2`}>
                  <div className="field-title mr-10">
                    {field.name} <b className='red'>{field.required ? '*' : ''}</b>
                  </div>
                  <Select
                    loading={loading}
                    showSearch
                    placeholder={`Select ${field.name}`}
                    optionFilterProp="label"
                    onChange={value => handleFieldSelect(
                      field.id,
                      value,
                      field.isStaticField,
                      CustomFieldsAvailableContacts.find(x => x.id === value)?.name,
                      field.type
                    )}
                    options={CustomFieldsAvailableContacts
                      .filter(cf => cf.type.includes(field.type))
                      .map(cf => ({ label: cf.name, value: cf.id }))
                    }
                    defaultValue={selectedFields.find(sf => field.id === sf.key)?.name || (field.required ? CustomFieldsAvailableContacts[0].id : undefined)}
                    allowClear={!field.required}
                    size="middle"
                    style={{ marginBottom: "10px", minWidth: '280px', maxWidth: '450px' }}
                  />
                </div>
              )}
            </>
          ))}
        </Spin >
      </div>
    </div>
  );
};

export default CustomFieldsContacts;
