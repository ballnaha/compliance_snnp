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
    MenuItem,
    FormControl,
    Select,
    CircularProgress,
    Switch,
    InputLabel,
    FormControlLabel,
    Divider,
    Avatar,
    useTheme,
    alpha,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    IconButton,
    Autocomplete,
    createFilterOptions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import {
    Save2,
    CloseCircle,
    DocumentUpload,
    InfoCircle,
    Calendar,
    Profile2User,
    FolderOpen,
    Note,
    Trash,
    Document
} from 'iconsax-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSnackbar } from '@/components/SnackbarProvider';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Interfaces
interface StatusMaster {
    id: number;
    code_id: string;
    name: string;
    type: string;
}

interface CategoryOption {
    id: string;
    name: string;
    cat_folder: string;
}

interface UserOption {
    id: string;
    name: string;
}



const filter = createFilterOptions<string>();

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, width: 32, height: 32 }}>
            <Icon size="18" variant="Bold" color={color} />
        </Avatar>
        <Typography variant="h6" fontWeight="700">
            {title}
        </Typography>
    </Stack>
);

export default function CreateCompliancePage() {
    const { showSnackbar } = useSnackbar();
    const router = useRouter();
    const theme = useTheme();
    const { data: session } = useSession();
    const userCatId = (session?.user as any)?.cat_id || '';
    const userFactories = (session?.user as any)?.factories || '';
    const userRole = (session?.user as any)?.role || '';
    const [loading, setLoading] = useState(false);

    // Master Data
    const [departments, setDepartments] = useState<StatusMaster[]>([]);
    const [factories, setFactories] = useState<StatusMaster[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [states, setStates] = useState<StatusMaster[]>([]);
    const [receiveOptions, setReceiveOptions] = useState<string[]>([]);
    const [stateOptions, setStateOptions] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        cat_name: '',
        cat_folder: '',
        license: '',
        plan: '',
        factory: '',
        license_no: '',
        allow_datetime: null as Dayjs | null,
        expire_datetime: null as Dayjs | null,
        warning_datetime: null as Dayjs | null,
        department: '',
        status: '',
        responsible_person: '',
        document_preparer: '',
        document_receive: '',
        document_state: '',
        objective: '',
        remark: ''
    });

    const [files, setFiles] = useState<File[]>([]);

    // Extra UI State
    const [needUpdateStatus, setNeedUpdateStatus] = useState(true);
    const [isInactive, setIsInactive] = useState(false);
    const [expectedFinishDate, setExpectedFinishDate] = useState<Dayjs | null>(null);

    // Delete Warning State
    const [deleteFileIndex, setDeleteFileIndex] = useState<number | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    useEffect(() => {
        if (userRole === 'view') {
            router.push('/compliance');
            return;
        }
    }, [userRole]);

    useEffect(() => {
        fetchStatusMaster();
        fetchCategories();
        fetchUsers();
        fetchStates();
        fetchStates();
        fetchReceiveOptions();
        fetchStateOptions();
    }, [userCatId, userFactories]);

    const fetchStatusMaster = async () => {
        try {
            const res = await fetch('/api/status-master');
            const data = await res.json();
            if (res.ok) {
                setDepartments(data.filter((d: StatusMaster) => d.type?.toLowerCase() === 'auth'));
                let allFactories = data.filter((f: StatusMaster) => f.type?.toLowerCase() === 'factory');
                if (userFactories) {
                    const allowedFactories = userFactories.split(',').map((f: string) => f.trim()).filter(Boolean);
                    allFactories = allFactories.filter((f: StatusMaster) => allowedFactories.includes(f.code_id));
                }
                setFactories(allFactories);
            }
        } catch (err) {
            console.error('Failed to load status master');
        }
    };

    const fetchStates = async () => {
        try {
            const res = await fetch('/api/status-master?type=state');
            if (res.ok) setStates(await res.json());
        } catch (err) { console.error('Failed to load states'); }
    };

    const fetchReceiveOptions = async () => {
        try {
            const res = await fetch('/api/compliance?type=received-options');
            if (res.ok) {
                const data = await res.json();
                setReceiveOptions(data);
            }
        } catch (err) { console.error('Failed to load receive options'); }
    };

    const fetchStateOptions = async () => {
        try {
            const res = await fetch('/api/compliance?type=state-options');
            if (res.ok) {
                const data = await res.json();
                setStateOptions(data);
            }
        } catch (err) { console.error('Failed to load state options'); }
    };

    const fetchCategories = async () => {
        try {
            const url = userCatId ? `/api/categories?cat_id=${userCatId}` : '/api/categories';
            const res = await fetch(url);
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
            const res = await fetch('/api/users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to load users');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
        e.target.value = ''; // Reset input value to allow re-selection
    };

    const handleRemoveFileClick = (index: number) => {
        setDeleteFileIndex(index);
        setOpenDeleteDialog(true);
    };

    const handleConfirmRemoveFile = () => {
        if (deleteFileIndex !== null) {
            setFiles(prev => prev.filter((_, i) => i !== deleteFileIndex));
            setDeleteFileIndex(null);
            setOpenDeleteDialog(false);
        }
    };

    // Common Text Field Props to match other pages (rounded corners)
    const textFieldProps = {
        fullWidth: true,
        InputProps: { sx: { borderRadius: 2 } }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cat_folder) {
            showSnackbar('กรุณาเลือกหมวดหมู่เอกสาร', 'error');
            return;
        }
        if (!formData.factory) {
            showSnackbar('กรุณาเลือกโรงงาน', 'error');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();

            // Append basic fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'allow_datetime' || key === 'expire_datetime' || key === 'warning_datetime') {
                    if (value) {
                        data.append(key, (value as Dayjs).toISOString());
                    } else {
                        data.append(key, 'null');
                    }
                } else if (value !== null && value !== undefined) {
                    data.append(key, value as string);
                }
            });

            // Append expected_datetime if needed
            data.append('need_update', needUpdateStatus ? 'on' : 'off');
            data.append('inactive', isInactive ? 'on' : 'off');
            if (needUpdateStatus && expectedFinishDate) {
                data.append('expected_datetime', expectedFinishDate.toISOString());
            } else {
                data.append('expected_datetime', 'null');
            }

            // Append files
            files.forEach(file => {
                data.append('files', file);
            });

            const res = await fetch('/api/compliance', {
                method: 'POST',
                body: data
            });

            if (res.ok) {
                showSnackbar('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
                router.push('/compliance');
            } else {
                const result = await res.json();
                showSnackbar(result.error || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
            }
        } catch (err) {
            showSnackbar('เกิดข้อผิดพลาด', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="สร้างเอกสารใหม่">
            <Container maxWidth="xl" sx={{ p: 0 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                        <Box>
                            <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5, letterSpacing: '-0.5px' }}>
                                สร้างเอกสารใหม่
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                เพิ่มข้อมูลเอกสารและใบอนุญาตเข้าสู่ระบบ
                            </Typography>
                        </Box>
                    </Stack>

                    <form onSubmit={handleSubmit}>
                        {/* Main Layout */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>

                            {/* Left Column - Main Info */}
                            <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>

                                {/* General Information Card */}
                                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <SectionHeader icon={InfoCircle} title="ข้อมูลทั่วไป (General Info)" color={theme.palette.primary.main} />

                                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                                        <Box sx={{ gridColumn: '1 / -1' }}>
                                            <FormControl fullWidth required error={!formData.cat_folder}>
                                                <InputLabel>หมวดหมู่เอกสาร</InputLabel>
                                                <Select
                                                    value={formData.cat_folder}
                                                    label="หมวดหมู่เอกสาร"
                                                    onChange={(e) => {
                                                        const selected = categories.find(c => c.cat_folder === e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            cat_folder: e.target.value,
                                                            cat_name: selected ? selected.id.toString() : formData.cat_name
                                                        });
                                                    }}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    {categories.map((cat) => (
                                                        <MenuItem key={cat.id} value={cat.cat_folder}>{cat.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <TextField
                                            {...textFieldProps}
                                            label="ชื่อใบอนุญาต (License)"
                                            value={formData.license}
                                            onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                                        />
                                        <TextField
                                            {...textFieldProps}
                                            label="ทะเบียน/เลขที่ใบอนุญาต"
                                            value={formData.license_no}
                                            onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
                                        />
                                        <TextField
                                            {...textFieldProps}
                                            label="แบบ (Plan)"
                                            value={formData.plan}
                                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        />
                                        <TextField
                                            {...textFieldProps}
                                            label="สถานะการใช้งาน"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                    </Box>
                                </Paper>

                                {/* Location & Organization Card */}
                                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <SectionHeader icon={FolderOpen} title="สถานที่และหน่วยงาน" color="#f59e0b" />
                                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                                        <FormControl fullWidth required error={!formData.factory}>
                                            <InputLabel>โรงงาน</InputLabel>
                                            <Select
                                                value={formData.factory}
                                                label="โรงงาน"
                                                onChange={(e) => setFormData({ ...formData, factory: e.target.value })}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {factories.map((fac) => (
                                                    <MenuItem key={fac.id} value={fac.code_id}>{fac.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            {...textFieldProps}
                                            label="หน่วยงาน"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        />
                                        <Autocomplete
                                            freeSolo
                                            forcePopupIcon
                                            options={stateOptions}
                                            value={formData.document_state}
                                            onInputChange={(event, newInputValue) => {
                                                setFormData({ ...formData, document_state: newInputValue });
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="เอกสารอยู่ที่"
                                                    fullWidth
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        sx: { borderRadius: 2 }
                                                    }}
                                                />
                                            )}
                                        />
                                        <Autocomplete
                                            freeSolo
                                            forcePopupIcon
                                            options={receiveOptions}
                                            value={formData.document_receive}
                                            onInputChange={(event, newInputValue) => {
                                                setFormData({ ...formData, document_receive: newInputValue });
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="เอกสารที่ได้รับ"
                                                    fullWidth
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        sx: { borderRadius: 2 }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>
                                </Paper>

                                {/* Details Card */}
                                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <SectionHeader icon={Note} title="รายละเอียดและเอกสารแนบ" color="#8b5cf6" />
                                    <Stack spacing={2}>
                                        <TextField
                                            {...textFieldProps}
                                            multiline
                                            rows={3}
                                            label="วัตถุประสงค์"
                                            value={formData.objective}
                                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                        />

                                        <Box
                                            border="1px dashed"
                                            borderColor="divider"
                                            borderRadius={2}
                                            p={2}
                                            sx={{
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: 'all 0.2s',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) }
                                            }}
                                            component="label"
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                hidden
                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                                                onChange={handleFileChange}
                                            />
                                            <Avatar
                                                sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: 'primary.main',
                                                    width: 40,
                                                    height: 40
                                                }}
                                            >
                                                <DocumentUpload size="20" variant="Bulk" color={theme.palette.primary.main} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    อัพโหลดไฟล์แนบ
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    คลิกเพื่อเลือกไฟล์ (รูปภาพ, PDF, Office)
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {files.length > 0 && (
                                            <List dense>
                                                {files.map((file, index) => (
                                                    <ListItem
                                                        key={index}
                                                        secondaryAction={
                                                            <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFileClick(index)} color="error">
                                                                <Trash size="18" color={theme.palette.error.main} />
                                                            </IconButton>
                                                        }
                                                        sx={{
                                                            bgcolor: 'background.paper',
                                                            borderRadius: 2,
                                                            mb: 1,
                                                            border: '1px solid',
                                                            borderColor: 'divider'
                                                        }}
                                                    >
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                                                <Document size="16" variant="Bold" color={theme.palette.primary.main} />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={file.name}
                                                            secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
                                    </Stack>
                                </Paper>
                            </Stack>

                            {/* Right Column - Dates & Responsibility */}
                            <Stack spacing={3} sx={{ width: { xs: '100%', lg: '350px', xl: '400px' }, flexShrink: 0 }}>

                                {/* Dates Card */}
                                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <SectionHeader icon={Calendar} title="วันที่เกี่ยวข้อง" color="#10b981" />
                                    <Stack spacing={2}>
                                        <DatePicker
                                            label="วันที่อนุญาต"
                                            value={formData.allow_datetime}
                                            onChange={(newDate) => setFormData({ ...formData, allow_datetime: newDate })}
                                            slotProps={{ textField: { ...textFieldProps } }}
                                        />
                                        <DatePicker
                                            label="วันที่หมดอายุ"
                                            value={formData.expire_datetime}
                                            onChange={(newDate) => {
                                                const warningDate = newDate ? newDate.subtract(90, 'day') : null;
                                                setFormData({
                                                    ...formData,
                                                    expire_datetime: newDate,
                                                    warning_datetime: warningDate
                                                });
                                            }}
                                            slotProps={{ textField: { ...textFieldProps } }}
                                        />
                                        <DatePicker
                                            label="วันเดือนต่ออายุ (แจ้งเตือนล่วงหน้า 90 วัน)"
                                            value={formData.warning_datetime}
                                            onChange={(newDate) => setFormData({ ...formData, warning_datetime: newDate })}
                                            slotProps={{ textField: { ...textFieldProps } }}
                                        />
                                    </Stack>
                                </Paper>

                                {/* Responsibility Card */}
                                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <SectionHeader icon={Profile2User} title="ผู้รับผิดชอบ" color="#ec4899" />
                                    <Stack spacing={2}>
                                        <FormControl fullWidth>
                                            <InputLabel>ผู้รับผิดชอบ</InputLabel>
                                            <Select
                                                value={formData.responsible_person || ''}
                                                label="ผู้รับผิดชอบ"
                                                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {users.map((u) => (
                                                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth>
                                            <InputLabel>ผู้จัดเตรียมเอกสาร</InputLabel>
                                            <Select
                                                value={formData.document_preparer || ''}
                                                label="ผู้จัดเตรียมเอกสาร"
                                                onChange={(e) => setFormData({ ...formData, document_preparer: e.target.value })}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {users.map((u) => (
                                                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Paper>

                                {/* Status Update Card */}
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px dashed ${theme.palette.primary.main}` }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                                        สถานะและการติดตาม
                                    </Typography>

                                    <TextField
                                        {...textFieldProps}
                                        multiline
                                        rows={3}
                                        label="สถานะล่าสุด (Latest Remark)"
                                        value={formData.remark}
                                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                        sx={{ mb: 2, bgcolor: 'background.paper', ...textFieldProps.InputProps.sx }}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={needUpdateStatus}
                                                onChange={(e) => setNeedUpdateStatus(e.target.checked)}
                                                color="success"
                                            />
                                        }
                                        label={<Typography variant="body2" fontWeight={600}>จำเป็นต้องอัพเดตสถานะ</Typography>}
                                    />

                                    <Divider sx={{ my: 1 }} />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={isInactive}
                                                onChange={(e) => setIsInactive(e.target.checked)}
                                                color="error"
                                            />
                                        }
                                        label={<Typography variant="body2" fontWeight={600} color={isInactive ? "error" : "text.secondary"}>ยกเลิกเอกสาร (Cancel Document)</Typography>}
                                    />

                                    <Box mt={2}>
                                        <DatePicker
                                            label="วันที่คาดว่าจะแล้วเสร็จ"
                                            value={expectedFinishDate}
                                            onChange={(newDate) => setExpectedFinishDate(newDate)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                    sx: { bgcolor: 'background.paper', borderRadius: 2 },
                                                    InputProps: { sx: { borderRadius: 2 } }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Paper>
                            </Stack>
                        </Box>

                        {/* Buttons Footer */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<CloseCircle color={theme.palette.text.secondary} />}
                                onClick={() => router.back()}
                                size="large"
                                sx={{ borderRadius: 2, px: 4, borderColor: 'divider' }}
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save2 variant="Bold" />}
                                size="large"
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    px: 4,
                                    boxShadow: '0 8px 20px -8px rgba(99, 102, 241, 0.6)',
                                    '&:hover': { boxShadow: '0 12px 24px -10px rgba(99, 102, 241, 0.8)' }
                                }}
                            >
                                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                            </Button>
                        </Box>

                    </form>
                </LocalizationProvider>
            </Container>
        </DashboardLayout>
    );
}
