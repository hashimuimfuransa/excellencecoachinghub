import puppeteer from 'puppeteer';
import { ICertificate } from '../models/Certificate';

export interface CertificateData {
  certificate: any;
  studentName: string;
  courseName: string;
  completionDate: string;
  grade: string;
  score: number;
  certificateNumber: string;
  verificationCode: string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Completion</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
          }
          
          .certificate-container {
            width: 100%;
            max-width: 900px;
            background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
            border: 8px solid transparent;
            border-image: linear-gradient(135deg, #2c3e50 0%, #1a1a1a 50%, #2c3e50 100%) 1;
            border-radius: 4px;
            padding: 60px;
            position: relative;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            page-break-inside: avoid;
          }
          
          .certificate-container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #2c3e50 0%, #27ae60 50%, #2c3e50 100%);
          }
          
          .certificate-container::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #2c3e50 0%, #27ae60 50%, #2c3e50 100%);
          }
          
          .certificate-header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .logo-section {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-circle {
            width: 70px;
            height: 70px;
            background: #27ae60;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
          }
          
          .title {
            font-size: 48px;
            font-weight: 900;
            background: linear-gradient(135deg, #2c3e50 0%, #27ae60 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 10px 0;
            letter-spacing: 1px;
          }
          
          .divider {
            border-top: 2px solid #27ae60;
            width: 60%;
            margin: 20px auto;
          }
          
          .certificate-subtitle {
            font-style: italic;
            color: #7f8c8d;
            font-size: 14px;
            margin: 20px 0 10px;
          }
          
          .student-name {
            font-size: 36px;
            font-weight: 900;
            color: #2c3e50;
            margin: 20px 0;
            text-decoration: underline;
            text-decoration-color: #27ae60;
            text-decoration-thickness: 2px;
            text-underline-offset: 6px;
          }
          
          .course-completion-text {
            color: #7f8c8d;
            font-size: 16px;
            margin: 15px 0;
          }
          
          .course-name {
            font-size: 28px;
            font-weight: 800;
            color: #27ae60;
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f8f5;
            border-radius: 4px;
            border: 2px solid #27ae60;
          }
          
          .details-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #f0f8f5;
            border-radius: 4px;
            border: 2px solid #27ae60;
          }
          
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .detail-item {
            text-align: center;
          }
          
          .detail-label {
            font-weight: 600;
            color: #7f8c8d;
            font-size: 12px;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          
          .detail-value {
            font-weight: 700;
            color: #27ae60;
            font-size: 24px;
          }
          
          .score-value {
            color: #27ae60;
            font-size: 48px;
          }
          
          .grade-value {
            color: #27ae60;
            font-size: 42px;
          }
          
          .footer-section {
            margin-top: 40px;
            padding: 20px;
            background-color: #f0f8f5;
            border: 2px solid #27ae60;
            border-radius: 4px;
            text-align: center;
          }
          
          .issued-by-label {
            font-weight: 600;
            color: #7f8c8d;
            font-size: 12px;
            margin-bottom: 5px;
          }
          
          .issued-by-name {
            font-weight: 900;
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 3px;
          }
          
          .issued-by-title {
            font-weight: 700;
            color: #27ae60;
            font-size: 14px;
          }
          
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin: 40px 0;
            text-align: center;
          }
          
          .signature-line {
            height: 60px;
            border-top: 2px solid #2c3e50;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            margin-bottom: 10px;
          }
          
          .signature-label {
            font-weight: 700;
            color: #2c3e50;
            font-size: 12px;
          }
          
          .seal-placeholder {
            font-size: 50px;
            opacity: 0.3;
            line-height: 1;
          }
          
          .certificate-id {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
          }
          
          .certificate-meta {
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 20px;
          }
          
          .verification-code {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #2c3e50;
            font-size: 11px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <!-- Certificate Header -->
          <div class="certificate-header">
            <div class="logo-section">
              <div class="logo-circle">🎓</div>
            </div>
            
            <div class="title">Certificate of Completion</div>
            
            <div class="divider"></div>
            
            <div class="certificate-subtitle">This is to certify that</div>
            
            <div class="student-name">${data.studentName}</div>
            
            <div class="course-completion-text">has successfully completed and demonstrated proficiency in</div>
            
            <div class="course-name">${data.courseName}</div>
          </div>
          
          <!-- Details Section -->
          <div class="details-section">
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Final Score</div>
                <div class="score-value">${data.score}%</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Grade Status</div>
                <div class="grade-value">${data.grade}</div>
              </div>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Completion Date</div>
                <div class="detail-value" style="font-size: 16px;">${formatDate(data.completionDate)}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Certificate Number</div>
                <div class="detail-value" style="font-size: 12px; font-family: monospace;">${data.certificateNumber}</div>
              </div>
            </div>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Instructor/Assessor</div>
            </div>
            
            <div>
              <div class="seal-placeholder">✓</div>
              <div class="signature-label">Official Seal</div>
            </div>
            
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Signature Line</div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer-section">
            <div class="issued-by-label">Issued By</div>
            <div class="issued-by-name">Abdala Nzabandora</div>
            <div class="issued-by-title">Chairman, Excellence Coaching Hub</div>
          </div>
          
          <!-- Certificate Meta Information -->
          <div class="certificate-id">
            <div>
              <strong style="color: #2c3e50;">Certificate ID</strong><br>
              <span class="verification-code">${data.certificateNumber}</span>
            </div>
            <div>
              <strong style="color: #2c3e50;">Excellence Coaching Hub © ${new Date().getFullYear()}</strong>
            </div>
          </div>
          
          <div class="certificate-meta">
            <strong>Verification Code:</strong><br>
            <span class="verification-code">${data.verificationCode}</span>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      printBackground: true
    });
    
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error generating certificate PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}
