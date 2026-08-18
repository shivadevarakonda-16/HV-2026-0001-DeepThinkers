const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { uploadCertificateFile } = require('../config/cloudinary');

class CertificateService {
  
  static computeFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  static computeMetadataHash(data) {
    const canonicalString = [
      data.certificateId,
      data.studentName,
      data.studentEmail,
      data.institutionName,
      data.courseName,
      data.grade,
      data.issueDate,
    ].join('|');

    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }

  /**
   * Generate QR Code as Data URI
   */
  static async generateQRCode(verificationUrl) {
    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 200,
      color: {
        dark: '#002B49',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Generate a professional academic certificate PDF buffer
   */
  static async generateCertificatePDF({
    certificateId,
    studentName,
    courseName,
    major,
    grade,
    issueDate,
    institutionName,
    verificationUrl,
  }) {
    return new Promise(async (resolve, reject) => {
      try {
        const qrDataUrl = await this.generateQRCode(verificationUrl);
        const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

        // Create PDF doc in landscape (A4)
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'A4',
          margin: 40,
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve({ buffer: Buffer.concat(buffers), qrDataUrl }));
        doc.on('error', (err) => reject(err));

        const width = doc.page.width;
        const height = doc.page.height;

        // Outer & Inner Borders
        doc.rect(20, 20, width - 40, height - 40).lineWidth(4).strokeColor('#0d6efd').stroke();
        doc.rect(26, 26, width - 52, height - 52).lineWidth(1).strokeColor('#6c757d').stroke();

        // Header Institution Name
        doc
          .font('Helvetica-Bold')
          .fontSize(24)
          .fillColor('#0d6efd')
          .text(institutionName.toUpperCase(), 40, 55, { align: 'center' });

        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor('#6c757d')
          .text('OFFICIAL ACADEMIC CREDENTIAL & DIPLOMA', 40, 85, { align: 'center', letterSpacing: 2 });

        doc.moveTo(150, 102).lineTo(width - 150, 102).lineWidth(0.75).strokeColor('#0d6efd').stroke();

        // Subtitle
        doc
          .font('Helvetica-Oblique')
          .fontSize(13)
          .fillColor('#212529')
          .text('This is to certify that', 40, 125, { align: 'center' });

        // Recipient Name
        doc
          .font('Helvetica-Bold')
          .fontSize(28)
          .fillColor('#212529')
          .text(studentName, 40, 150, { align: 'center' });

        // Body Text
        doc
          .font('Helvetica')
          .fontSize(12)
          .fillColor('#495057')
          .text('has successfully fulfilled all academic requirements for the degree of', 40, 190, { align: 'center' });

        // Course / Degree
        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor('#0d6efd')
          .text(courseName, 40, 215, { align: 'center' });

        if (major && major !== 'General Studies') {
          doc
            .font('Helvetica')
            .fontSize(13)
            .fillColor('#495057')
            .text(`Major: ${major}`, 40, 242, { align: 'center' });
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#198754')
          .text(`Honors / Grade: ${grade}`, 40, 265, { align: 'center' });

        // Date and Certificate ID
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor('#6c757d')
          .text(`Conferred on: ${issueDate}`, 60, 310, { align: 'left' });

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#212529')
          .text(`Credential ID: ${certificateId}`, 60, 328, { align: 'left' });

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#6c757d')
          .text(`Verification Protocol: SHA-256 + Dual-Verifier Consensus + Blockchain`, 60, 346, { align: 'left' });

        // QR Code on right bottom
        doc.image(qrImageBuffer, width - 180, 280, { width: 110 });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#6c757d')
          .text('Scan to verify authenticity', width - 195, 400, { width: 140, align: 'center' });

        // Signature Lines
        doc.moveTo(60, 420).lineTo(220, 420).lineWidth(1).strokeColor('#212529').stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#212529').text('Registrar / Dean', 60, 426);
        doc.font('Helvetica').fontSize(8).fillColor('#6c757d').text('Authorized University Signatory', 60, 438);

        doc.moveTo(270, 420).lineTo(430, 420).lineWidth(1).strokeColor('#212529').stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#212529').text('Chancellor / President', 270, 426);
        doc.font('Helvetica').fontSize(8).fillColor('#6c757d').text('Academic Governing Board', 270, 438);

        // Footer notice
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#adb5bd')
          .text(
            'Cryptographically secured & anchored on immutable ledger. Tamper-evident verification system powered by Credora v2 (HV2026-0001).',
            40,
            height - 35,
            { align: 'center' }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = CertificateService;
