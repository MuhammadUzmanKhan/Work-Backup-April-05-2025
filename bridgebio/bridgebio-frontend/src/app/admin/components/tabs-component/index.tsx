import { TabsComponentProps } from "@/types";

const TabsComponent: React.FC<TabsComponentProps> = ({ tabs }) => {
    return (
        <ul className="flex flex-wrap gap-2 text-sm font-medium text-center text-secondary">
            {tabs.map((tab) => {
                return <li className="px-4 py-2 rounded-t-lg bg-adminContainer/50 cursor-pointer dark:hover:bg-gray-700 text-[12px]">
                    {tab}
                </li>;
            })}
        </ul>
    );
};

export default TabsComponent;
