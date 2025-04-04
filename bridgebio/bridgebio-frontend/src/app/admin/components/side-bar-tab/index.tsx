import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback } from 'react';

interface AdminSidebarTabProps {
    label: string;
}

const AdminSidebarTab: React.FC<AdminSidebarTabProps> = ({
    label
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const path = label.toLowerCase().split(' ').join('-');
    const handleClick = useCallback(() => {
        router.push(path);
    }, [router, path]);

    return (
        <li
            className={`block px-4 py-2 mb-4 rounded-lg text-[12px] ${pathname.includes(path) ? 'bg-primary text-white' : 'text-secondary bg-adminSecondary'} cursor-pointer hover:bg-primary hover:text-white w-full`}
            onClick={handleClick}
        >
            {label}
        </li>
    );
};

export default AdminSidebarTab;
