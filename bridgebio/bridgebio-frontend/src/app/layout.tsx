"use client";

import { Biryani } from 'next/font/google';
import "./globals.css";
import AppProvider from '@/context/provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const biryani = Biryani({
    subsets: ['latin'],
    weight: ['300', '400', '600', '700', '800'],
    variable: '--font-biryani'
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
            <AppProvider>
                <body className={`${biryani.className} antialiased`}>
                    <ToastContainer />
                    {children}
                </body>
            </AppProvider>
        </html>
    );
}