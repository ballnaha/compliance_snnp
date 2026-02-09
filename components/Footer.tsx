"use client";

import { Box, Typography, alpha, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';

export default function Footer() {
    const theme = useTheme();
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear() + 543);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear() + 543);
    }, []);

    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,
                mt: '20px',
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: 'xl',
                    mx: 'auto'
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 500
                    }}
                >
                    © {currentYear} SNNP Compliance System
                </Typography>
                
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 500
                    }}
                >
                    ระบบจัดการเอกสาร
                </Typography>
            </Box>
        </Box>
    );
}
