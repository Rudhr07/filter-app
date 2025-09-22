import express from 'express';
import cors from 'cors';

import fs from 'fs';
import { parse } from 'csv-parse/sync';

const app = express();
app.use(cors());


const minimalJsonFilePath = './data-minimal.json';
let data = [];
function loadData() {
  if (fs.existsSync(minimalJsonFilePath)) {
    data = JSON.parse(fs.readFileSync(minimalJsonFilePath, 'utf8'));
  } else {
    throw new Error('Minimal JSON file not found. Please run generate-minimal-json.js');
  }
}
loadData();

// Helper to get unique values for filter options
function getUniqueValues(field) {
  return [...new Set(data.map(row => row[field]))]
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
}


app.get('/api/filters', (req, res) => {
  res.json({
    department: getUniqueValues('department'),
    category: getUniqueValues('category'),
    supplier: getUniqueValues('supplier'),
    branch: getUniqueValues('branch')
  });
});

// API: Get paginated/filter/aggregate results
app.get('/api/results', (req, res) => {
  // Accept arrays for multi-select filters
  const departments = [].concat(req.query.department || []).filter(Boolean);
  const categories = [].concat(req.query.category || []).filter(Boolean);
  const suppliers = [].concat(req.query.supplier || []).filter(Boolean);
  const branches = [].concat(req.query.branch || []).filter(Boolean);
  let page = parseInt(req.query.page) || 1;
  let pageSize = parseInt(req.query.pageSize) || 50;
  let filtered = data;
  if (departments.length) filtered = filtered.filter(row => departments.includes(row.department));
  if (categories.length) filtered = filtered.filter(row => categories.includes(row.category));
  if (suppliers.length) filtered = filtered.filter(row => suppliers.includes(row.supplier));
  if (branches.length) filtered = filtered.filter(row => branches.includes(row.branch));

  // Group by Department, Category, Supplier, Branch
  const groupMap = new Map();
  for (const row of filtered) {
    const key = [row.department, row.category, row.supplier, row.branch].join('||');
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        department: row.department,
        category: row.category,
        supplier: row.supplier,
        branch: row.branch,
        netlsqty: 0,
        netamount: 0,
        netslscost: 0
      });
    }
    const group = groupMap.get(key);
    group.netlsqty += Number(row.netlsqty) || 0;
    group.netamount += Number(row.netamount) || 0;
    group.netslscost += Number(row.netslscost) || 0;
  }
  const grouped = Array.from(groupMap.values());
  const total = grouped.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageData = grouped.slice(start, end);
  res.json({
    results: pageData,
    total,
    page,
    pageSize
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
