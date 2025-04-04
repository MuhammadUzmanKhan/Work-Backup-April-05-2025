import { useEffect, useRef, useState } from 'react';
import { CustomFieldsAvailable, CustomFieldsAvailableLinkedIn, apis } from '../../../../services';
import './deal-properties.scss';
import { HubspotProperties } from '../../../../services/types/integrations';
import { Select } from 'antd';
import { HUBSPOT_CATEGORYS, INTEGRATION_TYPE, SelectedProperties } from '../../../../services/types/common';
import { customNotification } from '../../../../components';

interface CustomFieldsModalProps {
  on: () => void;
  off: () => void;
  type: INTEGRATION_TYPE
  loading: boolean;
  selectedFields: SelectedProperties[];
  setSelectedFields: (selectedFields: (prevFields: SelectedProperties[]) => SelectedProperties[] | SelectedProperties[]) => void;
}

const getSelectedFieldsOnly = (properties: HubspotProperties[], hubspotCategory: HUBSPOT_CATEGORYS, type: INTEGRATION_TYPE): SelectedProperties[] =>
  properties.map(
    property => ({
      type: property.type,
      name: property.name,
      label: property.label,
      hubspotDefined: property.hubspotDefined || false, key: `${hubspotCategory}_${property.name}`,

      hubspotCategory,
      value: undefined,
      valueName: undefined,
      isStaticValue: false,
      integration: type
    })
  )

const DealPropertiesModal: React.FC<CustomFieldsModalProps> = ({ on, off, type, loading, selectedFields, setSelectedFields }) => {
  const [properties, setProperties] = useState<{ deals: HubspotProperties[], contacts: HubspotProperties[], companies: HubspotProperties[] }>({ deals: [], contacts: [], companies: [] })

  const integratedSelectedPropertiesRef = useRef<HubspotProperties[]>([])

  const handleFieldSelect = (
    {
      value, valueName, isStaticValue, property, hubspotCategory
    }: {
      value: string, valueName: string, isStaticValue: boolean, property: HubspotProperties, hubspotCategory: HUBSPOT_CATEGORYS
    }) => {
    setSelectedFields(prevs =>
      prevs.map(prev => prev.key === `${hubspotCategory}_${property.name}` ? { ...prev, value, valueName, isStaticValue } : prev)
    );
  };

  const getDealProperties = async () => {
    try {
      on()
      const resp = await apis.getHubspotProperties();
      setProperties(resp.data?.properties)
      if (resp.data?.integratedProperties?.length) {
        integratedSelectedPropertiesRef.current = resp.data?.integratedProperties?.filter((prop: SelectedProperties) => prop?.integration === type)
        setSelectedFields(resp.data?.integratedProperties?.filter((prop: SelectedProperties) => prop?.integration === type))
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An Error Occurred in getting properties from Hubspot.');
      console.error(error);
    } finally { off() }
  };

  useEffect(() => {
    getDealProperties();
  }, []);

  useEffect(() => {
    if (!integratedSelectedPropertiesRef.current.length) {
      setSelectedFields(prev => [
        ...getSelectedFieldsOnly(properties.deals, HUBSPOT_CATEGORYS.DEALS, type),
        ...getSelectedFieldsOnly(properties.contacts, HUBSPOT_CATEGORYS.CONTACTS, type),
        ...getSelectedFieldsOnly(properties.companies, HUBSPOT_CATEGORYS.COMPANIES, type),
      ])
    }
  }, [properties, integratedSelectedPropertiesRef.current])

  return (
    <div className="modal-content">
      <div className="modal-body">
        {!loading ? <>
          {type !== INTEGRATION_TYPE.LINKEDIN &&
            <>
              <h2 className='property-title' >Deal Properties</h2>
              {properties.deals.map((property, index) => (
                <div key={index} className='field-row' >
                  <div className='field'>
                    <div className="field-title">{property.label}</div>
                    <i>{property.description}</i>
                  </div>
                  <Select
                    loading={loading}
                    showSearch
                    allowClear
                    placeholder={`Select ${property.label}`}
                    optionFilterProp="label"
                    onChange={(_, data: any) => handleFieldSelect({ value: data?.value, valueName: data?.label, isStaticValue: !!property.options?.find(op => op?.value === data?.value), property, hubspotCategory: HUBSPOT_CATEGORYS.DEALS })}
                    options={
                      property.type === 'enumeration' ?
                        [{
                          label: <span>Hubspot Enumeration</span>,
                          // @ts-ignore
                          options: property.options.map(op => ({ label: op?.label, value: op?.value })),
                        }]
                        : type === INTEGRATION_TYPE.UPWORK ?
                          CustomFieldsAvailable
                            .filter(cf => cf.type.includes(property.type))
                            .map(cf => ({ label: cf.name, value: cf.id }))
                          : type === INTEGRATION_TYPE.LINKEDIN ?
                            CustomFieldsAvailableLinkedIn
                              .filter(cf => cf.type.includes(property.type))
                              .map(cf => ({ label: cf.name, value: cf.id }))
                            : []
                    }
                    defaultValue={selectedFields.find(sf => sf.key === `${HUBSPOT_CATEGORYS.DEALS}_${property.name}` && sf.valueName) ? selectedFields.find(sf => sf.key === `${HUBSPOT_CATEGORYS.DEALS}_${property.name}`)?.valueName : undefined}
                    style={{ minWidth: '250px' }}
                  />

                </div>
              ))}
            </>}

          <h2 className='property-title'>Contact Properties</h2>
          {properties.contacts.map((property, index) => (
            <div key={index} className='field-row' >
              <div className='field'>
                <div className="field-title">{property.label}</div>
                <i>{property.description}</i>
              </div>
              <Select
                loading={loading}
                showSearch
                allowClear
                placeholder={`Select ${property.label}`}
                optionFilterProp="label"
                onChange={(_, data: any) => handleFieldSelect({ value: data?.value, valueName: data?.label, isStaticValue: !!property.options?.find(op => op?.value === data?.value), property, hubspotCategory: HUBSPOT_CATEGORYS.CONTACTS })}
                options={
                  property.type === 'enumeration' ?
                    [{
                      label: <span>Hubspot Enumeration</span>,
                      // @ts-ignores
                      options: property.options.map(op => ({ label: op?.label, value: op?.value })),
                    }]
                    : type === INTEGRATION_TYPE.UPWORK ?
                      CustomFieldsAvailable
                        .filter(cf => cf.type.includes(property.type))
                        .map(cf => ({ label: cf.name, value: cf.id }))
                      : type === INTEGRATION_TYPE.LINKEDIN ?
                        CustomFieldsAvailableLinkedIn
                          .filter(cf => cf.type.includes(property.type))
                          .map(cf => ({ label: cf.name, value: cf.id }))
                        : []
                }
                defaultValue={selectedFields.find(sf => sf.key === `${HUBSPOT_CATEGORYS.CONTACTS}_${property.name}` && sf.valueName) ? selectedFields.find(sf => sf.key === `${HUBSPOT_CATEGORYS.CONTACTS}_${property.name}`)?.valueName : undefined}
                style={{ minWidth: '250px' }}
              />

            </div>
          ))}

          {type !== INTEGRATION_TYPE.LINKEDIN &&
            <>
              <h2 className='property-title' >Company Properties</h2>
              {properties.companies.map((property, index) => (
                <div key={index} className='field-row' >
                  <div className='field'>
                    <div className="field-title">{property.label}</div>
                    <i>{property.description}</i>
                  </div>
                  <Select
                    loading={loading}
                    showSearch
                    allowClear
                    placeholder={`Select ${property.label}`}
                    optionFilterProp="label"
                    onChange={(_, data: any) => handleFieldSelect({ value: data?.value, valueName: data?.label, isStaticValue: !!property.options?.find(op => op?.value === data?.value), property, hubspotCategory: HUBSPOT_CATEGORYS.COMPANIES })}
                    options={
                      property.type === 'enumeration' ?
                        [{
                          label: <span>Hubspot Enumeration</span>,
                          // @ts-ignores
                          options: property.options.map(op => ({ label: op?.label, value: op?.value })),
                        }]
                        : type === INTEGRATION_TYPE.UPWORK ?
                          CustomFieldsAvailable
                            .filter(cf => cf.type.includes(property.type))
                            .map(cf => ({ label: cf.name, value: cf.id }))
                          : type === INTEGRATION_TYPE.LINKEDIN ?
                            CustomFieldsAvailableLinkedIn
                              .filter(cf => cf.type.includes(property.type))
                              .map(cf => ({ label: cf.name, value: cf.id }))
                            : []
                    }
                    defaultValue={selectedFields.find(sf => sf.key === `${HUBSPOT_CATEGORYS.COMPANIES}_${property.name}` && sf.valueName) ? selectedFields.find(sf => sf.key === `${HUBSPOT_CATEGORYS.COMPANIES}_${property.name}`)?.valueName : undefined}
                    style={{ minWidth: '250px' }}
                  />

                </div>
              ))}
            </>}

        </> : null}

      </div>
    </div>

  );
};

export default DealPropertiesModal;
