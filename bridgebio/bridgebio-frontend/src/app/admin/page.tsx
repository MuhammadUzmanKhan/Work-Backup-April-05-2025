"use client";

import React, { useEffect } from 'react';
import { AdminDashboardLayout } from './components';
import { useUserContext } from '@/context/provider';
import { useRouter } from 'next/navigation';
import { Permissions } from '@/types';

const Page = () => {
    const { user } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (user?.permissions?.SUPER_ADMIN) {
            router.replace('/admin/dashboard');
        } else {
            if (user?.permissions) {
                const firstTruePermission = Object.entries(user?.permissions as Permissions)
                    .find(([key, value]) => value && key !== 'isSetByAdmin')?.[0];
                const path = firstTruePermission ? `admin/${firstTruePermission?.toLowerCase().split('_').join('-')}` : '/unauthorized';
                router.replace(path);
            }
        }
    }, [user]);
    return (
        <AdminDashboardLayout>

        </AdminDashboardLayout>
    );
};

export default Page;