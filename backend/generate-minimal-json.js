import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csvFilePath = './data-mb(Sheet1).csv';
const minimalJsonFilePath = './data-minimal.json';

const fileContent = fs.readFileSync(csvFilePath, 'utf8');
const data = parse(fileContent, {
  columns: true,
  skip_empty_lines: true
});

// Map to only required columns


console.log('Sample parsed row:', data[0]);
const minimalData = data.map(row => ({
  department: row['DepartmentShortName'],
  category: row['CategoryShortName'],
  supplier: row['SupplierAlias'],
  branch: row['branch'],
  netlsqty: row['NetSlsQty'],
  netamount: row['NetAmount'],
  netslscost: row['NetSlsCostValue']
}));
console.log('minimalData length:', minimalData.length);
console.log('minimalData sample:', minimalData.slice(0, 3));
try {
  fs.writeFileSync(minimalJsonFilePath, JSON.stringify(minimalData, null, 2));
  console.log('Minimal JSON generated:', minimalJsonFilePath);
} catch (err) {
  console.error('Error writing minimal JSON:', err);
}