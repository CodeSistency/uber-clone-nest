// Script de ejemplo para probar bulk-update de tiers usando datos del CSV
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const BASE_URL = 'http://localhost:3000';

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@uberclone.com',
  password: 'Admin123!'
};

// Función para parsear CSV y hacer bulk updates
async function testBulkUpdateFromCSV(csvFilePath) {
  try {
    console.log('🚀 Obteniendo token de admin...');

    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.data.access_token;

    console.log('✅ Token obtenido exitosamente');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Leer y procesar CSV
    const updates = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Parse tierIds (puede ser array separado por ; o número simple)
        const tierIds = row.tierIds.includes(';')
          ? row.tierIds.split(';').map(id => parseInt(id.trim()))
          : [parseInt(row.tierIds)];

        updates.push({
          tierIds,
          adjustmentType: row.adjustmentType,
          adjustmentValue: parseFloat(row.adjustmentValue),
          field: row.field,
          description: row.description
        });
      })
      .on('end', async () => {
        console.log(`📄 Procesando ${updates.length} operaciones de bulk update...`);

        for (const update of updates) {
          try {
            console.log(`\n🧪 Ejecutando: ${update.description}`);

            const response = await axios.post(`${BASE_URL}/admin/pricing/ride-tiers/bulk-update`, update, { headers });

            console.log('✅ Bulk update completado');
            console.log('📋 Resultados:', JSON.stringify(response.data, null, 2));

          } catch (error) {
            console.log('❌ Error en bulk update:', error.response?.data || error.message);
          }
        }

        console.log('\n🎉 Procesamiento de CSV completado');
      });

  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

// Verificar que el archivo CSV existe y ejecutar
const csvFile = 'bulk-update-tiers-sample.csv';
if (fs.existsSync(csvFile)) {
  console.log(`📄 Usando archivo CSV: ${csvFile}`);
  testBulkUpdateFromCSV(csvFile);
} else {
  console.log(`❌ Archivo CSV no encontrado: ${csvFile}`);
  console.log('💡 Crea el archivo con el siguiente contenido de ejemplo:');
  console.log(`
tierIds,adjustmentType,adjustmentValue,field,description
4,percentage,10,baseFare,Aumentar baseFare de UberX en 10%
5,percentage,15,perMinuteRate,Aumentar perMinuteRate de UberXL en 15%
6,fixed,50,perKmRate,Aumentar perKmRate de Uber Black en $0.50 fijo
4;5;6,percentage,-5,baseFare,Reducir baseFare de todos los tiers en 5%
  `.trim());
}
