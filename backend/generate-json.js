import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csvFilePath = './data-mb(Sheet1).csv';
const jsonFilePath = './data-mb(Sheet1).json';

const fileContent = fs.readFileSync(csvFilePath, 'utf8');
const data = parse(fileContent, {
  columns: true,
  skip_empty_lines: true
});
fs.writeFileSync(jsonFilePath, JSON.stringify(data));
console.log('JSON generated:', jsonFilePath);