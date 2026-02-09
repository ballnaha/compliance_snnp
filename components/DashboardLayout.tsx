"use client";

import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const [open, setOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        // Toggle mobile drawer on small screens, sidebar on large screens
        if (window.innerWidth < 900) {
            setMobileOpen(!mobileOpen);
        } else {
            setOpen(!open);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Permanent Sidebar (Desktop) */}
            <Box sx={{
                display: { xs: 'none', md: 'block' },
                width: open ? 280 : 0,
                transition: 'width 0.3s ease',
                flexShrink: 0,
                position: 'relative'
            }}>
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: open ? 280 : 0,
                    height: '100vh',
                    transition: 'width 0.3s ease',
                    overflow: 'hidden',
                    zIndex: 1200
                }}>
                    <Sidebar variant="permanent" />
                </Box>
            </Box>

            {/* Mobile Sidebar */}
            <Sidebar
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                width: '100%',
                transition: 'margin 0.3s ease'
            }}>
                <Header onMenuClick={handleDrawerToggle} title={title} />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        mt: 3,
                        width: '100%',
                        maxWidth: '1600px',
                        mx: 'auto'
                    }}
                >
                    {children}
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}
