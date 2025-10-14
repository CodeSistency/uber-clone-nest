const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

async function testExcelExport() {
  console.log('📊 Testing Excel export functionality...');

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Test';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Test Sheet');
    sheet.addRow(['Test', 'Data', 'Export']);
    sheet.addRow(['Row 1', 'Value 1', 100]);
    sheet.addRow(['Row 2', 'Value 2', 200]);

    const buffer = await workbook.xlsx.writeBuffer();
    const resultBuffer = Buffer.from(buffer);

    console.log('✅ Excel export successful');
    console.log('📊 Buffer size:', resultBuffer.length, 'bytes');

    return resultBuffer;
  } catch (error) {
    console.error('❌ Excel export failed:', error);
    throw error;
  }
}

async function testPDFExport() {
  console.log('📋 Testing PDF export functionality...');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const resultBuffer = Buffer.concat(buffers);
        console.log('✅ PDF export successful');
        console.log('📊 Buffer size:', resultBuffer.length, 'bytes');
        resolve(resultBuffer);
      });
      doc.on('error', reject);

      // Add some content
      doc.fontSize(24).text('Test Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('This is a test PDF export');
      doc.text('Generated at: ' + new Date().toISOString());
      doc.moveDown();
      doc.text('Test data:');
      doc.text('- Item 1: Value 1');
      doc.text('- Item 2: Value 2');

      doc.end();
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      reject(error);
    }
  });
}

async function main() {
  console.log('🧪 Testing export functionalities...\n');

  try {
    // Test Excel
    await testExcelExport();
    console.log('');

    // Test PDF
    await testPDFExport();
    console.log('');

    console.log('🎉 All export functionalities work correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();

