"use client";

import React, { MouseEventHandler, useCallback, useMemo } from 'react';
import * as Yup from "yup";
import { Formik } from 'formik';
import { apis } from '@/services';
import { useUserContext } from '@/context/provider';
import { Input } from '../components';
import { useRouter } from 'next/navigation';
import { ID_TOKEN_KEY } from '@/services/constants';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

const initialValues = {
    email: "",
    password: ""
};

const Page = () => {
    const validationSchema = useMemo(() => Yup.object().shape({
        email: Yup.string().email().required(),
        password: Yup.string().required()
    }), []);
    const { setUser } = useUserContext();
    const router = useRouter();
    const onSubmit = useCallback(async (values: typeof initialValues) => {
        try {
            const { data } = await apis.superAdminLogin(values);
            localStorage.setItem(ID_TOKEN_KEY, data.token);
            setUser(data.user);
            router.replace('/admin');
        } catch (error) {
            toast.error((error as AxiosError).response?.statusText);
        }
    }, []);

    return (
        <div className='w-full h-full bg-white flex justify-center items-center'>
            <div className='flex-col p-8 w-96 backdrop-blur-md bg-black/20 rounded-lg'>
                <Formik
                    initialValues={initialValues}
                    onSubmit={onSubmit}
                    validationSchema={validationSchema}>
                    {({
                        values,
                        errors,
                        handleSubmit,
                        handleChange,
                        handleBlur
                    }) => (
                        <>
                            <Input
                                label='Email'
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                name='email'
                                error={errors.email} />
                            <Input
                                label='Password'
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                name='password'
                                type='password'
                                error={errors.password} />
                            <div className='w-full text-end'>
                                <button
                                    type='button'
                                    onClick={handleSubmit as unknown as MouseEventHandler<HTMLButtonElement>}
                                    className="text-white px-10 py-2 rounded bg-primary hover:bg-secondary">
                                    Login
                                </button>
                            </div>
                        </>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default Page;