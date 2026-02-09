"use client";

import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Stack,
    Box,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Skeleton,
    Chip,
    alpha
} from '@mui/material';
import { HambergerMenu, Notification, SearchNormal1, ProfileCircle, Setting2, Logout, Shield } from 'iconsax-react';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
    full_access: 'Full Access',
    view: 'View Only',
    admin: 'Admin',
};

interface HeaderProps {
    onMenuClick: () => void;
    title?: string;
}

export default function Header({ onMenuClick, title = "ระบบจัดการเอกสาร" }: HeaderProps) {
    const { data: session, status } = useSession();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const isLoading = status === 'loading';
    const userRole = (session?.user as any)?.role || '';

    const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'background.default',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider',
                top: 0,
                zIndex: (theme) => theme.zIndex.drawer + 1
            }}
        >
            <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1 }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={onMenuClick}
                    sx={{ mr: 2 }}
                >
                    <HambergerMenu size="24" variant="Bold" color="#6366f1" />
                </IconButton>

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.5px', display: { xs: 'none', sm: 'block' } }}>
                        {title}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <SearchNormal1 size="20" color="#6366f1" />
                    </IconButton>

                    <IconButton sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Badge badgeContent={4} color="error" variant="dot">
                            <Notification size="20" color="#f59e0b" />
                        </Badge>
                    </IconButton>

                    {isLoading ? (
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 1 }}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Skeleton variant="text" width={80} height={20} />
                                <Skeleton variant="text" width={55} height={16} />
                            </Box>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 1 }}>
                            <IconButton
                                onClick={handleAvatarClick}
                                sx={{ p: 0.5, border: '2px solid transparent', '&:hover': { borderColor: 'primary.main' }, transition: 'border-color 0.2s ease' }}
                            >
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                                        fontWeight: 700,
                                    }}
                                >
                                    {session?.user?.name ? session.user.name[0].toUpperCase() : 'U'}
                                </Avatar>
                            </IconButton>
                            <Box sx={{ display: { xs: 'none', md: 'block' }, cursor: 'pointer' }} onClick={handleAvatarClick}>
                                <Typography variant="body2" fontWeight="700" sx={{ lineHeight: 1.3 }}>
                                    {session?.user?.name || 'ผู้ใช้งาน'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                                    {ROLE_LABELS[userRole] || userRole || 'User'}
                                </Typography>
                            </Box>
                        </Stack>
                    )}

                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                                mt: 1.5,
                                borderRadius: 2,
                                minWidth: 220,
                                '&:before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor: 'background.paper',
                                    transform: 'translateY(-50%) rotate(45deg)',
                                    zIndex: 0,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight="700">{session?.user?.name || 'ผู้ใช้งาน'}</Typography>
                            <Typography variant="caption" color="text.secondary">{session?.user?.email || ''}</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Chip
                                    icon={<Shield size="12" variant="Bold" color={userRole === 'view' ? '#64748b' : '#6366f1'} />}
                                    label={ROLE_LABELS[userRole] || userRole || 'User'}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        bgcolor: (theme) => userRole === 'view' ? alpha('#64748b', 0.1) : alpha('#6366f1', 0.1),
                                        color: userRole === 'view' ? '#64748b' : '#6366f1',
                                        '& .MuiChip-icon': { ml: 0.5 },
                                        '& .MuiChip-label': { px: 0.8 },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Divider />
                        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5, borderRadius: 2, mx: 1 }}>
                            <ListItemIcon>
                                <ProfileCircle size="20" color="#6366f1" />
                            </ListItemIcon>
                            โปรไฟล์ของฉัน
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5, borderRadius: 2, mx: 1 }}>
                            <ListItemIcon>
                                <Setting2 size="20" color="#6366f1" />
                            </ListItemIcon>
                            ตั้งค่าบัญชี
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout} sx={{ py: 1.5, borderRadius: 2, mx: 1, color: 'error.main' }}>
                            <ListItemIcon>
                                <Logout size="20" color="#ef4444" />
                            </ListItemIcon>
                            ออกจากระบบ
                        </MenuItem>
                    </Menu>
                </Stack>
            </Toolbar>
        </AppBar>
    );
}
