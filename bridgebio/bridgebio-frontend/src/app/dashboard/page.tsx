"use client";

import { useUserContext } from '@/context/provider';
import { Layout } from '../../components';
import { Permissions } from '../../types/index';

const Dashboard: React.FC = () => {
    const { user } = useUserContext();

    return (
        <Layout>
            {user ? (
                <div className="flex flex-col justify-center items-center text-white font-bold">
                    <h1 className="font-poppins text-3xl">
                        Welcome to Bridge Bio {user?.name}
                    </h1>
                    <p className="font-poppins">
                        Your app permissions are
                        {Object.keys(user.permissions).map(permission => user?.permissions?.[permission as keyof Permissions] && permission !== 'isSetByAdmin' && <p>{permission.split('_').join(" ")}</p>)}
                    </p>
                </div>
            ) : (
                <h1 className="font-poppins text-3xl">
                    Please wait...
                </h1>
            )}
        </Layout>
    );
};

export default Dashboard;