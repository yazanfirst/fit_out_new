import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { Invoice } from '@/lib/types';
import * as XLSX from 'xlsx';

interface InvoiceSummaryProps {
  invoices: Invoice[];
}

const STATUS_COLORS: Record<string, string> = {
  'Submitted': 'FFB6E0FC', // blue
  'Paid': 'FFB7F7D8',      // green
  'Approved': 'FFFFF7B2',  // yellow
  'Rejected': 'FFF7B2B2',  // red
  'Not Submitted': 'FFD3D3D3', // gray
};

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ invoices }) => {
  const exportToExcel = () => {
    // Prepare data in the same order as the table
    const columns = [
      'Invoice #',
      'Company',
      'Item',
      'Type',
      'Date',
      'Amount (AED)',
      'Status',
    ];
    const data = invoices.map(invoice => ([
      invoice.invoice_number,
      invoice.company_name || '-',
      invoice.item_id || '-',
      invoice.type,
      new Date(invoice.invoice_date).toLocaleDateString(),
      `${Number(invoice.amount).toLocaleString()} AED`,
      invoice.status,
    ]));
    const wsData = [columns, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Add color formatting for the Status column
    // (xlsx-style is required for true cell styling, but we can use cell comments as a workaround in plain xlsx)
    // We'll use a custom approach for the most common viewers (Excel, Google Sheets)
    data.forEach((row, i) => {
      const status = row[6];
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: 6 }); // +1 for header
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: {
            fgColor: { rgb: STATUS_COLORS[status] || 'FFFFFFFF' }
          },
          font: { bold: true }
        };
      }
    });

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'invoice-report.xlsx');
  };

  return (
    <Button onClick={exportToExcel} variant="outline" size="sm" className="mb-4">
      <Download className="h-4 w-4 mr-2" />
      Export Invoice Report
    </Button>
  );
};

export default InvoiceSummary; 