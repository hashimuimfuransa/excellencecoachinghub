import jsPDF from 'jspdf';

function createCertificateCanvas(
  studentName: string,
  courseName: string,
  completionDate: string,
  grade: string,
  score: number,
  certificateNumber: string,
  verificationCode: string
): { canvas: HTMLCanvasElement; pngDataUrl: string } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = 1200;
  canvas.height = 850;
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate of Completion', width / 2, 120);

  ctx.fillStyle = '#7f8c8d';
  ctx.font = '16px Arial';
  ctx.fillText('This is to certify that', width / 2, 180);

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 40px Arial';
  ctx.fillText(studentName, width / 2, 250);

  ctx.fillStyle = '#7f8c8d';
  ctx.font = '16px Arial';
  ctx.fillText('has successfully completed and demonstrated proficiency in', width / 2, 310);

  ctx.fillStyle = '#27ae60';
  ctx.font = 'bold 32px Arial';
  ctx.fillText(courseName, width / 2, 380);

  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 430);
  ctx.lineTo(width - 250, 430);
  ctx.stroke();

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Arial';
  const detailY = 500;
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}%`, 100, detailY);
  ctx.fillText(`Grade: ${grade}`, 100, detailY + 40);
  ctx.fillText(`Date: ${completionDate}`, 100, detailY + 80);

  ctx.textAlign = 'right';
  ctx.fillText(`Certificate #: ${certificateNumber}`, width - 100, detailY);
  ctx.fillText(`Verification: ${verificationCode}`, width - 100, detailY + 40);

  ctx.fillStyle = '#27ae60';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Issued By', width / 2, 700);

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Abdala Nzabandora', width / 2, 740);

  ctx.fillStyle = '#27ae60';
  ctx.font = '14px Arial';
  ctx.fillText('Chairman, Excellence Coaching Hub', width / 2, 770);

  const pngDataUrl = canvas.toDataURL('image/png');
  return { canvas, pngDataUrl };
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function buildFileBase(studentName: string): string {
  const cleaned = studentName.trim().replace(/[^a-z0-9]+/gi, '_') || 'Student';
  return `Certificate_${cleaned}_${new Date().getFullYear()}`;
}

export function downloadCertificatePNG(
  studentName: string,
  courseName: string,
  completionDate: string,
  grade: string,
  score: number,
  certificateNumber: string,
  verificationCode: string
): void {
  const { pngDataUrl } = createCertificateCanvas(
    studentName,
    courseName,
    completionDate,
    grade,
    score,
    certificateNumber,
    verificationCode
  );
  const filename = `${buildFileBase(studentName)}.png`;
  triggerDownload(pngDataUrl, filename);
}

export function downloadCertificatePDF(
  studentName: string,
  courseName: string,
  completionDate: string,
  grade: string,
  score: number,
  certificateNumber: string,
  verificationCode: string
): void {
  const { canvas, pngDataUrl } = createCertificateCanvas(
    studentName,
    courseName,
    completionDate,
    grade,
    score,
    certificateNumber,
    verificationCode
  );
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [canvas.width, canvas.height] });
  pdf.addImage(pngDataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
  const filename = `${buildFileBase(studentName)}.pdf`;
  pdf.save(filename);
}
