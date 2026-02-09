"use client";

import { SessionProvider } from "next-auth/react";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from '@/components/SnackbarProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <SnackbarProvider>
                    {children}
                </SnackbarProvider>
            </LocalizationProvider>
        </SessionProvider>
    );
}
