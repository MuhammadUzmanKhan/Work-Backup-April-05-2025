import React from "react";
import { Card, Switch, Popconfirm } from "antd";

interface Props {
    isMaintenanceMode: boolean;
    toggleMaintenanceMode: (enabled: boolean) => Promise<void>;
}

const MaintenanceModeCard: React.FC<Props> = ({ isMaintenanceMode, toggleMaintenanceMode }) => {
    return (
        <Card
            title="Maintenance Mode"
            style={{minWidth:'400px', margin:'20px'}}
            extra={
                <Popconfirm
                    title={`Are you sure you want to ${isMaintenanceMode ? "disable" : "enable"} maintenance mode?`}
                    onConfirm={() => toggleMaintenanceMode(!isMaintenanceMode)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Switch
                        checked={isMaintenanceMode}
                        checkedChildren="On"
                        unCheckedChildren="Off"
                    />
                </Popconfirm>
            }
        >
            <p>
                Maintenance mode is {isMaintenanceMode ? "enabled" : "disabled"}.
                {isMaintenanceMode && (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                        {" "}The platform is under maintenance.
                    </span>
                )}
            </p>
        </Card>
    );
};

export default MaintenanceModeCard;
