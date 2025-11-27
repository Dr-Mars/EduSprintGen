import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const pdfWatermarkService = {
  /**
   * Add watermark to PDF file
   */
  async addWatermarkToPDF(
    inputPath: string,
    outputPath: string,
    studentId: string,
    studentName: string,
    uploadDate: Date
  ): Promise<void> {
    try {
      // Read input PDF
      const pdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      const pages = pdfDoc.getPages();
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Add main watermark text
        page.drawText(`${studentName} (${studentId})`, {
          x: width / 2 - 120,
          y: height / 2 + 20,
          size: 24,
          color: rgb(0.85, 0.85, 0.85),
          opacity: 0.15,
          rotate: degrees(-45),
        });
        
        // Add upload timestamp
        page.drawText(`Uploaded: ${uploadDate.toISOString()}`, {
          x: width / 2 - 150,
          y: height / 2 - 30,
          size: 12,
          color: rgb(0.9, 0.9, 0.9),
          opacity: 0.1,
          rotate: degrees(-45),
        });
        
        // Add proprietary notice
        page.drawText('PROPRIÉTÉ INTELLECTUELLE', {
          x: width / 2 - 180,
          y: height / 2 - 80,
          size: 16,
          color: rgb(0.8, 0.8, 0.8),
          opacity: 0.12,
          rotate: degrees(-45),
        });
      }
      
      // Save watermarked PDF
      const pdfBytesOutput = await pdfDoc.save();
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, pdfBytesOutput);
    } catch (error) {
      console.error('Error adding watermark to PDF:', error);
      throw error;
    }
  },
};
