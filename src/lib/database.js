const generateStubData = () => {
  const today = new Date();
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const baseRepos = 8000 + Math.floor(Math.random() * 400);
    
    data.push(
      {
        date: dateStr,
        tool: 'GitHub Copilot',
        repo_count: Math.floor(baseRepos * 0.25 + Math.random() * 100),
        pct_of_active_repos: 25.3,
        total_active_repos: baseRepos
      },
      {
        date: dateStr,
        tool: 'Cursor',
        repo_count: Math.floor(baseRepos * 0.16 + Math.random() * 80),
        pct_of_active_repos: 15.8,
        total_active_repos: baseRepos
      },
      {
        date: dateStr,
        tool: 'Claude Dev',
        repo_count: Math.floor(baseRepos * 0.11 + Math.random() * 60),
        pct_of_active_repos: 11.4,
        total_active_repos: baseRepos
      }
    );
  }
  
  return data;
};

const STUB_DATA = generateStubData();

async function getSnapshotsInDateRange(startDate, endDate) {
  console.log(`[STUB] Getting snapshots from ${startDate} to ${endDate}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return STUB_DATA.filter(snapshot => {
    const snapshotDate = new Date(snapshot.date);
    return snapshotDate >= start && snapshotDate <= end;
  });
}

async function initializeDatabase() {
  console.log('[STUB] Database initialization (stub mode)');
}

async function insertSnapshot(snapshot) {
  console.log('[STUB] Inserting snapshot:', snapshot);
}

module.exports = {
  getSnapshotsInDateRange,
  initializeDatabase,
  insertSnapshot
}; 