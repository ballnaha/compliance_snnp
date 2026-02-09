"use client";

import {
    Box,
    Typography,
    Stack,
    Avatar,
    IconButton,
    Drawer,
    Skeleton,
    Chip,
    alpha,
    useTheme as useMuiTheme
} from '@mui/material';
import {
    Element3,
    Folder2,
    Clock,
    ProfileCircle,
    DocumentText,
    Logout,
    CloseCircle,
    Shield,
    Diagram,
    TaskSquare
} from 'iconsax-react';
import { signOut, useSession } from "next-auth/react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_STRUCTURE = [
    {
        title: 'เมนูหลัก',
        items: [
            { text: 'แดชบอร์ด', icon: Element3, path: '/', color: '#6366f1', viewAllowed: true },
            { text: 'เอกสาร Compliance', icon: DocumentText, path: '/compliance', color: '#10b981', viewAllowed: false },
        ]
    },
    {
        title: 'งานของฉัน',
        items: [
            { text: 'ผู้ที่รับผิดชอบ', icon: TaskSquare, path: '/my-activities', color: '#0ea5e9', viewAllowed: true },
            { text: 'ผู้จัดเตรียมเอกสาร', icon: TaskSquare, path: '/my-activities/preparer', color: '#8b5cf6', viewAllowed: true },
        ]
    },
    {
        title: 'รายงาน',
        items: [
            { text: 'รายงาน Report', icon: Diagram, path: '/compliance/report', color: '#ef4444', viewAllowed: false },
        ]
    },
    {
        title: 'ตั้งค่าระบบ',
        items: [
            { text: 'จัดการผู้ใช้งาน', icon: ProfileCircle, path: '/users', color: '#8b5cf6', viewAllowed: false },
            { text: 'หมวดหมู่', icon: Folder2, path: '/categories', color: '#f59e0b', viewAllowed: false },
        ]
    }
];

const ROLE_LABELS: Record<string, string> = {
    full_access: 'Full Access',
    view: 'View Only',
    admin: 'Admin',
};

interface SidebarProps {
    open?: boolean;
    onClose?: () => void;
    variant?: 'permanent' | 'temporary';
}

export default function Sidebar({ open, onClose, variant = 'permanent' }: SidebarProps) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const theme = useMuiTheme();

    const userRole = (session?.user as { role?: string } | undefined)?.role || '';
    const isViewOnly = userRole === 'view';

    const isItemActive = (itemPath: string) => {
        if (pathname === itemPath) return true;
        if (itemPath === '/') return false;
        if (!pathname.startsWith(itemPath)) return false;

        // Check if any other menu item is a better match
        let isBetterMatch = false;
        MENU_STRUCTURE.forEach(group => {
            group.items.forEach(m => {
                if (m.path !== itemPath && m.path.startsWith(itemPath) && pathname.startsWith(m.path)) {
                    isBetterMatch = true;
                }
            });
        });
        return !isBetterMatch;
    };

    const loadingSkeleton = (
        <Box sx={{
            width: 280,
            bgcolor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 0,
        }}>
            {/* Logo Skeleton */}
            <Box sx={{ px: 3, pt: 4, pb: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Skeleton
                        variant="rounded"
                        width={40}
                        height={40}
                        sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)' }}
                    />
                    <Box>
                        <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                    </Box>
                </Stack>
            </Box>

            <Box sx={{ mx: 3, mb: 3, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)' }} />

            {/* Menu Groups Skeleton */}
            <Box sx={{ px: 3, flexGrow: 1 }}>
                {[1, 2].map(group => (
                    <Box key={group} sx={{ mb: 4 }}>
                        <Skeleton
                            variant="text"
                            width={100}
                            height={20}
                            sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.03)' }}
                        />
                        <Stack spacing={1.5}>
                            {[1, 2, 3].map(item => (
                                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Skeleton
                                        variant="circular"
                                        width={20}
                                        height={20}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Skeleton
                                        variant="rounded"
                                        width="70%"
                                        height={24}
                                        sx={{ borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.04)' }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Box>

            {/* Bottom Profile Skeleton */}
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" p={1.2}>
                    <Skeleton
                        variant="circular"
                        width={36}
                        height={36}
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                    </Box>
                </Stack>
            </Box>
        </Box>
    );

    const sidebarContent = (
        <Box sx={{
            width: 280,
            bgcolor: '#0f172a', // Premium Deep Slate Background
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            borderRight: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.05)',
            color: 'white'
        }}>
            {variant === 'temporary' && (
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.4)', zIndex: 1 }}
                >
                    <CloseCircle size="22" />
                </IconButton>
            )}

            {/* Logo Section */}
            <Box sx={{ px: 3, pt: 4, pb: 2.5 }}>
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    component={Link}
                    href="/"
                    sx={{ textDecoration: 'none' }}
                >
                    <Box sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
                    }}>
                        <DocumentText size="20" variant="Bold" color="white" />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: '0.4px', color: 'white', lineHeight: 1.2, fontSize: '1.1rem' }}>
                            SNNP
                        </Typography>
                        <Typography variant="caption" fontWeight="700" sx={{ color: '#818cf8', letterSpacing: '1.2px', fontSize: '0.6rem', textTransform: 'uppercase', display: 'block' }}>
                            Compliance
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Box sx={{ mx: 3, mb: 1.5, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)' }} />

            {/* Navigation */}
            <Box sx={{
                px: 1.5,
                flexGrow: 1,
                overflowY: 'auto',
                pb: 4,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                },
                '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            }}>
                {MENU_STRUCTURE.map((group) => {
                    const visibleItems = group.items.filter(item => item.viewAllowed || !isViewOnly);

                    if (visibleItems.length === 0) return null;

                    return (
                        <Box key={group.title} sx={{ mb: 3 }}>
                            <Box sx={{ px: 1.5, mb: 1.2 }}>
                                <Typography variant="overline" sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: 'rgba(255, 255, 255, 0.25)',
                                    letterSpacing: '1.5px',
                                    textTransform: 'uppercase'
                                }}>
                                    {group.title}
                                </Typography>
                            </Box>
                            <Stack spacing={0.5}>
                                {visibleItems.map((item) => {
                                    const isActive = isItemActive(item.path);
                                    return (
                                        <Box
                                            key={item.text}
                                            component={Link}
                                            href={item.path}
                                            onClick={() => variant === 'temporary' && onClose?.()}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                px: 1.5,
                                                py: 1.1,
                                                borderRadius: '10px',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                                color: isActive ? '#818cf8' : 'rgba(255, 255, 255, 0.55)',
                                                '&:hover': {
                                                    bgcolor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                    color: isActive ? '#818cf8' : 'white',
                                                    '& .menu-icon': {
                                                        color: isActive ? '#818cf8' : 'white',
                                                    }
                                                }
                                            }}
                                        >
                                            <Box className="menu-icon" sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                color: isActive ? '#818cf8' : 'inherit'
                                            }}>
                                                <item.icon
                                                    size="18"
                                                    variant={isActive ? "Bold" : "Linear"}
                                                    color="currentColor"
                                                />
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: isActive ? 700 : 500,
                                                    fontSize: '0.86rem',
                                                    letterSpacing: '0.1px'
                                                }}
                                            >
                                                {item.text}
                                            </Typography>
                                            {isActive && (
                                                <Box sx={{
                                                    ml: 'auto',
                                                    width: 4,
                                                    height: 16,
                                                    borderRadius: '4px',
                                                    bgcolor: '#6366f1',
                                                    boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
                                                }} />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    );
                })}
            </Box>

            {/* Bottom Profile Area */}
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{
                    p: 1.2,
                    borderRadius: '12px',
                    mb: 1
                }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#1e293b',
                            color: '#818cf8',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            border: '1px solid rgba(129, 140, 248, 0.2)',
                        }}>
                            {session?.user?.name ? session.user.name[0].toUpperCase() : 'U'}
                        </Avatar>
                        <Box sx={{ overflow: 'hidden', flex: 1 }}>
                            <Typography variant="body2" fontWeight="700" noWrap sx={{ color: 'white', lineHeight: 1.2 }}>
                                {session?.user?.name || 'ผู้ใช้งาน'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                {ROLE_LABELS[userRole] || userRole || 'User'}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.8,
                        py: 1.2,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        color: 'rgba(239, 68, 68, 0.75)',
                        '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                        },
                    }}
                >
                    <Logout size="18" variant="Bold" color="currentColor" />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        ออกจากระบบ
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    const content = status === 'loading' ? loadingSkeleton : sidebarContent;

    if (variant === 'temporary') {
        return (
            <Drawer
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: { border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }
                }}
            >
                {content}
            </Drawer>
        );
    }

    return content;
}
