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
    Chip,
    Stack,
    CircularProgress,
    alpha,
    useTheme,
    Collapse,
    TablePagination,
    Tooltip,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    SearchNormal1,
    DocumentText,
    ArrowDown2,
    ArrowUp2,
    TaskSquare,
    Filter
} from 'iconsax-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from 'next-auth/react';
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

export default function MyActivitiesContent({ type }: { type: 'responsible' | 'preparer' }) {
    const theme = useTheme();
    const { data: session } = useSession();
    const [compliances, setCompliances] = useState<Compliance[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [categories, setCategories] = useState<any[]>([]);
    const [factories, setFactories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFactory, setSelectedFactory] = useState('all');

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, [type, session]);

    const fetchMasters = async () => {
        try {
            const [catRes, factRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/status-master?type=Factory')
            ]);
            if (catRes.ok) setCategories(await catRes.json());
            if (factRes.ok) setFactories(await factRes.json());
        } catch (error) {
            console.error("Fetch masters error:", error);
        }
    };

    const fetchData = async () => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/my-activities?type=${type}`);
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

    const filteredCompliances = compliances.filter(item => {
        const matchesSearch = item.license?.toLowerCase().includes(search.toLowerCase()) ||
            item.cat_name?.toLowerCase().includes(search.toLowerCase()) ||
            item.license_no?.toLowerCase().includes(search.toLowerCase()) ||
            item.category_description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || item.cat_name === selectedCategory;
        const matchesFactory = selectedFactory === 'all' || item.factory === selectedFactory;

        return matchesSearch && matchesCategory && matchesFactory;
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
        const isInactive = row.inactive === 'on';

        return (
            <>
                <TableRow hover sx={{ '& > *': { borderBottom: 'unset' }, opacity: isInactive ? 0.6 : 1 }}>
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
        <DashboardLayout title={type === 'responsible' ? "งานที่รับผิดชอบ" : "ผู้จัดเตรียมเอกสาร"}>
            <Container maxWidth="xl" sx={{ p: 0 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                            <TaskSquare size="28" variant="Bold" color={theme.palette.primary.main} />
                            <Typography variant="h5" fontWeight="800">
                                {type === 'responsible' ? "งานที่รับผิดชอบ (Responsible)" : "งานที่จัดเตรียมเอกสาร (Preparer)"}
                            </Typography>
                        </Stack>
                        <Typography variant="body1" color="text.secondary">
                            แสดงรายการเอกสารที่คุณเป็น{type === 'responsible' ? "ผู้รับผิดชอบ" : "ผู้จัดเตรียมเอกสาร"} — {session?.user?.name || ''}
                        </Typography>
                    </Box>
                </Stack>

                <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        alignItems: 'center'
                    }}>
                        <Box sx={{ flex: { xs: '1 1 auto', md: 4 }, width: '100%' }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="ค้นหาใบอนุญาต, เลขที่ใบอนุญาต..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchNormal1 variant="TwoTone" size={20} color={theme.palette.primary.main} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 auto', md: 3.5 }, width: '100%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="category-filter-label">หมวดหมู่</InputLabel>
                                <Select
                                    labelId="category-filter-label"
                                    value={selectedCategory}
                                    label="หมวดหมู่"
                                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="all">ทั้งหมด (ทุกหมวดหมู่)</MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name} {cat.description}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 auto', md: 3.5 }, width: '100%' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="factory-filter-label">โรงงาน</InputLabel>
                                <Select
                                    labelId="factory-filter-label"
                                    value={selectedFactory}
                                    label="โรงงาน"
                                    onChange={(e) => { setSelectedFactory(e.target.value); setPage(0); }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="all">ทั้งหมด (ทุกโรงงาน)</MenuItem>
                                    {factories.map((fact) => (
                                        <MenuItem key={fact.id} value={fact.name}>
                                            {fact.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '0 0 auto', md: 1 }, textAlign: 'right' }}>
                            <Tooltip title="ล้างการกรอง">
                                <IconButton
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedCategory('all');
                                        setSelectedFactory('all');
                                        setPage(0);
                                    }}
                                    sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                                >
                                    <Filter size={20} variant="Bulk" color={theme.palette.error.main} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Paper>

                <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Box sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {type === 'responsible' ? 'รายการที่คุณเป็นผู้รับผิดชอบ' : 'รายการที่คุณเป็นผู้จัดเตรียมเอกสาร'}
                            {' | '}
                            หน้า {page + 1} จาก {Math.max(1, Math.ceil(filteredCompliances.length / rowsPerPage))}
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
                                            {type === 'responsible'
                                                ? 'ไม่พบรายการที่คุณเป็นผู้รับผิดชอบ'
                                                : 'ไม่พบรายการที่คุณเป็นผู้จัดเตรียมเอกสาร'
                                            }
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
        </DashboardLayout>
    );
}
