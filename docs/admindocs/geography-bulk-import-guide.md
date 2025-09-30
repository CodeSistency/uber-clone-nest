# 📍 Guía de Importación Masiva de Países

## 🎯 Descripción General

El sistema de geografía incluye una funcionalidad de importación masiva que permite cargar países desde archivos CSV. Esta funcionalidad está diseñada para facilitar la configuración inicial del sistema con datos de países.

## 📋 Formato del Archivo CSV

### Campos Requeridos
- `name`: Nombre completo del país (ej: "United States")
- `isoCode2`: Código ISO 3166-1 alpha-2 (ej: "US")
- `currencyCode`: Código de moneda ISO 4217 (ej: "USD")
- `timezone`: Zona horaria IANA (ej: "America/New_York")
- `continent`: Continente (ej: "North America")

### Campos Opcionales
- `isoCode3`: Código ISO 3166-1 alpha-3 (ej: "USA")
- `numericCode`: Código numérico ISO 3166-1 (ej: "840")
- `phoneCode`: Código internacional de teléfono (ej: "+1")
- `currencyName`: Nombre completo de la moneda
- `currencySymbol`: Símbolo de la moneda (ej: "$")
- `region`: Región de la ONU (ej: "Americas")
- `subregion`: Subregión de la ONU (ej: "Northern America")
- `vatRate`: Tasa de IVA (0-100)
- `corporateTaxRate`: Tasa de impuesto corporativo (0-100)
- `incomeTaxRate`: Tasa de impuesto a la renta (0-100)
- `capital`: Ciudad capital
- `population`: Población (número entero)
- `areaKm2`: Área en kilómetros cuadrados
- `supportedLanguages`: Idiomas soportados (separados por coma)
- `flag`: Emoji de bandera

## 🚀 Uso de la API

### Endpoint
```
POST /admin/geography/countries/bulk-import
```

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer <admin-jwt-token>
```

### Parámetros
- `file`: Archivo CSV con los datos de países

### Ejemplo con cURL
```bash
curl -X POST \
  http://localhost:3000/admin/geography/countries/bulk-import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@countries.csv"
```

## 📊 Respuesta de la API

### Respuesta Exitosa
```json
{
  "totalProcessed": 10,
  "successful": 9,
  "failed": 1,
  "skipped": 0,
  "errors": [
    {
      "row": 5,
      "field": "isoCode2",
      "value": "INVALID",
      "error": "ISO code must be exactly 2 characters"
    }
  ],
  "duration": 1250
}
```

### Tipos de Resultados
- **successful**: Registros procesados correctamente
- **failed**: Registros con errores que impiden la importación
- **skipped**: Registros omitidos (duplicados, etc.)

## ✅ Validaciones Implementadas

### Validaciones de Campos Requeridos
- Todos los campos marcados como requeridos deben estar presentes
- Campos vacíos generan errores específicos

### Validaciones de Unicidad
- `name`: No puede repetirse
- `isoCode2`: Debe ser único
- `isoCode3`: Debe ser único (si se proporciona)
- `numericCode`: Debe ser único (si se proporciona)

### Validaciones de Formato
- `isoCode2`: Exactamente 2 caracteres
- `isoCode3`: Exactamente 3 caracteres (opcional)
- `numericCode`: Número entero positivo
- `phoneCode`: Formato internacional (+XX)
- `currencyCode`: 3 caracteres
- Tasas impositivas: Números entre 0 y 100
- `population`: Número entero positivo
- `areaKm2`: Número positivo

### Validaciones de Datos
- `continent`: Debe ser un continente válido
- `timezone`: Debe ser una zona horaria IANA válida
- `supportedLanguages`: Lista separada por comas

## 📋 Archivo de Ejemplo

Se incluye un archivo de ejemplo `docs/countries-example.csv` con 10 países de diferentes continentes, incluyendo todos los campos posibles.

### Estructura del Archivo de Ejemplo
```csv
name,isoCode2,isoCode3,numericCode,phoneCode,currencyCode,currencyName,currencySymbol,timezone,continent,region,subregion,vatRate,corporateTaxRate,incomeTaxRate,capital,population,areaKm2,supportedLanguages,flag
United States,US,USA,840,+1,USD,United States Dollar,$,America/New_York,North America,Americas,Northern America,8.25,21.0,37.0,Washington D.C.,331900000,9833517,en,🇺🇸
Canada,CA,CAN,124,+1,CAD,Canadian Dollar,C$,America/Toronto,North America,Americas,Northern America,5.0,15.0,33.0,Ottawa,38250000,9984670,en,fr,🇨🇦
...
```

## ⚠️ Consideraciones Importantes

### Límites del Sistema
- **Tamaño máximo del archivo**: 5MB
- **Procesamiento**: En lotes de 10 registros para evitar sobrecarga
- **Timeout**: Recomendado para archivos grandes

### Manejo de Errores
- **Continuidad**: Si un registro falla, los demás se procesan normalmente
- **Rollback**: No hay rollback automático (se puede implementar si es necesario)
- **Logging**: Todos los errores se registran en logs del servidor

### Recomendaciones
- **Pruebas**: Siempre probar con un archivo pequeño primero
- **Backup**: Hacer backup de la base de datos antes de importaciones masivas
- **Validación**: Revisar los datos antes de subir archivos grandes
- **Monitoreo**: Monitorear logs durante el procesamiento

## 🔍 Troubleshooting

### Errores Comunes

#### "Only CSV files are allowed"
- El archivo debe tener extensión `.csv`
- Verificar que el archivo no esté corrupto

#### "File size exceeds 5MB limit"
- Reducir el tamaño del archivo
- Dividir en múltiples archivos más pequeños

#### Errores de validación específicos
- Revisar el mensaje de error específico
- Corregir los datos en el CSV según las validaciones requeridas

### Verificación Post-Importación
```sql
-- Verificar países importados
SELECT COUNT(*) as total_countries FROM countries;

-- Verificar continentes
SELECT continent, COUNT(*) as count
FROM countries
GROUP BY continent
ORDER BY continent;
```

## 📈 Próximos Pasos

Después de la importación exitosa, se pueden implementar:

1. **Estados/Provincias**: Importación de estados por país
2. **Ciudades**: Importación de ciudades principales
3. **Zonas de Servicio**: Configuración de zonas operativas
4. **Pricing Regional**: Configuración de precios por región

---

**📝 Nota**: Esta funcionalidad está diseñada para la configuración inicial del sistema. Para actualizaciones posteriores, usar los endpoints individuales de CRUD de países.
