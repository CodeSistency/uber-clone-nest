const { ReportsAnalyticsService } = require('./dist/admin/modules/reports-analytics/services/reports-analytics.service');
const { PrismaClient } = require('@prisma/client');

async function testExportFunctionality() {
  console.log('🧪 Testing export functionality...');

  const prisma = new PrismaClient();

  try {
    // Create service instance (this would normally be done by NestJS DI)
    const service = new ReportsAnalyticsService(prisma);

    // Test data - create a simple report
    const testFilters = {
      period: 'month',
      entityType: 'rides'
    };

    console.log('📊 Generating test report...');
    const reportData = await service.generateReport(testFilters);

    if (!reportData || !reportData.summary) {
      console.log('❌ No report data generated');
      return;
    }

    console.log('✅ Report generated successfully');
    console.log('📈 Summary:', reportData.summary);

    // Test CSV export
    console.log('📄 Testing CSV export...');
    const csvResult = await service.exportReport(testFilters, 'csv');
    console.log('✅ CSV export successful');
    console.log('📁 Filename:', csvResult.filename);
    console.log('📊 Data length:', csvResult.data.length);

    // Test Excel export
    console.log('📊 Testing Excel export...');
    const excelResult = await service.exportReport(testFilters, 'excel');
    console.log('✅ Excel export successful');
    console.log('📁 Filename:', excelResult.filename);
    console.log('📊 Buffer size:', excelResult.data.length, 'bytes');

    // Test PDF export
    console.log('📋 Testing PDF export...');
    const pdfResult = await service.exportReport(testFilters, 'pdf');
    console.log('✅ PDF export successful');
    console.log('📁 Filename:', pdfResult.filename);
    console.log('📊 Buffer size:', pdfResult.data.length, 'bytes');

    console.log('🎉 All export functionalities tested successfully!');

  } catch (error) {
    console.error('❌ Error testing export functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testExportFunctionality();
