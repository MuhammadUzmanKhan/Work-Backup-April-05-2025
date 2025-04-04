import AdminSidebarTab from "../side-bar-tab";
import { AdminSideBarTabs } from "@/types";

const AdminSideBar: React.FC = () => {
    return (
        <div className="w-[16rem] h-full">
            <div className="bg-white h-full rounded-xl" >
                <ul className="list-none flex flex-col items-center">
                    {Object.keys(AdminSideBarTabs)?.map((key) => {
                        return (
                            <AdminSidebarTab
                                key={key}
                                label={AdminSideBarTabs[key as keyof typeof AdminSideBarTabs]}
                            />
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default AdminSideBar;
