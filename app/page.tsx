"use client";

import { useState } from 'react';
import { signOut, useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Paper,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  SearchNormal1,
  AddCircle,
  Folder2,
  More,
  Element3,
  DocumentText,
  Clock,
  ProfileCircle,
  TickCircle,
  CloseCircle,
  Timer,
  Eye,
  Logout
} from 'iconsax-react';
import { CATEGORIES, RECENT_DOCUMENTS } from './data';

import DashboardLayout from '@/components/DashboardLayout';

export default function Home() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip icon={<TickCircle size="16" color="#10b981" />} label="ใช้งานอยู่" color="success" size="small" variant="outlined" sx={{ bgcolor: 'success.lighter', fontWeight: 600 }} />;
      case 'pending':
        return <Chip icon={<Timer size="16" color="#f59e0b" />} label="รออนุมัติ" color="warning" size="small" variant="outlined" sx={{ bgcolor: 'warning.lighter', fontWeight: 600 }} />;
      case 'expired':
        return <Chip icon={<CloseCircle size="16" color="#ef4444" />} label="หมดอายุ" color="error" size="small" variant="outlined" sx={{ bgcolor: 'error.lighter', fontWeight: 600 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ p: 0 }}>
        {/* Page Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5, letterSpacing: '-1px' }}>
              แดชบอร์ดความสอดคล้อง
            </Typography>
            <Typography color="text.secondary" fontWeight={500}>
              จัดการความสอดคล้องของเอกสารและหมวดหมู่ต่างๆ อย่างมีประสิทธิภาพ
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddCircle variant="Bold" color="white" />} size="large" sx={{ borderRadius: 3, px: 3 }}>
            อัปโหลดเอกสาร
          </Button>
        </Stack>

        {/* Stats / Categories */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mb: 5
          }}
        >
          {CATEGORIES.map((cat) => (
            <Box
              key={cat.id}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(25% - 24px)' },
                minWidth: 200
              }}
            >
              <Card sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: 2,
                border: '1px solid transparent',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                  borderColor: cat.color + '30'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: "14px",
                      bgcolor: `${cat.color}15`,
                      color: cat.color,
                      display: 'flex'
                    }}>
                      <cat.icon variant="Bulk" size="26" color={cat.color} />
                    </Box>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                      {cat.count}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle1" fontWeight="800" mb={0.5}>{cat.name}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{cat.description}</Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Search & List */}
        <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="ค้นหาเอกสาร, รหัส หรือชื่อผู้เขียน..."
                fullWidth
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchNormal1 size="18" color="#64748b" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: '#f8fafc', '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: 'divider' } }
                }}
              />
              <IconButton sx={{ bgcolor: '#f8fafc', borderRadius: 3, p: 1 }}><More color="#6366f1" /></IconButton>
            </Stack>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 2 }}>ชื่อเอกสาร</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>หมวดหมู่</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>สถานะ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>อัปเดตเมื่อ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ผู้เขียน</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {RECENT_DOCUMENTS.map((doc) => (
                  <TableRow key={doc.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1.25,
                          borderRadius: 2.5,
                          bgcolor: '#f1f5f9',
                          color: '#475569',
                          display: 'flex'
                        }}>
                          <DocumentText size="20" variant="Bulk" color="#6366f1" />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="700" color="text.primary">{doc.title}</Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>{doc.size}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" color="text.secondary">{doc.category}</Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(doc.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>{doc.updatedAt}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          bgcolor: 'primary.main',
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                        }}>{doc.author[0]}</Avatar>
                        <Typography variant="body2" fontWeight="600">{doc.author}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton size="small" sx={{ color: 'primary.main', bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}>
                        <Eye size="18" variant="Bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </DashboardLayout>
  );
}

