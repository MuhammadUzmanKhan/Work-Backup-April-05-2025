import Image from "next/image";
import logo from '@public/logo.svg';
import { LayoutTabs } from "@/types";
import LayoutTab from "../layout-tab";
import Avatar from "../avatar";

const NavigationBar: React.FC = () => {
    return (
        <div className="w-screen py-3 flex items-center justify-between px-5" >
            <Image src={logo} alt="logo" width={130} />
            <div className="flex gap-3" >
                <LayoutTab image="search" />
                {Object.keys(LayoutTabs).map((tab) => <LayoutTab key={tab} label={LayoutTabs[tab as keyof typeof LayoutTabs]} />)}
            </div>
            <Avatar />
        </div>
    );
};

export default NavigationBar;
