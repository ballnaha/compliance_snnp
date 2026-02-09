"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
    Snackbar,
    Alert,
    AlertColor,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack
} from '@mui/material';
import { Trash, Danger } from 'iconsax-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    severity?: 'error' | 'warning' | 'info';
}

interface SnackbarContextType {
    showSnackbar: (message: string, severity?: AlertColor) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
    // Snackbar state
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<AlertColor>('success');

    // Dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions>({
        title: '',
        message: '',
    });
    const [confirmPromise, setConfirmPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const showSnackbar = (msg: string, sev: AlertColor = 'success') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    };

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        setConfirmOptions(options);
        setConfirmOpen(true);
        return new Promise((resolve) => {
            setConfirmPromise({ resolve });
        });
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleConfirmClose = (value: boolean) => {
        setConfirmOpen(false);
        if (confirmPromise) {
            confirmPromise.resolve(value);
            setConfirmPromise(null);
        }
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar, confirm }}>
            {children}

            {/* Notification Snackbar */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    {message}
                </Alert>
            </Snackbar>

            {/* Global Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => handleConfirmClose(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 1,
                        minWidth: 400
                    }
                }}
            >
                <DialogContent>
                    <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mt: 1 }}>
                        <Box sx={{
                            p: 2,
                            borderRadius: '50%',
                            bgcolor: confirmOptions.severity === 'error' ? 'error.lighter' : 'warning.lighter',
                            color: confirmOptions.severity === 'error' ? 'error.main' : 'warning.main',
                            display: 'flex'
                        }}>
                            {confirmOptions.severity === 'error' ? (
                                <Trash variant="Bold" size="32" />
                            ) : (
                                <Danger variant="Bold" size="32" />
                            )}
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="800" gutterBottom>
                                {confirmOptions.title}
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                {confirmOptions.message}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'center', gap: 1 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleConfirmClose(false)}
                        sx={{ borderRadius: 2, py: 1, color: 'text.secondary', borderColor: 'divider' }}
                    >
                        {confirmOptions.cancelText || 'ยกเลิก'}
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color={confirmOptions.severity === 'error' ? 'error' : 'primary'}
                        onClick={() => handleConfirmClose(true)}
                        sx={{ borderRadius: 2, py: 1, fontWeight: 700 }}
                    >
                        {confirmOptions.confirmText || 'ยืนยัน'}
                    </Button>
                </DialogActions>
            </Dialog>
        </SnackbarContext.Provider>
    );
};
