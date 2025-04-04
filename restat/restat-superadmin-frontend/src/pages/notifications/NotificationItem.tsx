import React from "react";
import { Card, Button, Tooltip, Tag, Typography, Space } from "antd";
import moment from "moment";
import { INotification } from "../../services/types/common";

const { Paragraph, Text } = Typography;

interface Props {
    notification: INotification;
    onEdit: (notification: INotification) => void;
    onDelete: (id: string) => void;
}

const NotificationItem: React.FC<Props> = ({ notification, onEdit, onDelete }) => {
    return (
        <Card
            key={notification.id}
            title={
                <Tooltip title={notification.title}>
                    <Text strong ellipsis style={{ maxWidth: 300 }}>
                        {notification.title}
                    </Text>
                </Tooltip>
            }
            extra={
                <Space>
                    <Button type="link" onClick={() => onEdit(notification)}>
                        Edit
                    </Button>
                    <Button type="link" danger onClick={() => onDelete(notification.id)}>
                        Delete
                    </Button>
                </Space>
            }
            hoverable
            style={{
                width: 400,
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
        >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Paragraph>{notification.notice}</Paragraph>
                {notification.callToAction && (
                    <a href={notification.callToAction} target="_blank" rel="noopener noreferrer">
                        <Button type="link" style={{ padding: 0 }}>
                            Call to Action
                        </Button>
                    </a>
                )}
                <Text type="secondary">
                    Start: {moment(notification.startDate).format("YYYY-MM-DD HH:mm")}
                </Text>
                <Text type="secondary">
                    End: {moment(notification.endDate).format("YYYY-MM-DD HH:mm")}
                </Text>
                {notification.maintenanceMode && <Tag color="green">Maintenance On</Tag>}
            </Space>
        </Card>
    );
};

export default NotificationItem;
