const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'watchlists.json');
const docsDir = path.join(__dirname, '..', 'docs');

fs.mkdirSync(docsDir, { recursive: true });

const watchlists = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function symbolRows(symbols) {
  return symbols.map(s => {
    const [exchange, ticker] = s.split(':');
    return `      <tr>
        <td>${ticker}</td>
        <td>${exchange}</td>
        <td><a href="https://www.tradingview.com/symbols/${ticker}" target="_blank" rel="noopener">Chart</a></td>
      </tr>`;
  }).join('\n');
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f0f10; color: #e0e0e0; }
  header { background: #1a1a2e; padding: 16px 24px; border-bottom: 1px solid #2a2a3e; }
  header h1 { font-size: 1.2rem; color: #a78bfa; letter-spacing: 0.05em; }
  nav { display: flex; gap: 8px; padding: 16px 24px; flex-wrap: wrap; }
  nav a { padding: 6px 14px; border-radius: 6px; background: #1e1e2e; color: #a78bfa;
          text-decoration: none; font-size: 0.85rem; border: 1px solid #2a2a4e; }
  nav a:hover, nav a.active { background: #a78bfa; color: #0f0f10; }
  .container { padding: 0 24px 40px; }
  .card { background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 10px;
          padding: 20px; margin-top: 16px; }
  .card h2 { font-size: 1rem; color: #c4b5fd; margin-bottom: 4px; }
  .meta { font-size: 0.75rem; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 8px 12px; background: #16162a; color: #888;
       font-weight: 500; border-bottom: 1px solid #2a2a3e; }
  td { padding: 8px 12px; border-bottom: 1px solid #1e1e30; }
  tr:last-child td { border-bottom: none; }
  td:first-child { font-weight: 600; color: #e0e0e0; }
  td:nth-child(2) { color: #888; }
  a { color: #a78bfa; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .badge { display: inline-block; background: #2a2a3e; border-radius: 12px;
           padding: 2px 10px; font-size: 0.75rem; color: #888; margin-left: 8px; }
`;

const navLinks = (activeId) =>
  watchlists.map(w =>
    `<a href="watchlist-${w.id}.html" class="${w.id === activeId ? 'active' : ''}">${w.name} <span class="badge">${w.symbols.length}</span></a>`
  ).join('\n    ') +
  `\n    <a href="index.html" class="${activeId === 'index' ? 'active' : ''}">All</a>`;

// ── Per-watchlist pages ──────────────────────────────────────────────────────
for (const w of watchlists) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${w.name} – Stock Dashboard</title>
  <style>${css}</style>
</head>
<body>
  <header><h1>Stock Dashboard</h1></header>
  <nav>
    ${navLinks(w.id)}
  </nav>
  <div class="container">
    <div class="card">
      <h2>${w.name}</h2>
      <p class="meta">Updated ${formatDate(w.lastUpdated)} ET &nbsp;·&nbsp; ${w.symbols.length} symbols &nbsp;·&nbsp; <a href="${w.url}" target="_blank">View on TradingView</a></p>
      <table>
        <thead><tr><th>Symbol</th><th>Exchange</th><th>Chart</th></tr></thead>
        <tbody>
${symbolRows(w.symbols)}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(docsDir, `watchlist-${w.id}.html`), html);
  console.log(`Generated watchlist-${w.id}.html (${w.symbols.length} symbols)`);
}

// ── Index page (all watchlists combined) ────────────────────────────────────
const allSymbols = [...new Set(watchlists.flatMap(w => w.symbols))].sort();
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stock Dashboard</title>
  <style>${css}</style>
</head>
<body>
  <header><h1>Stock Dashboard</h1></header>
  <nav>
    ${navLinks('index')}
  </nav>
  <div class="container">
    ${watchlists.map(w => `
    <div class="card">
      <h2>${w.name} <span class="badge">${w.symbols.length} symbols</span></h2>
      <p class="meta">Updated ${formatDate(w.lastUpdated)} ET &nbsp;·&nbsp; <a href="watchlist-${w.id}.html">View full list</a> &nbsp;·&nbsp; <a href="${w.url}" target="_blank">TradingView</a></p>
      <table>
        <thead><tr><th>Symbol</th><th>Exchange</th><th>Chart</th></tr></thead>
        <tbody>
${symbolRows(w.symbols.slice(0, 10))}
        </tbody>
      </table>
      ${w.symbols.length > 10 ? `<p style="margin-top:10px;font-size:0.8rem;color:#666">+ ${w.symbols.length - 10} more — <a href="watchlist-${w.id}.html">see all</a></p>` : ''}
    </div>`).join('\n')}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(docsDir, 'index.html'), indexHtml);
console.log(`Generated index.html (${allSymbols.length} unique symbols across all watchlists)`);
