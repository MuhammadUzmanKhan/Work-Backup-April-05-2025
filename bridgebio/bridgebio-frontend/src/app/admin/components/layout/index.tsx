"use client";

import AdminSideBar from "../side-bar";
import Image from "next/image";
import logo from '@public/logo.svg';
import Avatar from "@/components/avatar";
import { AdminDashboardLayoutPops } from "@/types";
import TabsComponent from "../tabs-component";

const AdminDashboardLayout: React.FC<AdminDashboardLayoutPops> = ({
    children,
    tabs = [],
    selectedTab = 0
}) => {
    return (
        <div className="w-full h-full bg-white flex flex-col p-9">
            <div className="flex flex-row items-start mb-4">
                <div className="w-[21rem]">
                    <Image src={logo} alt="logo" className="w-[150px]" />
                </div>
                <div className="flex w-full px-3 flex-row justify-between">
                    <h1 className="text-[36px] mt-1 text-primary">Welcome Back!</h1>
                    <Avatar />
                </div>
            </div>
            <div className="w-full h-full flex flex-row gap-5 flex-grow">
                <AdminSideBar />
                <div className="flex flex-grow flex-col">
                    {tabs.length > 0 && <TabsComponent tabs={tabs} selectedTab={selectedTab} />}
                    <div className={`${tabs.length > 0 ? 'rounded-r-xl rounded-bl-xl' : 'rounded-xl'} bg-adminContainer/50 overflow-auto h-full p-4`} >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardLayout;
