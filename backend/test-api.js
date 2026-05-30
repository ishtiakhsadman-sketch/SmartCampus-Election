const fetch = require('node-fetch');

async function test() {
  // 1. Login as admin to get token
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@smartcampus.edu', password: 'Admin@12345' })
  });
  const loginData = await loginRes.json();
  
  if (!loginData.token) {
    console.error('Login failed:', loginData);
    return;
  }
  console.log('Login success! Token received.');

  // 2. Call /api/admin/positions with token
  const posRes = await fetch('http://localhost:5001/api/admin/positions', {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const posData = await posRes.json();
  
  console.log('\nPositions API response:');
  console.log('Success:', posData.success);
  console.log('Count:', posData.positions?.length);
  posData.positions?.slice(0, 3).forEach(p => {
    console.log(`  ${p.title}: candidateCount=${p.candidateCount}`);
  });
}

test().catch(console.error);
