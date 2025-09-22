import React, { useEffect, useState, useRef } from 'react';


function App() {
  const [filters, setFilters] = useState({ department: [], category: [], supplier: [], branch: [] });
  const [rawData, setRawData] = useState(null);
  const [selected, setSelected] = useState({ department: [], category: [], supplier: [], branch: [] });
  const [pending, setPending] = useState({ department: [], category: [], supplier: [], branch: [] });
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;
  const [openDropdown, setOpenDropdown] = useState(null);
  const wrapperRef = useRef();

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      fetch('http://localhost:4000/api/filters')
        .then(res => res.json())
        .then(setFilters)
        .catch(() => setFilters({ department: [], category: [], supplier: [], branch: [] }));
    } else {
      // Deployed: load the pre-generated minimal JSON from the repo raw URL
      const rawUrl = 'https://raw.githubusercontent.com/Rudhr07/filter-app/master/backend/data-minimal.json';
      fetch(rawUrl)
        .then(res => res.json())
        .then(data => {
          setRawData(data);
          // build filter lists
          const f = { department: new Set(), category: new Set(), supplier: new Set(), branch: new Set() };
          data.forEach(r => {
            if (r.department) f.department.add(r.department);
            if (r.category) f.category.add(r.category);
            if (r.supplier) f.supplier.add(r.supplier);
            if (r.branch) f.branch.add(r.branch);
          });
          setFilters({
            department: Array.from(f.department).sort(),
            category: Array.from(f.category).sort(),
            supplier: Array.from(f.supplier).sort(),
            branch: Array.from(f.branch).sort(),
          });
        })
        .catch(() => setFilters({ department: [], category: [], supplier: [], branch: [] }));
    }
  }, []);

  // Load first page of results immediately on app open
  useEffect(() => {
    fetchResults(1, pending);
  }, []);

  function handleToggle(e) {
    const { name, value, checked } = e.target;
    const current = Array.isArray(pending[name]) ? pending[name] : [];
    const next = checked ? [...current, value] : current.filter(v => v !== value);
    setPending({ ...pending, [name]: next });
  }

  function fetchResults(newPage = 1, newFilters = pending) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => params.append(k, val));
        } else if (v) {
          params.append(k, v);
        }
      });
      params.append('page', newPage);
      params.append('pageSize', pageSize);
      fetch('http://localhost:4000/api/results?' + params.toString())
        .then(res => res.json())
        .then(data => {
          setResults(data.results);
          setTotal(data.total);
          setPage(data.page);
        });
      return;
    }

    // Deployed: compute results client-side from rawData
    if (!rawData) {
      setResults([]);
      setTotal(0);
      setPage(1);
      return;
    }

    // filter rows
    let filtered = rawData.filter(row => {
      // departments
      if (Array.isArray(newFilters.department) && newFilters.department.length) {
        if (!newFilters.department.includes(row.department)) return false;
      }
      if (Array.isArray(newFilters.category) && newFilters.category.length) {
        if (!newFilters.category.includes(row.category)) return false;
      }
      if (Array.isArray(newFilters.supplier) && newFilters.supplier.length) {
        if (!newFilters.supplier.includes(row.supplier)) return false;
      }
      if (Array.isArray(newFilters.branch) && newFilters.branch.length) {
        if (!newFilters.branch.includes(row.branch)) return false;
      }
      return true;
    });

    // group by dept|cat|supplier|branch and sum numeric fields
    const groupMap = new Map();
    filtered.forEach(r => {
      const key = `${r.department}||${r.category}||${r.supplier}||${r.branch}`;
      const netlsqty = Number(r.netlsqty) || 0;
      const netamount = Number(r.netamount) || 0;
      const netslscost = Number(r.netslscost) || 0;
      if (!groupMap.has(key)) {
        groupMap.set(key, { department: r.department, category: r.category, supplier: r.supplier, branch: r.branch, netlsqty, netamount, netslscost });
      } else {
        const cur = groupMap.get(key);
        cur.netlsqty += netlsqty;
        cur.netamount += netamount;
        cur.netslscost += netslscost;
      }
    });
    const grouped = Array.from(groupMap.values());
    const totalCount = grouped.length;
    const start = (newPage - 1) * pageSize;
    const pageData = grouped.slice(start, start + pageSize);
    setResults(pageData);
    setTotal(totalCount);
    setPage(newPage);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSelected({ ...pending });
    fetchResults(1, pending);
  }

  function handleClear() {
    setPending({ department: [], category: [], supplier: [], branch: [] });
    setSelected({ department: [], category: [], supplier: [], branch: [] });
    setResults([]);
    setTotal(0);
    setPage(1);
  }

  function handlePageChange(newPage) {
    fetchResults(newPage, selected);
  }

  // close dropdowns when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpenDropdown(null);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Filter Results</h2>
      <form ref={wrapperRef} onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {Object.keys(filters).map(key => {
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          const selectedCount = (pending[key] || []).length;
          return (
            <div key={key} style={{ position: 'relative', minWidth: 160 }}>
              <button type="button" onClick={() => setOpenDropdown(openDropdown === key ? null : key)} style={{ padding: '8px 12px', minWidth: 140, textAlign: 'left' }}>
                {label}{selectedCount ? ` (${selectedCount})` : ''} ▾
              </button>
              {openDropdown === key && (
                <div style={{ position: 'absolute', zIndex: 50, top: '110%', left: 0, width: 320, maxHeight: 260, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {filters[key].map(opt => (
                    <label key={opt} style={{ display: 'block', marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        name={key}
                        value={opt}
                        checked={(pending[key] || []).includes(opt)}
                        onChange={handleToggle}
                      />
                      {' '}{opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" style={{ padding: '8px 12px', minWidth: 140 }}>Submit</button>
          <button type="button" onClick={handleClear} style={{ padding: '8px 12px', minWidth: 140 }}>Clear Filters</button>
        </div>
      </form>
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
      {total > pageSize && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Previous</button>
          <span>Page {page} of {Math.ceil(total / pageSize)}</span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page * pageSize >= total}>Next</button>
        </div>
      )}
    </div>
  );
}

export default App;
