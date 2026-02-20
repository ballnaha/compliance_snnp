"use client";

import React from 'react';
import { Button, Tooltip, alpha, useTheme } from '@mui/material';
import { DirectDown } from 'iconsax-react';
import * as XLSX from 'xlsx';

interface ExportExcelButtonProps {
    data: any[];
    fileName?: string;
    sheetName?: string;
    label?: string;
    variant?: 'contained' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
    headers?: Record<string, string>; // Map of object key to Excel header name
    sx?: any;
}

/**
 * A reusable component to export JSON data to an Excel file.
 * Uses SheetJS (xlsx) for conversion and download.
 */
const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
    data,
    fileName = 'export.xlsx',
    sheetName = 'Sheet1',
    label = 'Export Excel',
    variant = 'contained',
    color = 'success',
    headers,
    sx = {}
}) => {
    const theme = useTheme();

    const handleExport = () => {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        // Determine columns to export
        const headerKeys = headers ? Object.keys(headers) : (data[0] ? Object.keys(data[0]) : []);
        const headerNames = headers ? Object.values(headers) : headerKeys;

        // Prepare rows for AOA (Array of Arrays)
        const rows: any[][] = [headerNames];

        data.forEach((item) => {
            const rowData: any[] = [];
            headerKeys.forEach((key) => {
                // Get value (handles nested keys like 'category.name')
                const value = key.split('.').reduce((obj, k) => (obj ? obj[k] : undefined), item);

                // Detection for link objects { text: '...', link: '...' }
                if (value && typeof value === 'object' && 'link' in value) {
                    // Use Cell Metadata (.l) instead of Formulas (=HYPERLINK)
                    // This avoids the 255-character limit that causes #VALUE! errors
                    // Especially important for Thai filenames which get very long when encoded
                    rowData.push({
                        t: 's', // type: string
                        v: value.text || value.link, // display value
                        l: {
                            Target: value.link,
                            Tooltip: value.text || value.link
                        } // hyperlink metadata
                    });
                } else {
                    rowData.push(value !== null && value !== undefined ? value : '');
                }
            });
            rows.push(rowData);
        });

        try {
            // Create worksheet using Array of Arrays
            // The library will automatically recognize objects with .l as hyperlinks
            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            // Create workbook and append worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            // Generate filename with extension
            const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

            // Write and download
            XLSX.writeFile(workbook, finalFileName);
        } catch (error) {
            console.error('Export to Excel failed:', error);
        }
    };

    // Determine default icon color based on variant
    const iconColor = variant === 'contained' ? '#fff' : (theme.palette as any)[color]?.main || 'inherit';

    return (
        <Tooltip title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.xlsx)">
            <Button
                variant={variant}
                color={color}
                startIcon={<DirectDown size="20" variant="Bold" color={iconColor} />}
                onClick={handleExport}
                sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    gap: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: variant === 'contained' ? `0 4px 12px ${alpha((theme.palette as any)[color]?.main || theme.palette.success.main, 0.25)}` : 'none',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: variant === 'contained' ? `0 6px 16px ${alpha((theme.palette as any)[color]?.main || theme.palette.success.main, 0.35)}` : 'none',
                        bgcolor: variant === 'outlined' ? alpha((theme.palette as any)[color]?.main || theme.palette.success.main, 0.04) : undefined,
                    },
                    '&:active': {
                        transform: 'translateY(0)',
                    },
                    ...sx
                }}
            >
                {label}
            </Button>
        </Tooltip>
    );
};

export default ExportExcelButton;
