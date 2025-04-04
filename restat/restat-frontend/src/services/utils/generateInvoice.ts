import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { apis } from '../apis';
import { convertDateOnlyFormat } from './convertDate';

const base64Image = 'data:image/png;base64,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';

export const generateInvoicePDF = async (invoiceNo: string) => {
  const { data: invoiceData } = await apis.getInvoice(invoiceNo);

  const doc = new jsPDF();

  // Adding Logo
  doc.addImage(base64Image, 'PNG', 12, 10, 10, 10);

  // Company Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Restat', 30, 15);
  doc.setFont('helvetica', 'normal');
  doc.text('2 West Canal Road, Lahore, Pakistan', 30, 20);
  // Invoice Info 
  doc.setFontSize(10);
  doc.text(`Date of Invoice: ${convertDateOnlyFormat(invoiceData?.invoice?.createdAt)}`, 200, 15, { align: 'right' });
  doc.text(`Invoice Number: ${invoiceData?.invoice?.invoiceNo}`, 200, 20, { align: 'right' });

  // Line Separator
  doc.setDrawColor(200, 200, 200); // Light gray
  doc.line(10, 25, 200, 25);

  // Customer Details
  doc.text('Invoice To:', 10, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', 10, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoiceData?.customerDetails?.name}`, 40, 40);

  doc.setFont('helvetica', 'bold');
  doc.text('Customer Email:', 10, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoiceData?.customerDetails?.email}`, 40, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Workspace Name:', 10, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoiceData?.customerDetails?.workspaceName}`, 42, 50);

  // Adding Line Items Table
  doc.autoTable({
    head: [['Name', 'Billing Cycle', 'Rate', 'Price']],
    body: invoiceData?.invoice?.items?.map((item: any) => [
      item?.name.includes('Plan:') ? item?.name : `${item?.name} (${item?.quantity})`,
      item?.billingCycle,
      `$${item?.unitPrice.toFixed(2)}`,
      `$${item?.totalPrice.toFixed(2)}`,
    ]),
    startY: 60,
    theme: 'striped',
    styles: {
      fontSize: 10,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [40, 48, 63], // Blue header
      textColor: [255, 255, 255], // White text
      fontSize: 10,
    },
  });

  // Total Calculation (Right-Aligned)
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Grand Total: $${invoiceData?.invoice?.totalAmount.toFixed(2)}`,
    200,
    doc.lastAutoTable!.finalY + 10,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Order ID: ${invoiceData?.invoice?.orderId}`,
    10,
    doc.lastAutoTable!.finalY + 12,
    { align: 'left' }
  );

  doc.text(
    `Transaction ID: ${invoiceData?.invoice?.transactionId}`,
    10,
    doc.lastAutoTable!.finalY + 17,
    { align: 'left' }
  );
  
  // Save PDF
  doc.save(`Restat_Invoice_${invoiceData?.invoice?.invoiceNo}.pdf`);
};
