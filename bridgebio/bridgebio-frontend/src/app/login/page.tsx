"use client";

import { ID_TOKEN_KEY } from '@/services/constants';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

const Login: React.FC<{ setToken: (token: string) => void }> = ({ setToken }) => {
    const searchParams = useSearchParams();

    useEffect(() => {
        const idToken = searchParams.get('id_token');

        if (idToken) {
            setToken(idToken);
        }
    }, [searchParams]);

    return (
        <div>Login you in, please wait...</div>
    );
};

const LoginPage = () => {
    const [token, setToken] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        if (token?.length) {
            localStorage.setItem(ID_TOKEN_KEY, token);
            router.replace("/medicines");
        } else {
            router.replace("/unauthorized");
        }
    }, [token]);

    return (
        <Suspense>
            <Login setToken={(token) => setToken(token)} />
        </Suspense>
    );
};

export default LoginPage;