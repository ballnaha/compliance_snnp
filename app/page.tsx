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
  Element3,
  Filter,
  TickCircle
} from 'iconsax-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from 'next-auth/react';
import dayjs, { Dayjs } from 'dayjs';
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

export default function DashboardContent() {
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
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | '1month' | '2month' | '3month'>('all');
  const [expiryDateFrom, setExpiryDateFrom] = useState<Dayjs | null>(null);
  const [expiryDateTo, setExpiryDateTo] = useState<Dayjs | null>(null);
  const isInvalidDateRange = !!expiryDateFrom && !!expiryDateTo && !expiryDateTo.isAfter(expiryDateFrom, 'day');

  const baseFiltered = compliances.filter(item => {
    const matchesSearch = !search || (
      item.license?.toLowerCase().includes(search.toLowerCase()) ||
      item.cat_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.license_no?.toLowerCase().includes(search.toLowerCase()) ||
      item.category_description?.toLowerCase().includes(search.toLowerCase())
    );
    const matchesCategory = selectedCategory === 'all' || item.cat_name === selectedCategory;
    const matchesFactory = selectedFactory === 'all' || item.factory === selectedFactory;
    return matchesSearch && matchesCategory && matchesFactory;
  });

  const stats = {
    expired: baseFiltered.filter(c => c.expire_datetime && dayjs(c.expire_datetime).isBefore(dayjs(), 'day')).length,
    oneMonth: baseFiltered.filter(c => {
      if (!c.expire_datetime) return false;
      const diff = dayjs(c.expire_datetime).diff(dayjs(), 'day');
      return diff >= 0 && diff <= 30;
    }).length,
    twoMonth: baseFiltered.filter(c => {
      if (!c.expire_datetime) return false;
      const diff = dayjs(c.expire_datetime).diff(dayjs(), 'day');
      return diff >= 0 && diff <= 60;
    }).length,
    threeMonth: baseFiltered.filter(c => {
      if (!c.expire_datetime) return false;
      const diff = dayjs(c.expire_datetime).diff(dayjs(), 'day');
      return diff >= 0 && diff <= 90;
    }).length,
    all: baseFiltered.length
  };

  useEffect(() => {
    if (session) {
      fetchData();
      fetchMasters();
    }
  }, [!!session]);

  const fetchMasters = async () => {
    try {
      const catIdParam = session?.user && (session.user as any).cat_id ? `?cat_id=${(session.user as any).cat_id}` : '';
      const factoryParam = session?.user && (session.user as any).factories ? `&factories=${(session.user as any).factories}` : '';

      const [catRes, factRes] = await Promise.all([
        fetch(`/api/categories${catIdParam}`),
        fetch(`/api/status-master?type=Factory${factoryParam}`)
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
      // Dashboard gets all compliance data but filters listed categories by user rights
      const catIdParam = (session.user as any).cat_id ? `?cat_id=${(session.user as any).cat_id}` : '';
      const res = await fetch(`/api/compliance${catIdParam}`);
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

  const getExpiryFilterTitle = () => {
    switch (expiryFilter) {
      case 'expired': return 'รายการที่ใบอนุญาตหมดอายุไปแล้ว';
      case '1month': return 'รายการที่จะหมดอายุภายใน 1 เดือน';
      case '2month': return 'รายการที่จะหมดอายุภายใน 2 เดือน';
      case '3month': return 'รายการที่จะหมดอายุภายใน 3 เดือน';
      default: return '';
    }
  };

  const filteredCompliances = compliances.filter(item => {
    const matchesSearch = !search || (
      item.license?.toLowerCase().includes(search.toLowerCase()) ||
      item.cat_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.license_no?.toLowerCase().includes(search.toLowerCase()) ||
      item.category_description?.toLowerCase().includes(search.toLowerCase())
    );

    const matchesCategory = selectedCategory === 'all' || item.cat_name === selectedCategory;
    const matchesFactory = selectedFactory === 'all' || item.factory === selectedFactory;

    let matchesExpiry = true;
    const diff = item.expire_datetime ? dayjs(item.expire_datetime).diff(dayjs(), 'day') : null;
    const expireDate = item.expire_datetime ? dayjs(item.expire_datetime).startOf('day') : null;

    if (expiryFilter === 'expired') {
      matchesExpiry = diff !== null && diff < 0;
    } else if (expiryFilter === '1month') {
      matchesExpiry = diff !== null && diff >= 0 && diff <= 30;
    } else if (expiryFilter === '2month') {
      matchesExpiry = diff !== null && diff >= 0 && diff <= 60;
    } else if (expiryFilter === '3month') {
      matchesExpiry = diff !== null && diff >= 0 && diff <= 90;
    }

    const fromDate = expiryDateFrom ? expiryDateFrom.startOf('day') : null;
    const toDate = expiryDateTo ? expiryDateTo.endOf('day') : null;

    const matchesFromDate = !fromDate || (!!expireDate && !expireDate.isBefore(fromDate));
    const matchesToDate = !toDate || (!!expireDate && !expireDate.isAfter(toDate));
    const matchesExpiryRange = !isInvalidDateRange && matchesFromDate && matchesToDate;

    return matchesSearch && matchesCategory && matchesFactory && matchesExpiry && matchesExpiryRange;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  function StatCard({ title, count, color, filterValue, isSelected, textColor = '#ffffff' }: any) {
    const isSomeSelected = expiryFilter !== 'all';
    const effectivelySelected = isSelected || (!isSomeSelected && filterValue === 'all');

    return (
      <Paper
        onClick={() => setExpiryFilter(filterValue)}
        sx={{
          p: 3,
          bgcolor: color,
          color: textColor,
          borderRadius: 2.5,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          border: effectivelySelected ? '3px solid #ffffff' : '3px solid transparent',
          transform: effectivelySelected ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: effectivelySelected
            ? `0 20px 25px -5px ${alpha(color, 0.5)}, 0 10px 10px -5px ${alpha(color, 0.3)}`
            : '0 4px 12px rgba(0,0,0,0.05)',
          opacity: isSomeSelected && !isSelected ? 0.6 : 1,
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 20px 25px -5px ${alpha(color, 0.4)}`,
            opacity: 1
          },
          '&::before': effectivelySelected ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none'
          } : {}
        }}
      >
        {effectivelySelected && (
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <TickCircle variant="Bold" size="24" color={textColor} />
          </Box>
        )}
        <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, opacity: 0.9, fontSize: '0.9rem', pr: 4 }}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h4" fontWeight="800">
            {count}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>
            รายการ
          </Typography>
        </Stack>
      </Paper>
    );
  }

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
          <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, minWidth: 120 }}>
            {row.allow_datetime ? dayjs(row.allow_datetime).format('DD MMM BBBB') : '-'}
          </TableCell>
          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, minWidth: 120 }}>
            {row.expire_datetime ? dayjs(row.expire_datetime).format('DD MMM BBBB') : '-'}
          </TableCell>
          <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, minWidth: 120 }}>
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
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">โรงงาน</Typography>
                    <Typography variant="body2">{row.factory || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">ทะเบียน/ใบอนุญาต</Typography>
                    <Typography variant="body2">{row.license_no || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">แบบ (Plan)</Typography>
                    <Typography variant="body2">{row.plan || '-'}</Typography>
                  </Box>
                  <Box>
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
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary" display="block">ไฟล์แนบ (Attachment)</Typography>
                    {row.file ? (
                      <Button
                        variant="outlined"
                        size="small"
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
    <DashboardLayout title="Dashboard">
      <Container maxWidth="xl" sx={{ p: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
              <Element3 size="28" variant="Bold" color={theme.palette.primary.main} />
              <Typography variant="h5" fontWeight="800">
                Dashboard
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              ภาพรวมเอกสาร Compliance ทั้งหมดในหมวดหมู่ที่คุณได้รับอนุญาต
            </Typography>
          </Box>
        </Stack>

        {/* Dashboard Stats Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 4
        }}>
          <StatCard
            title="ใบอนุญาตหมดอายุไปแล้ว"
            count={stats.expired}
            color="#1e293b"
            filterValue="expired"
            isSelected={expiryFilter === 'expired'}
          />
          <StatCard
            title="ใบอนุญาตจะหมดอายุในอีก 1 เดือน"
            count={stats.oneMonth}
            color="#ff0000"
            filterValue="1month"
            isSelected={expiryFilter === '1month'}
          />
          <StatCard
            title="ใบอนุญาตจะหมดอายุในอีก 2 เดือน"
            count={stats.twoMonth}
            color="#f59e0b"
            filterValue="2month"
            isSelected={expiryFilter === '2month'}
          />
          <StatCard
            title="ใบอนุญาตจะหมดอายุในอีก 3 เดือน"
            count={stats.threeMonth}
            color="#ffff00"
            textColor="#000000"
            filterValue="3month"
            isSelected={expiryFilter === '3month'}
          />
          <StatCard
            title="ใบอนุญาตทั้งหมด"
            count={stats.all}
            color="#14b8a6"
            filterValue="all"
            isSelected={expiryFilter === 'all'}
          />
        </Box>

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
                  <MenuItem value="all">ทั้งหมด (ที่ได้รับอนุญาต)</MenuItem>
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
                  <MenuItem value="all">ทั้งหมด (ที่ได้รับอนุญาต)</MenuItem>
                  {factories.map((fact) => (
                    <MenuItem key={fact.id} value={fact.name}>
                      {fact.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 auto', md: 2.5 }, width: '100%' }}>
              <DatePicker
                label="หมดอายุจากวันที่"
                value={expiryDateFrom}
                format="DD/MM/YYYY"
                onChange={(newValue) => {
                  setExpiryDateFrom(newValue);
                  if (newValue && expiryDateTo && !expiryDateTo.isAfter(newValue, 'day')) {
                    setExpiryDateTo(null);
                  }
                  setPage(0);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 auto', md: 2.5 }, width: '100%' }}>
              <DatePicker
                label="หมดอายุถึงวันที่"
                value={expiryDateTo}
                format="DD/MM/YYYY"
                minDate={expiryDateFrom ? expiryDateFrom.add(1, 'day') : undefined}
                onChange={(newValue) => { setExpiryDateTo(newValue); setPage(0); }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    error: isInvalidDateRange,
                    helperText: isInvalidDateRange ? 'วันสิ้นสุดต้องมากกว่าวันเริ่มต้น' : '',
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: { xs: '0 0 auto', md: 1 }, textAlign: 'right' }}>
              <Tooltip title="ล้างการกรอง">
                <IconButton
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                    setSelectedFactory('all');
                    setExpiryFilter('all');
                    setExpiryDateFrom(null);
                    setExpiryDateTo(null);
                    setPage(0);
                  }}
                  sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: theme.palette.error.main }}
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
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1
          }}>
            <Box>
              {expiryFilter !== 'all' && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: expiryFilter === 'expired' ? '#1e293b' :
                      expiryFilter === '1month' ? '#ff0000' :
                        expiryFilter === '2month' ? '#f59e0b' :
                          expiryFilter === '3month' ? '#ffff00' : 'transparent'
                  }} />
                  <Typography variant="subtitle2" fontWeight="700" color="primary">
                    กำลังแสดง: {getExpiryFilterTitle()}
                  </Typography>
                </Stack>
              )}
              {(expiryDateFrom || expiryDateTo) && (
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'primary.main', fontWeight: 600 }}>
                  ช่วงวันหมดอายุ: {expiryDateFrom ? expiryDateFrom.format('DD/MM/YYYY') : '...'} - {expiryDateTo ? expiryDateTo.format('DD/MM/YYYY') : '...'}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                รายการความสอดคล้องทั้งหมด (ตามหมวดหมู่ที่ได้รับสิทธิ์)
                {' | '}
                หน้า {page + 1} จาก {Math.max(1, Math.ceil(filteredCompliances.length / rowsPerPage))}
              </Typography>
            </Box>
            {filteredCompliances.length > 0 && (
              <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), px: 1.5, py: 0.5, borderRadius: 10 }}>
                ทั้งหมด {filteredCompliances.length} รายการ
              </Typography>
            )}
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#1e293b' }}>
                <TableRow>
                  <TableCell width={50} />
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', md: 'table-cell' } }}>หมวดหมู่</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white' }}>ใบอนุญาต</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', lg: 'table-cell' } }}>วันที่อนุญาต</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', sm: 'table-cell' } }}>วันที่หมดอายุ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', lg: 'table-cell' } }}>วันเตือนต่ออายุ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', lg: 'table-cell' } }}>แบบ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', md: 'table-cell' } }}>โรงงาน</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', md: 'table-cell' } }}>ทะเบียน/ใบอนุญาต</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white', display: { xs: 'none', lg: 'table-cell' } }}>หน่วยงาน</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'white' }}>สถานะ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
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
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      ไม่พบรายการในหมวดหมู่ที่ท่านได้รับสิทธิ์
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
