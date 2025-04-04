/* eslint-disable react-refresh/only-export-components */
import { apis } from '@/services';
import { ID_TOKEN_KEY } from '@/services/constants';
import { Permissions, UserData } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useEffect,
    useState
} from 'react';

interface IUserContext {
    user: UserData | null;
    setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export const userContext = createContext<IUserContext>({
    user: null,
    setUser: () => { }
});

const UserContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const verifyToken = useCallback(async () => {
        try {
            const { data } = await apis.getUser();
            setUser(data);

            const hasAdminPermissions = Object.entries(data?.permissions as Permissions)
                .find(([key, value]) => value && key !== 'isSetByAdmin');

            if (!hasAdminPermissions && pathname.includes('admin')) {
                router.replace('/unauthorized');
            }
        } catch (error) {
            localStorage.removeItem(ID_TOKEN_KEY);
            router.replace('/unauthorized');
        }
    }, [pathname, router]);

    useEffect(() => {
        if (!pathname.includes('admin/login')) {
            verifyToken();
        }
    }, []);

    return (
        <userContext.Provider value={{
            user: user!,
            setUser
        }}>
            {children}
        </userContext.Provider>
    );
};

export default UserContextProvider;