import React from "react";
import { Card, Button } from "antd";

interface Props {
    openCreateModal: () => void;
}

const NotificationsCard: React.FC<Props> = ({ openCreateModal }) => {
    return (
        <Card
            title="Notifications"
            style={{minWidth:'400px', margin:'20px'}}
            extra={
                <Button type="primary" onClick={openCreateModal}>
                    Create Notification
                </Button>
            }
        >
            <p>Manage global notifications for your platform.</p>
        </Card>
    );
};

export default NotificationsCard;
