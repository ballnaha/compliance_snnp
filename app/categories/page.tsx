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
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
    SearchNormal1,
    AddCircle,
    Edit2,
    Trash,
    Folder2,
    More
} from 'iconsax-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSnackbar } from '@/components/SnackbarProvider';

interface Category {
    id: string;
    name: string;
    cat_folder: string;
    description: string | null;
    created_at: string;
}

export default function CategoriesPage() {
    const { showSnackbar, confirm } = useSnackbar();
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        cat_folder: '',
        description: '',
        schedule_date: dayjs() as Dayjs | null
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (res.ok) {
                setCategories(data);
            } else {
                showSnackbar(data.error || 'Failed to load categories', 'error');
            }
        } catch (err) {
            showSnackbar('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (cat?: Category) => {
        if (cat) {
            setEditMode(true);
            setSelectedId(cat.id);
            setFormData({
                name: cat.name,
                cat_folder: cat.cat_folder,
                description: cat.description || '',
                schedule_date: cat.created_at ? dayjs(cat.created_at) : null
            });
        } else {
            setEditMode(false);
            setFormData({ name: '', cat_folder: '', description: '', schedule_date: dayjs() });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editMode ? `/api/categories/${selectedId}` : '/api/categories';
            const method = editMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showSnackbar(editMode ? 'อัปเดตหมวดหมู่เรียบร้อยแล้ว' : 'สร้างหมวดหมู่เรียบร้อยแล้ว', 'success');
                handleClose();
                fetchCategories();
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
            message: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่พื้นฐานนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
            confirmText: 'ลบหมวดหมู่',
            severity: 'error'
        });

        if (!ok) return;

        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showSnackbar('Category deleted', 'success');
                fetchCategories();
            } else {
                showSnackbar('Failed to delete', 'error');
            }
        } catch (err) {
            showSnackbar('Error deleting category', 'error');
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.cat_folder.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout title="จัดการหมวดหมู่">
            <Container maxWidth="xl" sx={{ p: 0 }}>
                {/* Header */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4}>
                    <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5, letterSpacing: '-1px' }}>
                            จัดการหมวดหมู่
                        </Typography>
                        <Typography color="text.secondary" fontWeight={400}>
                            จัดการโฟลเดอร์เอกสารและหมวดหมู่ต่างๆ ในระบบ
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddCircle variant="Bold" color="white" />}
                        size="large"
                        onClick={() => handleOpen()}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Add Category
                    </Button>
                </Stack>

                {/* List Table */}
                <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <TextField
                            placeholder="ค้นหาหมวดหมู่หรือโฟลเดอร์..."
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
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 2 }}>ชื่อหมวดหมู่</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>รหัสหมวดหมู่</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>คำอธิบาย</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>สร้างเมื่อ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <CircularProgress size={40} thickness={4} />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <Typography color="text.secondary">ไม่พบหมวดหมู่ที่ค้นหา</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((cat) => (
                                        <TableRow key={cat.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box sx={{
                                                        p: 1.25,
                                                        borderRadius: 2.5,
                                                        bgcolor: '#fff7ed',
                                                        color: '#f59e0b',
                                                        display: 'flex'
                                                    }}>
                                                        <Folder2 size="20" variant="Bulk" color="#f59e0b" />
                                                    </Box>
                                                    <Typography variant="body2" fontWeight="700">{cat.name}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                                    {cat.cat_folder}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                                    {cat.description || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {dayjs(cat.created_at).format('DD/MM/YYYY')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <IconButton size="small" onClick={() => handleOpen(cat)} sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#6366f1', color: 'white' } }}>
                                                        <Edit2 size="18" variant="Bold" color="currentColor" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(cat.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}>
                                                        <Trash size="18" variant="Bold" color="currentColor" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editMode ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <TextField
                                label="ชื่อหมวดหมู่"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="เช่น เอกสารทางกฎหมาย"
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                            <TextField
                                label="รหัสหมวดหมู่"
                                fullWidth
                                required
                                value={formData.cat_folder}
                                onChange={(e) => setFormData({ ...formData, cat_folder: e.target.value })}
                                placeholder="เช่น legal-docs"
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                            <TextField
                                label="คำอธิบาย"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="คำอธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้..."
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                            <DatePicker
                                label="วันที่เริ่มต้นใช้งาน"
                                format="DD/MM/YYYY"
                                value={formData.schedule_date}
                                onChange={(newValue) => setFormData({ ...formData, schedule_date: newValue })}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        InputProps: { sx: { borderRadius: 2 } }
                                    }
                                }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>ยกเลิก</Button>
                        <Button type="submit" variant="contained" sx={{ borderRadius: 2, px: 4 }}>
                            {editMode ? 'อัปเดต' : 'สร้าง'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}
