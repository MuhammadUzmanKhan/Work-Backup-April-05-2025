/* eslint-disable react-refresh/only-export-components */
"use client";

import React, { PropsWithChildren, useContext } from 'react';
import UserContextProvider, { userContext } from './user-context';

const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <UserContextProvider>
            {children}
        </UserContextProvider>
    );
};

export default AppProvider;

export const useUserContext = () => useContext(userContext);