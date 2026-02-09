import {
    Folder2,
    DocumentCloud,
    ShieldSecurity,
    TaskSquare,
    Clock,
    NotificationCircle,
    ArchiveBook,
    Transmit
} from 'iconsax-react';

export interface Category {
    id: string;
    name: string;
    icon: any;
    color: string;
    count: number;
    description: string;
}

export const CATEGORIES: Category[] = [
    {
        id: 'legal',
        name: 'เอกสารกฎหมาย',
        icon: ArchiveBook,
        color: '#6366f1', // Indigo
        count: 24,
        description: 'สัญญา, NDA และกรอบกฎหมายต่างๆ'
    },
    {
        id: 'financial',
        name: 'ตรวจสอบการเงิน',
        icon: Transmit,
        color: '#10b981', // Emerald
        count: 15,
        description: 'ภาษี, ใบแจ้งหนี้ และประวัติการตรวจสอบ'
    },
    {
        id: 'iso',
        name: 'มาตรฐาน ISO',
        icon: ShieldSecurity,
        color: '#f59e0b', // Amber
        count: 8,
        description: 'ISO 27001, 9001 และใบรับรองต่างๆ'
    },
    {
        id: 'hr',
        name: 'ทรัพยากรบุคคล',
        icon: TaskSquare,
        color: '#ec4899', // Pink
        count: 42,
        description: 'ข้อมูลพนักงานและการฝึกอบรมความสอดคล้อง'
    }
];

export interface Document {
    id: string;
    title: string;
    category: string;
    status: 'active' | 'pending' | 'expired';
    updatedAt: string;
    author: string;
    size: string;
}

export const RECENT_DOCUMENTS: Document[] = [
    { id: '1', title: 'รายงานตรวจสอบประจำปี 2024.pdf', category: 'ตรวจสอบการเงิน', status: 'active', updatedAt: '2 ชั่วโมงที่แล้ว', author: 'สมชาย', size: '2.4 MB' },
    { id: '2', title: 'นโยบายความเป็นส่วนตัว V2.docx', category: 'เอกสารกฎหมาย', status: 'pending', updatedAt: '5 ชั่วโมงที่แล้ว', author: 'วิชัย', size: '1.1 MB' },
    { id: '3', title: 'ใบรับรองความปลอดภัยอัคคีภัย.png', category: 'มาตรฐาน ISO', status: 'expired', updatedAt: '1 วันที่แล้ว', author: 'ผู้ดูแลระบบ', size: '4.5 MB' },
    { id: '4', title: 'คู่มือการรับสมัครงาน.pdf', category: 'ทรัพยากรบุคคล', status: 'active', updatedAt: '2 วันที่แล้ว', author: 'สาระ', size: '3.2 MB' },
];
