import React, { useEffect, useState } from 'react';
import { Form, Switch, Button, Typography } from 'antd';
import './features.scss';
import { apis, useLoader } from '../../services';
import { GlobalConfigurationPayload } from '../../services/types/common';
import { customNotification } from '../../components';

const { Title } = Typography;

const Features: React.FC = () => {
    const [globalConfiguration, setGlobalConfiguration] = useState<GlobalConfigurationPayload | null>();
    const { on, off, loading } = useLoader();

    const getGlobalConfiguration = async () => {
        const { data } = await apis.getGlobalConfiguration();
        setGlobalConfiguration(data);
    }

    useEffect(() => {
        getGlobalConfiguration();
    }, [])

    const handleSwitchChange = (key: string, checked: boolean) => {
        globalConfiguration && setGlobalConfiguration({
            ...globalConfiguration,
            features: {
                ...globalConfiguration.features,
                [key]: checked,
            }
        });
    };

    const handleSubmit = async () => {
        try {
            on();
            globalConfiguration && await apis.updateConfiguration({ ...globalConfiguration })
            customNotification.success("Configurations updated successfully.")
        } catch {
            customNotification.error("Something went wrong. Please try again.")
        } finally {
            off();
        }
    };

    return (
        <div className="form-container">
            <Title level={2}>Global Configuration Settings</Title>
            <Form layout="vertical" className="configuration-form">
                <div className="form-row">
                    {globalConfiguration && globalConfiguration?.features && Object.keys(globalConfiguration?.features).map((key) => (
                        <div key={key} className="form-item">
                            <span className="switch-label">
                                {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                            </span>
                            <Switch
                                checked={globalConfiguration?.features[key as keyof typeof globalConfiguration.features]}
                                onChange={(checked) => handleSwitchChange(key, checked)}
                                className="custom-switch"
                            />
                        </div>
                    ))}
                </div>
                <Form.Item className="submit-container">
                    <Button type="primary" onClick={handleSubmit} className="submit-button" loading={loading}>
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Features;
