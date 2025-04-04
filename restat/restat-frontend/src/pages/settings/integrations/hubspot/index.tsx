import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { images } from "../../../../assets";
import { apis, routes, useLoader } from "../../../../services";

import './index.scss';
import { IPipeline } from "../../../../services/types/integrations";
import Pipeline from "./pipelines";
import Stages from "./stages";
import DealPropertiesModal from "./deal-properties";
import { HUBSPOT_CATEGORYS, INTEGRATION_TYPE, SelectedProperties } from "../../../../services/types/common";
import { Button, Steps } from "antd";
import { customNotification } from "../../../../components";


interface IHubspotData {
  pipelineName: string,
  pipelineId: string,
  stageName: string,
  stageId: string,
}

const Hubspot = ({ pipelines }: { pipelines: IPipeline[] }) => {
  const [selectedHubspotFields, setSelectedHubspotFields] = useState<SelectedProperties[]>([])
  const [selectedLinkedinFields, setSelectedLinkedinFields] = useState<SelectedProperties[]>([])
  const [step, setStep] = useState(0)
  const navigate = useNavigate();

  const { loading, on, off } = useLoader(true)

  const [selectedPipelineIndex, setSelectedPipelineIndex] = useState<number>(pipelines?.length ? 0 : -1)
  const [selectedData, setSelectedData] = useState<IHubspotData>({
    pipelineName: '',
    pipelineId: '',
    stageName: '',
    stageId: '',
  });

  const handleBackClick = () => {
    navigate(routes.settings);
  };

  const onPipelineChangeHandle = async ({ id, label, index }: { id: string, label: string, index: number }) => {
    setSelectedData(prev => ({
      ...prev,
      pipelineId: id,
      pipelineName: label,
    }))
    if (pipelines[index].stages?.length) {
      setSelectedData(prev => ({ ...prev, stageId: pipelines[index].stages[0]?.id, stageName: pipelines[index].stages[0]?.label }))
    } else {
      setSelectedData(prev => ({ ...prev, stageId: '', stageName: '' }))
    }
    setSelectedPipelineIndex(index)
  };

  const onStageChangeHandle = async ({ id, label }: { id: string, label: string }) => {
    setSelectedData(prev => ({
      ...prev,
      stageId: id,
      stageName: label,
    }))
  };

  const handleSaveConfiguration = async () => {
    try {
      on()
      const response = await apis.saveHubspotConfigurations({ ...selectedData, customFields: [...selectedHubspotFields, ...selectedLinkedinFields] })
      if (response.status === 201) {
        customNotification.success('Configurations saved for Hubspot')
        navigate(routes.settings)
      }
    } catch (error: any) {
      console.error('An Error Occurred.', error)
      customNotification.error(error?.response?.data?.message || 'An Error Occurred In Hubspot. Please try again later!')
    } finally { off() }
  }

  useEffect(() => {
    if (pipelines.length) {
      setSelectedData({ pipelineId: pipelines[0].id, pipelineName: pipelines[0].label, stageId: pipelines[0].stages[0].id, stageName: pipelines[0].stages[0].label })
      setSelectedPipelineIndex(0)
    }
    pipelines.length && off()
  }, [pipelines]);

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      <div className="hubspot-container">
        <button className="back-button" onClick={handleBackClick}>
          &lt; &nbsp; back to settings!
        </button>
        <Steps
          direction="horizontal"
          current={step}
          items={[
            {
              title: 'Select Pipeline & Stage',
            },
            {
              title: 'Map Upwork Fields',
            },
            {
              title: 'Map LinkedIn Fields',
            },
            {
              title: 'Finish',
            },
          ]}
        />

        {step === 0 &&
          <>
            <img width={150} height={150} src={images.hubspot} className="top-img" alt="Hubspot" />
            <Pipeline
              isDisabled={pipelines?.length === 1}
              pipelines={pipelines}
              onChangeHandler={onPipelineChangeHandle}
            />

            <Stages
              isDisabled={pipelines.length ? !pipelines[selectedPipelineIndex]?.stages?.length : true}
              stages={pipelines.length ? pipelines[selectedPipelineIndex]?.stages : []}
              onChangeHandler={onStageChangeHandle}
            />

          </>
        }

        {
          step === 1 &&
          <div className="hubspot-step-1">
            <div className="logos">
              <img width={50} height={50} src={images.hubspot} className="top-img" alt="Hubspot" />
              <h4>{'>'}</h4>
              <img width={50} height={50} src={images.upwork} className="top-img" alt="Upwork" />
            </div>
            <DealPropertiesModal
              on={on}
              off={off}
              type={INTEGRATION_TYPE.UPWORK}
              loading={loading}
              selectedFields={selectedHubspotFields}
              setSelectedFields={setSelectedHubspotFields}
            />
          </div>
        }
        {
          step === 2 && <>
            <div className="hubspot-step-1">
              <div className="logos">
                <img width={50} height={50} src={images.hubspot} className="top-img" alt="Hubspot" />
                <h4>{'>'}</h4>
                <img width={50} height={50} src={images.linkedin} className="top-img" alt="Linkedin" />
              </div>
              <DealPropertiesModal
                on={on}
                off={off}
                type={INTEGRATION_TYPE.LINKEDIN}
                loading={loading}
                selectedFields={selectedLinkedinFields}
                setSelectedFields={setSelectedLinkedinFields}
              />
            </div>
          </>
        }
        {
          step === 3 && <>
            <div className="step-3-div">
              <div className="integration-container-hubspot">
                <div className="integration-section">
                  <img src={images.upwork} className="integration-img" alt="Upwork" />
                  <ul className="integration-list">
                    {selectedHubspotFields
                      .filter(field => field.integration === INTEGRATION_TYPE.UPWORK)
                      .map(field => (
                        <li key={field.name}>
                          {field.hubspotCategory === HUBSPOT_CATEGORYS.DEALS && field.name === 'dealname' && (
                            <b style={{ color: field.value ? '' : 'red' }}>{field.value ? '✓' : '✗'} Deals</b>
                          )}
                          {field.hubspotCategory === HUBSPOT_CATEGORYS.CONTACTS && field.name === 'firstname' && (
                            <b style={{ color: field.value ? '' : 'red' }}>{field.value ? '✓' : '✗'} Contacts</b>
                          )}
                          {field.hubspotCategory === HUBSPOT_CATEGORYS.COMPANIES && field.name === 'name' && (
                            <b style={{ color: field.value ? '' : 'red' }}>{field.value ? '✓' : '✗'} Companies</b>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="integration-section">
                  <img src={images.linkedin} className="integration-img" alt="LinkedIn" />
                  <ul className="integration-list">
                    {selectedLinkedinFields
                      .filter(field => field.integration === INTEGRATION_TYPE.LINKEDIN)
                      .map(field => (
                        <li key={field.name}>
                          {field.hubspotCategory === HUBSPOT_CATEGORYS.CONTACTS && field.name === 'firstname' && (
                            <b style={{ color: field.value ? '' : 'red' }}>{field.value ? '✓' : '✗'} Contacts</b>
                          )}
                          {field.hubspotCategory === HUBSPOT_CATEGORYS.COMPANIES && field.name === 'name' && (
                            <b style={{ color: field.value ? '' : 'red' }}>{field.value ? '✓' : '✗'} Companies</b>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <button className="save-button" onClick={handleSaveConfiguration} disabled={!pipelines.length} >
                Save the configuration
              </button>
            </div>
          </>
        }

        <div style={{ position: 'absolute', bottom: '4rem' }}>
          {step > 0 && (
            <Button type="default" size="large" style={{ margin: '0 8px' }} onClick={() => setStep(prev => prev - 1)}>
              Previous
            </Button>
          )}
          {step < 3 && (
            <Button className="hub-next-item" size="large" onClick={() => setStep(prev => prev + 1)}>
              Next
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Hubspot;

