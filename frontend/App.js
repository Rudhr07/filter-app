import React, { useEffect, useState } from 'react';

function App() {
  const [filters, setFilters] = useState({ department: [], category: [], supplier: [], branch: [] });
  const [selected, setSelected] = useState({ department: '', category: '', supplier: '', branch: '' });
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/filters')
      .then(res => res.json())
      .then(setFilters);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(selected).forEach(([k, v]) => { if (v) params.append(k, v); });
    fetch('http://localhost:4000/api/results?' + params.toString())
      .then(res => res.json())
      .then(setResults);
  }, [selected]);

  function handleChange(e) {
    setSelected({ ...selected, [e.target.name]: e.target.value });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Filter Results</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {Object.keys(filters).map(key => (
          <div key={key}>
            <label>{key.charAt(0).toUpperCase() + key.slice(1)}: </label>
            <select name={key} value={selected[key]} onChange={handleChange}>
              <option value=''>All</option>
              {filters[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        ))}
      </div>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Department</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Branch</th>
            <th>Netls Qty</th>
            <th>Net Amount</th>
            <th>Netslscost</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row, i) => (
            <tr key={i}>
              <td>{row.department}</td>
              <td>{row.category}</td>
              <td>{row.supplier}</td>
              <td>{row.branch}</td>
              <td>{row.netlsqty}</td>
              <td>{row.netamount}</td>
              <td>{row.netslscost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
