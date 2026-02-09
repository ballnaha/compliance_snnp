"use client";

import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Stack,
    Paper,
    TextField,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Tooltip
} from '@mui/material';
import {
    SearchNormal1,
    AddCircle,
    Edit2,
    Trash,
    ProfileCircle,
    Building4,
    Verify,
    Sms
} from 'iconsax-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSnackbar } from '@/components/SnackbarProvider';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string | null;
    department: string | null;
    status: string | null;
    factories: string[];
    cat_id: string | null;
    created_at: string;
}

interface CategoryOption {
    id: string;
    name: string;
}

interface StatusMaster {
    id: number;
    code_id: string; // Used for key/value
    name: string;   // Used for display
    type: string;   // 'Factory' or 'Department'
}

const ROLES = ['view', 'full_access'];

export default function UsersPage() {
    const { showSnackbar, confirm } = useSnackbar();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || '';
    const canEdit = userRole !== 'view';
    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [departments, setDepartments] = useState<StatusMaster[]>([]);
    const [factories, setFactories] = useState<StatusMaster[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [emailLoading, setEmailLoading] = useState(false);
    const [userEmailLoading, setUserEmailLoading] = useState<Record<string, boolean>>({});

    // Dialog state
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'view',
        department: 'Other',
        status: 'on',
        factories: [] as string[],
        cat_id: [] as string[]
    });

    useEffect(() => {
        fetchUsers();
        fetchCategories();
        fetchStatusMaster();
    }, []);

    const fetchStatusMaster = async () => {
        try {
            const res = await fetch('/api/status-master');
            const data = await res.json();
            if (res.ok) {
                // Filter and set departments
                const depts = data.filter((item: StatusMaster) => item.type?.toLowerCase() === 'auth');
                setDepartments(depts);

                // Filter and set factories
                const facs = data.filter((item: StatusMaster) => item.type === 'Factory');
                setFactories(facs);
            }
        } catch (err) {
            console.error('Failed to load status master');
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (res.ok) {
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to load categories');
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            } else {
                showSnackbar(data.error || 'Failed to load users', 'error');
            }
        } catch (err) {
            showSnackbar('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTestEmail = async (userId?: string) => {
        const ok = await confirm({
            title: userId ? 'ยืนยันการส่ง Email รายบุคคล' : 'ยืนยันการส่ง Email ทดสอบ (ทั้งหมด)',
            message: userId
                ? 'ระบบจะส่ง Email แจ้งเตือนไปยังผู้ใช้รายนี้ (หากมีรายการที่ใกล้หมดอายุ)'
                : 'ระบบจะส่ง Email แจ้งเตือนไปยังผู้รับผิดชอบและผู้จัดเตรียมเอกสารทุกคนที่มีรายการใกล้หมดอายุ คุณต้องการดำเนินการต่อหรือไม่?',
            confirmText: 'ส่ง Email',
            severity: 'info'
        });

        if (!ok) return;

        try {
            if (userId) {
                setUserEmailLoading(prev => ({ ...prev, [userId]: true }));
            } else {
                setEmailLoading(true);
            }

            const res = await fetch('/api/notifications/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.results && data.results.length > 0) {
                    showSnackbar('ส่ง email แจ้งเตือนเรียบร้อยแล้ว', 'success');
                } else if (data.message) {
                    showSnackbar(data.message, 'info');
                } else {
                    showSnackbar('ไม่พบรายการที่ต้องแจ้งเตือนสำหรับผู้ใช้นี้', 'info');
                }
            } else {
                showSnackbar(data.error || 'เกิดข้อผิดพลาดในการส่ง email', 'error');
            }
        } catch (err) {
            showSnackbar('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        } finally {
            if (userId) {
                setUserEmailLoading(prev => ({ ...prev, [userId]: false }));
            } else {
                setEmailLoading(false);
            }
        }
    };

    const handleOpen = (user?: User) => {
        if (user) {
            setEditMode(true);
            setSelectedId(user.id);
            setFormData({
                name: user.name,
                username: user.username,
                email: user.email,
                password: '', // Don't show password
                confirmPassword: '',
                role: ['view', 'full_access'].includes(user.role || '') ? 'full_access' : 'view',
                department: user.department || 'Other',
                status: user.status === 'active' ? 'on' : (user.status || 'on'),
                factories: Array.from(new Set(user.factories || [])),
                cat_id: user.cat_id ? Array.from(new Set(user.cat_id.split(','))) : []
            });
        } else {
            setEditMode(false);
            setFormData({
                name: '',
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'view',
                department: 'Other',
                status: 'on',
                factories: [],
                cat_id: []
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password confirmation
        if (formData.password && formData.password !== formData.confirmPassword) {
            showSnackbar('รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }

        try {
            const url = editMode ? `/api/users/${selectedId}` : '/api/users';
            const method = editMode ? 'PUT' : 'POST';

            const { confirmPassword, ...submitData } = formData;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            if (res.ok) {
                showSnackbar(editMode ? 'อัปเดตผู้ใช้งานเรียบร้อยแล้ว' : 'สร้างผู้ใช้งานเรียบร้อยแล้ว', 'success');
                handleClose();
                fetchUsers();
            } else {
                const data = await res.json();
                showSnackbar(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
            }
        } catch (err) {
            showSnackbar('เกิดข้อผิดพลาดบางอย่าง', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: 'ยืนยันการลบ',
            message: 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
            confirmText: 'ลบผู้ใช้งาน',
            severity: 'error'
        });

        if (!ok) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showSnackbar('User deleted', 'success');
                fetchUsers();
            } else {
                showSnackbar('Failed to delete', 'error');
            }
        } catch (err) {
            showSnackbar('Error deleting user', 'error');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleChip = (role: string | null) => {
        const colors: any = { view: 'info', full_access: 'success' };
        const roleNames: any = { view: 'View', full_access: 'Full Access' };

        // Normalize role
        let normalizedRole = role?.toLowerCase() || 'view';
        if (!colors[normalizedRole]) {
            normalizedRole = 'view';
        }

        return (
            <Chip
                label={roleNames[normalizedRole]}
                size="small"
                color={colors[normalizedRole]}
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'uppercase', fontSize: '10px' }}
            />
        );
    };

    return (
        <DashboardLayout title="จัดการผู้ใช้งาน">
            <Container maxWidth="xl" sx={{ p: 0 }}>
                {/* Header */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4}>
                    <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5, letterSpacing: '-1px' }}>
                            จัดการผู้ใช้งาน
                        </Typography>
                        <Typography color="text.secondary" fontWeight={400}>
                            จัดการข้อมูลผู้ใช้งานในระบบ, บทบาท และสิทธิ์ในการเข้าถึงโรงงาน
                        </Typography>
                    </Box>
                    {canEdit && (
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={emailLoading ? <CircularProgress size={20} /> : <Sms variant="Bold" color="#10b981" />}
                                onClick={() => handleTestEmail()}
                                disabled={emailLoading}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                ทดสอบส่ง Email
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddCircle variant="Bold" color="white" />}
                                size="large"
                                onClick={() => handleOpen()}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                เพิ่มผู้ใช้งาน
                            </Button>
                        </Stack>
                    )}
                </Stack>

                {/* List Table */}
                <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <TextField
                            placeholder="ค้นหาด้วยชื่อ, ชื่อผู้ใช้งาน หรืออีเมล..."
                            fullWidth
                            size="small"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchNormal1 size="18" color="#6366f1" />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, bgcolor: '#f8fafc', '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: 'divider' } }
                            }}
                        />
                    </Box>

                    <TableContainer>
                        <Table sx={{ minWidth: 1000 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'transparent' }}>
                                    <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider' }}>ข้อมูลผู้ใช้งาน</TableCell>
                                    <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider' }}>ภาค/ฝ่าย</TableCell>
                                    <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider' }}>บทบาท</TableCell>
                                    <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider' }}>สิทธิ์เข้าถึงโรงงาน</TableCell>
                                    <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider' }}>สถานะ</TableCell>
                                    <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider' }}>วันที่เข้าร่วม</TableCell>
                                    {canEdit && <TableCell sx={{ fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'right' }}>จัดการ</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                            <CircularProgress size={40} thickness={4} />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                            <Typography color="text.secondary">No users found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar sx={{
                                                        width: 40,
                                                        height: 40,
                                                        bgcolor: 'primary.lighter',
                                                        color: 'primary.main',
                                                        fontWeight: 800,
                                                        fontSize: '1rem',
                                                        border: '2px solid transparent',
                                                        transition: '0.3s',
                                                        '&:hover': { borderColor: 'primary.main' }
                                                    }}>
                                                        {user.name[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="700">{user.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">@{user.username} • {user.email}</Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {user.department || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {getRoleChip(user.role)}
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {user.factories?.length > 0 ? (
                                                        user.factories.map((fId, idx) => {
                                                            const fac = factories.find(f => f.code_id === fId);
                                                            return (
                                                                <Chip
                                                                    key={`${user.id}-${fId}-${idx}`}
                                                                    label={fac ? fac.name : fId}
                                                                    size="small"
                                                                    icon={<Building4 size="12" variant="Bold" color="#64748b" />}
                                                                    sx={{ mb: 0.5, borderRadius: 1.5, fontSize: '11px', bgcolor: '#f1f5f9' }}
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">ไม่มีสิทธิ์เข้าถึง</Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.status === 'on' || user.status === 'active' ? 'On' : 'Off'}
                                                    size="small"
                                                    color={user.status === 'on' || user.status === 'active' ? 'success' : 'default'}
                                                    sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '11px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {dayjs(user.created_at).format('DD/MM/YYYY')}
                                                </Typography>
                                            </TableCell>
                                            {canEdit && (
                                                <TableCell sx={{ textAlign: 'right' }}>
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="ส่ง Email แจ้งเตือนรายบุคคล">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleTestEmail(user.id)}
                                                                disabled={userEmailLoading[user.id]}
                                                                sx={{ color: '#10b981', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#10b981', color: 'white' } }}
                                                            >
                                                                {userEmailLoading[user.id] ? <CircularProgress size={18} /> : <Sms size="18" variant="Bold" color="#10b981" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <IconButton size="small" onClick={() => handleOpen(user)} sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#6366f1', color: 'white' } }}>
                                                            <Edit2 size="18" variant="Bold" color="#6366f1" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDelete(user.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}>
                                                            <Trash size="18" variant="Bold" color="#ef4444" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editMode ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                                <TextField
                                    label="ชื่อ-นามสกุล"
                                    fullWidth
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <TextField
                                    label="username"
                                    fullWidth
                                    required
                                    disabled={editMode}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                                <TextField
                                    label="อีเมล"
                                    type="email"
                                    fullWidth
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <TextField
                                    label={editMode ? "รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"}
                                    type="password"
                                    fullWidth
                                    required={!editMode}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                    helperText={editMode ? "ปล่อยว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : ""}
                                />
                                {(formData.password || !editMode) && (
                                    <TextField
                                        label="ยืนยันรหัสผ่าน"
                                        type="password"
                                        fullWidth
                                        required={!editMode}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                        error={!!(formData.confirmPassword && formData.password !== formData.confirmPassword)}
                                        helperText={formData.confirmPassword && formData.password !== formData.confirmPassword ? "รหัสผ่านไม่ตรงกัน" : ""}
                                    />
                                )}
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                                <FormControl fullWidth>
                                    <InputLabel>บทบาท</InputLabel>
                                    <Select
                                        value={formData.role}
                                        label="บทบาท"
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="view">View</MenuItem>
                                        <MenuItem value="full_access">Full Access</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>แผนก</InputLabel>
                                    <Select
                                        value={formData.department}
                                        label="แผนก"
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {departments.length > 0 ? (
                                            departments.map(dept => (
                                                <MenuItem key={dept.id} value={dept.name || ''}>{dept.name}</MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem value="Other">Other</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>สถานะ</InputLabel>
                                    <Select
                                        value={formData.status}
                                        label="สถานะ"
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="on">On</MenuItem>
                                        <MenuItem value="off">Off</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            <FormControl fullWidth sx={{ mb: 1 }}>
                                <InputLabel>Factory Access</InputLabel>
                                <Select
                                    multiple
                                    value={formData.factories}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({
                                            ...formData,
                                            factories: typeof value === 'string' ? value.split(',') : value,
                                        });
                                    }}
                                    input={<OutlinedInput label="Factory Access" sx={{ borderRadius: 2 }} />}
                                    renderValue={(selected) => {
                                        const uniqueSelected = Array.from(new Set(selected));
                                        return (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {uniqueSelected.map((val) => {
                                                    const fac = factories.find(f => f.code_id === val);
                                                    return <Chip key={val} label={fac ? fac.name : val} size="small" />;
                                                })}
                                            </Box>
                                        );
                                    }}
                                >
                                    {factories.map((fac) => (
                                        <MenuItem key={fac.id} value={fac.code_id || ''}>
                                            <Checkbox checked={formData.factories.indexOf(fac.code_id || '') > -1} />
                                            <ListItemText primary={fac.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 1 }}>
                                <InputLabel>Category Access</InputLabel>
                                <Select
                                    multiple
                                    value={formData.cat_id}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({
                                            ...formData,
                                            cat_id: typeof value === 'string' ? value.split(',') : value,
                                        });
                                    }}
                                    input={<OutlinedInput label="Category Access" sx={{ borderRadius: 2 }} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((val) => {
                                                const cat = categories.find(c => c.id.toString() === val);
                                                return <Chip key={val} label={cat ? cat.name : val} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id.toString()}>
                                            <Checkbox checked={formData.cat_id.indexOf(cat.id.toString()) > -1} />
                                            <ListItemText primary={cat.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                        <Button type="submit" variant="contained" sx={{ borderRadius: 2, px: 4 }}>
                            {editMode ? 'Update User' : 'Create User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout >
    );
}
