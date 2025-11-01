(async () => {
  const base = 'http://127.0.0.1:7000/api';
  const doFetch = async (path, opts = {}) => {
    try {
      const res = await fetch(base + path, opts);
      const text = await res.text();
      let body = text;
      try { body = JSON.parse(text); } catch (e) {}
      console.log(`\n=== ${opts.method || 'GET'} ${path} => ${res.status} ===`);
      console.log(body);
      return { status: res.status, body };
    } catch (err) {
      console.error('Fetch error', path, err.message);
      return { error: err.message };
    }
  };

  console.log('Checking health...');
  await doFetch('/health');

  console.log('\nLogging in as EMP001...');
  const login = await doFetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: 'EMP001', password: 'emp', role: 'employee' }) });
  if (!login || !login.body || !login.body.token) {
    console.error('Login failed for EMP001, aborting flows');
    process.exit(1);
  }
  const token = login.body.token;

  const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  console.log('\nPerforming check-in...');
  await doFetch('/attendance/checkin', { method: 'POST', headers: authHeaders });

  console.log('\nListing attendance...');
  await doFetch('/attendance', { method: 'GET', headers: authHeaders });

  console.log('\nPerforming check-out...');
  await doFetch('/attendance/checkout', { method: 'POST', headers: authHeaders });

  console.log('\nListing attendance after checkout...');
  await doFetch('/attendance', { method: 'GET', headers: authHeaders });

  console.log('\nDone');
  process.exit(0);
})();