import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head?: Array<Array<string | number>>;
      body: Array<Array<string | number>>;
      startY?: number;
      theme?: 'striped' | 'grid' | 'plain';
      styles?: {
        fontSize?: number;
        halign?: 'left' | 'center' | 'right';
        valign?: 'top' | 'middle' | 'bottom';
        fillColor?: string | [number, number, number];
        textColor?: string | [number, number, number];
      };
      headStyles?: {
        fillColor?: string | [number, number, number];
        textColor?: string | [number, number, number];
        fontSize?: number;
      };
      bodyStyles?: object;
      footStyles?: object;
    }) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}
