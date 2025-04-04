import { useEffect, useState } from "react";
import { Typography, message } from "antd";
import MaintenanceModeCard from "./MaintenanceModeCard";
import NotificationsCard from "./NotificationsCard";
import NotificationItem from "./NotificationItem";
import NotificationModal from "./NotificationModal";
import { apis } from "../../services";
import { INotification } from "../../services/types/common";

const { Title } = Typography;

const Notifications = () => {
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [visible, setVisible] = useState(false);
    const [editingNotification, setEditingNotification] = useState<INotification | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    const fetchNotifications = async () => {
        const { data } = await apis.getAllNotifications();
        setNotifications(data);
        const maintenanceMode = data.find((notification: INotification) => notification.maintenanceMode);
        setIsMaintenanceMode(!!maintenanceMode);
    };

    const handleOpenModal = (notification: INotification | null = null) => {
        setEditingNotification(notification);
        setVisible(true);
    };

    const handleCloseModal = () => {
        setEditingNotification(null);
        setVisible(false);
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await apis.deleteNotification(id);
            message.success("Notification deleted successfully!");
            fetchNotifications();
        } catch {
            message.error("Error deleting notification.");
        }
    };

    const handleSubmitNotification = async (values: any, { resetForm }: { resetForm: () => void }) => {
        setLoading(true);
        try {
            const apiCall = values.id
                ? apis.updateNotification(values.id, values)
                : apis.createNotification(values);
            await apiCall;
            message.success(`Notification ${values.id ? "updated" : "created"} successfully!`);
            handleCloseModal();
            resetForm();
            fetchNotifications();
        } catch {
            message.error("Error saving notification.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMaintenanceMode = async (enabled: boolean) => {
        setLoading(true);
        try {
            await apis.toggleMaintenanceMode(enabled);
            message.success(`Maintenance mode ${enabled ? "enabled" : "disabled"}!`);
            setIsMaintenanceMode(enabled);
            fetchNotifications()
        } catch {
            message.error("Error toggling maintenance mode.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="p-5" style={{ width:'100%'}}>
            <Title level={3}>Notifications Management</Title>
            <div className="flex gap-4">
                <MaintenanceModeCard
                    isMaintenanceMode={isMaintenanceMode}
                    toggleMaintenanceMode={toggleMaintenanceMode}
                />
                <NotificationsCard openCreateModal={() => handleOpenModal()} />
            </div>
            <div className="m-4 flex gap-4 flex-wrap">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteNotification}
                    />
                ))}
            </div>
            <NotificationModal
                visible={visible}
                initialValues={
                    editingNotification || {
                        id: '',
                        title: "",
                        notice: "",
                        callToAction: "",
                        startDate: '',
                        endDate: '',
                        visibleOnWeb: false,
                        visibleOnExtension: false,
                    }
                }
                loading={loading}
                onClose={handleCloseModal}
                onSubmit={handleSubmitNotification}
            />
        </div>
    );
};

export default Notifications;
