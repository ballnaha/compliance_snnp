"use client";

import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    InputAdornment,
    TextField,
    Button,
    Chip,
    Stack,
    CircularProgress,
    alpha,
    useTheme,
    Avatar,
    Collapse,
    TablePagination,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    FormControl,
    Select,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tabs,
    Tab
} from '@mui/material';
import {
    SearchNormal1,
    AddCircle,
    Edit2,
    Trash,
    DocumentText,
    ArrowDown2,
    ArrowUp2,
    More
} from 'iconsax-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/components/SnackbarProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface Compliance {
    id: number;
    cat_name: string;
    cat_folder: string;
    license: string;
    license_no: string;
    department: string;
    expire_datetime: string;
    allow_datetime: string;
    warning_datetime: string;
    status: string;
    plan: string;
    factory: string;
    responsible_person: string;
    document_preparer: string;
    document_receive: string;
    document_state: string;
    objective: string;
    remark: string;
    file?: string;
    category_description?: string;
    inactive?: string;
}

export default function CompliancePage() {
    const router = useRouter();
    const theme = useTheme();
    const { data: session } = useSession();
    const userCatId = (session?.user as any)?.cat_id || '';
    const userFactories = (session?.user as any)?.factories || '';
    const userRole = (session?.user as any)?.role || '';
    const canEdit = userRole !== 'view';
    const [compliances, setCompliances] = useState<Compliance[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Delete Confirmation
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        fetchCompliances();
        fetchCategories();
    }, [userCatId, userFactories]);

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const res = await fetch(`/api/compliance?id=${itemToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                showSnackbar('ลบข้อมูลเรียบร้อยแล้ว', 'success');
                fetchCompliances();
            } else {
                showSnackbar('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            showSnackbar('Error deleting compliance', 'error');
        } finally {
            setOpenDeleteDialog(false);
            setItemToDelete(null);
        }
    };

    const fetchCategories = async () => {
        try {
            const url = userCatId ? `/api/categories?cat_id=${userCatId}` : '/api/categories';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCompliances = async () => {
        try {
            const params = new URLSearchParams();
            if (userCatId) params.set('cat_id', userCatId);
            if (userFactories) params.set('factories', userFactories);
            params.set('show_inactive', 'true');
            const qs = params.toString();
            const url = qs ? `/api/compliance?${qs}` : '/api/compliance';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCompliances(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ยืนยันการลบข้อมูล?')) return;
        try {
            const res = await fetch(`/api/compliance?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCompliances();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredCompliances = compliances.filter(item => {
        const matchesSearch = item.license?.toLowerCase().includes(search.toLowerCase()) ||
            item.cat_name?.toLowerCase().includes(search.toLowerCase()) ||
            item.license_no?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory ? item.cat_folder === selectedCategory : true;

        let matchesStatus = true;
        const isInactive = item.inactive === 'on';
        if (tabValue === 0) {
            matchesStatus = !isInactive;
        } else {
            matchesStatus = isInactive;
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    function Row({ row }: { row: Compliance }) {
        const [open, setOpen] = useState(false);
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

        const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
            setAnchorEl(event.currentTarget);
        };

        const handleMenuClose = () => {
            setAnchorEl(null);
        };

        return (
            <>
                <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <ArrowUp2 size="16" variant="Bold" color="#6366f1" /> : <ArrowDown2 size="16" variant="Bold" color="#6366f1" />}
                        </IconButton>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Tooltip
                            title={row.category_description || row.cat_name || ''}
                            arrow
                            placement="top"
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        fontSize: '0.9rem',
                                        p: 1.5,
                                        maxWidth: 400,
                                        bgcolor: 'rgba(0,0,0,0.85)'
                                    }
                                }
                            }}
                        >
                            <Chip
                                label={row.cat_name}
                                size="small"
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    borderRadius: 1.5
                                }}
                            />
                        </Tooltip>
                    </TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">

                            <Typography variant="body2" fontWeight={600}>{row.license}</Typography>
                        </Stack>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {row.allow_datetime ? dayjs(row.allow_datetime).format('DD MMM BBBB') : '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {row.expire_datetime ? dayjs(row.expire_datetime).format('DD MMM BBBB') : '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {row.warning_datetime ? dayjs(row.warning_datetime).format('DD MMM BBBB') : '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{row.plan || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.factory || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.license_no || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{row.department || '-'}</TableCell>
                    <TableCell>
                        {row.status && (
                            <Chip
                                label={row.status}
                                size="small"
                                color={row.status === 'Inactive' ? 'default' : 'success'}
                                variant="outlined"
                                sx={{
                                    borderRadius: 1.5,
                                    fontWeight: 600,
                                    height: 'auto',
                                    '& .MuiChip-label': {
                                        display: 'block',
                                        whiteSpace: 'normal',
                                        maxWidth: 150
                                    },
                                    py: 0.5
                                }}
                            />
                        )}
                    </TableCell>
                    {canEdit && (
                        <TableCell>
                            <IconButton size="small" onClick={handleMenuOpen}>
                                <More size="18" color={theme.palette.text.secondary} />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                PaperProps={{
                                    sx: {
                                        minWidth: 140,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        mt: 0.5
                                    }
                                }}
                            >
                                {canEdit && (
                                    <MenuItem onClick={() => { handleMenuClose(); router.push(`/compliance/edit/${row.id}`); }}>
                                        <ListItemIcon>
                                            <Edit2 size="18" variant="Bold" color={theme.palette.primary.main} />
                                        </ListItemIcon>
                                        <ListItemText primary="แก้ไข" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                                    </MenuItem>
                                )}
                                {canEdit && (
                                    <MenuItem onClick={() => { handleMenuClose(); handleDeleteClick(row.id.toString()); }}>
                                        <ListItemIcon>
                                            <Trash size="18" variant="Bold" color={theme.palette.error.main} />
                                        </ListItemIcon>
                                        <ListItemText primary="ลบ" primaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'error.main' }} />
                                    </MenuItem>
                                )}
                            </Menu>
                        </TableCell>
                    )}
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
                                    รายละเอียดเพิ่มเติม (Additional Details)
                                </Typography>

                                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>หมวดหมู่ (Category)</Typography>
                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                        {row.category_description || row.cat_name || '-'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mt: 1 }}>
                                    {/* Mobile-only visible details */}
                                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">โรงงาน</Typography>
                                        <Typography variant="body2">{row.factory || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">ทะเบียน/ใบอนุญาต</Typography>
                                        <Typography variant="body2">{row.license_no || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">วันที่อนุญาต</Typography>
                                        <Typography variant="body2">{row.allow_datetime ? dayjs(row.allow_datetime).format('DD MMM BBBB') : '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">วันเตือนต่ออายุ</Typography>
                                        <Typography variant="body2">{row.warning_datetime ? dayjs(row.warning_datetime).format('DD MMM BBBB') : '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">แบบ (Plan)</Typography>
                                        <Typography variant="body2">{row.plan || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">หน่วยงาน</Typography>
                                        <Typography variant="body2">{row.department || '-'}</Typography>
                                    </Box>

                                    {/* Standard Details */}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">ผู้รับผิดชอบ</Typography>
                                        <Typography variant="body2">{row.responsible_person || '-'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">ผู้จัดเตรียมเอกสาร</Typography>
                                        <Typography variant="body2">{row.document_preparer || '-'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">ผู้รับเอกสาร</Typography>
                                        <Typography variant="body2">{row.document_receive || '-'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">เอกสารอยู่ที่</Typography>
                                        <Typography variant="body2">{row.document_state || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">วัตถุประสงค์</Typography>
                                        <Typography variant="body2">{row.objective || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">หมายเหตุ</Typography>
                                        <Typography variant="body2">{row.remark || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">ไฟล์แนบ (Attachment)</Typography>
                                        {row.file ? (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<DocumentText size="18" variant="Bold" color="#6366f1" />}
                                                href={`/uploads/${row.file}`}
                                                target="_blank"
                                                sx={{ mt: 1, borderRadius: 1.5, textTransform: 'none' }}
                                            >
                                                {row.file}
                                            </Button>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </>
        );
    }

    return (
        <DashboardLayout title="รายการ Compliance">
            <Container maxWidth="xl" sx={{ p: 0 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
                    <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>
                            รายการเอกสาร (Compliance List)
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            จัดการรายการใบอนุญาตและเอกสาร Compliance ทั้งหมด
                        </Typography>
                    </Box>
                    {canEdit && (
                        <Button
                            variant="contained"
                            startIcon={<AddCircle variant="Bold" />}
                            onClick={() => router.push('/compliance/create')}
                            sx={{ boxShadow: '0 8px 20px -8px rgba(99, 102, 241, 0.6)' }}
                        >
                            สร้างเอกสารใหม่
                        </Button>
                    )}
                </Stack>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); setPage(0); }} aria-label="compliance tabs">
                        <Tab label="เอกสารใช้งาน (Active)" />
                        <Tab label="เอกสารยกเลิก (Cancelled)" />
                    </Tabs>
                </Box>

                <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 250 }}>
                            <InputLabel id="category-filter-label">กรองหมวดหมู่</InputLabel>
                            <Select
                                labelId="category-filter-label"
                                value={selectedCategory}
                                label="กรองหมวดหมู่"
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>ทั้งหมด (All)</em>
                                </MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.cat_folder}>
                                        {cat.name} {cat.description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="ค้นหาเอกสาร (ชื่อใบอนุญาต, หมวดหมู่, เลขที่ใบอนุญาต)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchNormal1 variant="TwoTone" color={theme.palette.text.secondary} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                            }}
                        />
                    </Stack>
                </Paper>

                <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    {/* Page Info */}
                    <Box sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            หน้า {page + 1} จาก {Math.ceil(filteredCompliances.length / rowsPerPage)}
                            {filteredCompliances.length > 0 && (
                                <span> | แสดง {Math.min((page + 1) * rowsPerPage, filteredCompliances.length)} จาก {filteredCompliances.length} รายการ</span>
                            )}
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1e293b' }}>
                                <TableRow>
                                    <TableCell width={50} />
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>หมวดหมู่</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>ใบอนุญาต</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', minWidth: 120, display: { xs: 'none', lg: 'table-cell' } }}>วันที่อนุญาต</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', minWidth: 120, display: { xs: 'none', sm: 'table-cell' } }}>วันที่หมดอายุ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', minWidth: 120, display: { xs: 'none', lg: 'table-cell' } }}>วันเตือนต่ออายุ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', minWidth: 100, display: { xs: 'none', lg: 'table-cell' } }}>แบบ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', minWidth: 100, display: { xs: 'none', md: 'table-cell' } }}>โรงงาน</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', minWidth: 100, display: { xs: 'none', md: 'table-cell' } }}>ทะเบียน/ใบอนุญาต</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', display: { xs: 'none', lg: 'table-cell' } }}>หน่วยงาน</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>สถานะ</TableCell>
                                    {canEdit && <TableCell sx={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>จัดการ</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCompliances.length > 0 ? (
                                    filteredCompliances
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((row) => (
                                            <Row key={row.id} row={row} />
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            ไม่พบข้อมูลเอกสาร
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredCompliances.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="แสดงแถวต่อหน้า:"
                    />
                </Paper>
            </Container>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>ยืนยันการลบข้อมูล</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenDeleteDialog(false)} sx={{ borderRadius: 2 }}>ยกเลิก</Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        autoFocus
                        startIcon={<Trash variant="Bold" />}
                        sx={{ borderRadius: 2 }}
                    >
                        ลบข้อมูล
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
