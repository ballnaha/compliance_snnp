"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Stack,
    CircularProgress
} from '@mui/material';
import { Printer, ArrowLeft, Refresh } from 'iconsax-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface ReportItem {
    id: number;
    license: string;
    plan: string;
    factory: string;
    license_no: string;
    status: string;
    remark: string;
    expire_datetime: string;
    expected_datetime: string;
    responsible_person: string;
    document_preparer: string;
    cat_folder: string;
    cat_name: string;
    category_name: string;
    category_description: string;
    category_full: string;
    urgencyLevel: number;
}

interface CategoryGroup {
    categoryName: string;
    categoryDescription: string;
    items: ReportItem[];
}

interface ReportData {
    categories: Record<string, CategoryGroup>;
    totalItems: number;
    month: number;
    year: number;
}

export default function ComplianceReportPage() {
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/compliance/report');
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const now = new Date();
        const thaiMonth = MONTH_NAMES_TH[now.getMonth()];
        const thaiYear = now.getFullYear() + 543;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <title>รายงานการติดตามประจำเดือน : ${thaiMonth} ${thaiYear}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Sarabun', sans-serif;
                        font-size: 11px;
                        color: #000;
                        background: #fff;
                    }
                    
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                    }
                    
                    th, td {
                        border: 1px solid #000;
                        padding: 4px 6px;
                        vertical-align: middle;
                    }
                    
                    th {
                        background-color: #fff;
                        font-weight: 700;
                        text-align: center;
                        font-size: 10px;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <DashboardLayout title="รายงาน Compliance">
            <Container maxWidth="xl" sx={{ p: 0 }}>
                {/* Controls */}
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
                    <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>
                            รายงาน Compliance Update
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            แสดงรายการที่จะหมดอายุภายใน 90 วัน (ข้อมูล ณ วันที่ {dayjs().format('D MMMM')} พ.ศ. {new Date().getFullYear() + 543})
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowLeft />}
                            onClick={() => router.push('/compliance')}
                            sx={{ borderRadius: 2 }}
                        >
                            กลับ
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={fetchReport}
                            disabled={loading}
                            sx={{ borderRadius: 2 }}
                        >
                            รีเฟรช
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<Printer variant="Bold" />}
                            onClick={handlePrint}
                            disabled={!reportData || loading}
                            sx={{ borderRadius: 2 }}
                        >
                            พิมพ์ / บันทึก PDF
                        </Button>
                    </Stack>
                </Stack>

                {/* Report Preview */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : reportData ? (
                    <Paper sx={{
                        borderRadius: 2,
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        p: 3,
                        bgcolor: '#fff'
                    }}>
                        <div ref={printRef}>
                            <ReportContent data={reportData} />
                        </div>
                    </Paper>
                ) : (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
                        <Typography color="text.secondary">ไม่พบข้อมูลรายงาน</Typography>
                    </Paper>
                )}
            </Container>
        </DashboardLayout>
    );
}

function ReportContent({ data }: { data: ReportData }) {
    let globalIndex = 0;
    const now = new Date();
    const thaiMonth = MONTH_NAMES_TH[data.month - 1];
    const thaiYear = data.year + 543;

    return (
        <div className="report-container" style={{ fontFamily: "'Sarabun', sans-serif", padding: '10px' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>รายงานการติดตามประจำเดือน</div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                    COMPLIANCE UPDATE : {thaiMonth} พ.ศ. {thaiYear}
                </div>
            </div>

            {/* Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10px',
                fontFamily: "'Sarabun', sans-serif"
            }}>
                <thead>
                    <tr>
                        <th style={thStyle}>ลำดับ</th>
                        <th style={{ ...thStyle, minWidth: '200px', textAlign: 'left' }}>รายการ</th>
                        <th style={thStyle}>แบบ</th>
                        <th style={thStyle}>โรงงาน</th>
                        <th style={{ ...thStyle, minWidth: '150px' }}>ทะเบียน/ใบอนุญาต</th>
                        <th style={{ ...thStyle, minWidth: '100px' }}>สถานะการติดตาม</th>
                        <th style={{ ...thStyle, minWidth: '100px' }}>วันที่คาดว่า<br />จะแล้วเสร็จ</th>
                        <th style={{ ...thStyle, minWidth: '90px' }}>วันครบกำหนด</th>
                        <th style={thStyle}>ความเร่งด่วน</th>
                        <th style={thStyle}>ผู้รับผิดชอบ</th>
                        <th style={thStyle}>ผู้จัดเตรียมเอกสาร</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data.categories).map(([key, group]) => {
                        const rows = group.items.map((item) => {
                            globalIndex++;
                            return (
                                <tr key={item.id}>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{globalIndex}</td>
                                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.license || '-'}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.plan || '-'}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.factory || '-'}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.license_no || '-'}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.remark || '-'}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {item.expected_datetime || '-'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {item.expire_datetime ? dayjs(item.expire_datetime).format('D MMM BBBB') : '-'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {renderUrgency(item.urgencyLevel)}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.responsible_person || '-'}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.document_preparer || '-'}</td>
                                </tr>
                            );
                        });

                        return [
                            <tr key={`cat-${key}`}>
                                <td
                                    colSpan={11}
                                    style={{
                                        ...tdStyle,
                                        backgroundColor: '#f0f0f0',
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        padding: '5px 8px'
                                    }}
                                >
                                    {group.categoryName} {group.categoryDescription}
                                </td>
                            </tr>,
                            ...rows
                        ];
                    })}
                </tbody>
            </table>

            {/* Legend */}
            <div style={{ marginTop: '20px', fontSize: '11px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ minWidth: '40px', fontWeight: 700 }}>💀</span>
                    <span>คือจะหมดอายุหรือต้องดำเนินการ ภายใน 2 เดือนหน้า นับจากเดือนที่แจ้ง</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ minWidth: '40px', fontWeight: 700 }}>💀💀</span>
                    <span>คือจะหมดอายุหรือต้องดำเนินการ ภายในเดือนหน้า นับจากเดือนที่แจ้ง</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ minWidth: '40px', fontWeight: 700 }}>💀💀💀</span>
                    <span>คือหมดอายุหรือต้องดำเนินการภายในเดือนที่แจ้ง</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '30px',
                fontSize: '9px',
                color: '#666',
                textAlign: 'center',
                padding: '8px 0',
                borderTop: '1px solid #ddd'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '100%' }}>
                    <span>© พ.ศ. {now.getFullYear() + 543} SNNP Compliance System</span>
                    <span>ระบบจัดการเอกสาร</span>
                    <span>พิมพ์เมื่อ: {dayjs().format('D MMM BBBB HH:mm')}</span>
                </div>
            </div>
        </div>
    );
}

const MONTH_NAMES_TH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const thStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '6px 8px',
    fontWeight: 700,
    textAlign: 'center',
    fontSize: '10px',
    backgroundColor: '#fff',
    verticalAlign: 'middle'
};

const tdStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '4px 6px',
    verticalAlign: 'middle',
    fontSize: '10px'
};

function renderUrgency(level: number) {
    switch (level) {
        case 3:
            return <span>💀💀💀</span>;
        case 2:
            return <span>💀💀</span>;
        case 1:
            return <span>💀</span>;
        default:
            return '-';
    }
}
