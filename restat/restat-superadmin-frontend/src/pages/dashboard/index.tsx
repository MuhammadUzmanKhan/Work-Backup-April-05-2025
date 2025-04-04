import { ConfigurationCategoryCard } from "../../components";
import { UserState } from "../../services/types/user";
import { routes } from "../../services";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ user }: { user: UserState }) => {

    const navigate = useNavigate();
    console.info(user);


    return (
        <div className="h-1">
            <ConfigurationCategoryCard title="Features" onClick={() => navigate(routes.features)} />
            <ConfigurationCategoryCard title="Global Notifications" onClick={() => navigate(routes.notifications)} />
            <ConfigurationCategoryCard title="Extension Notification" onClick={() => navigate(routes.extensionNotification)} />
        </div>
    )
}

export default Dashboard;
