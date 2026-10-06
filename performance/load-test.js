import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loanLatency = new Trend('loan_latency', true);

export const options = {
  stages: [
    { duration: '30s', target: 5 },  // ramp up
    { duration: '1m', target: 10 },  // steady state
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.05'],
    'loan_latency': ['p(95)<300'],
    'http_req_duration{name:list}': ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export function setup() {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const studentEmail = `perf_${randomSuffix}@example.com`;
  const password = 'Password123!';

  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      name: 'Perf Student',
      email: studentEmail,
      student_id: `6600${Math.floor(1000 + Math.random() * 9000)}`,
      password: password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = null;
  if (registerRes.status === 201 || registerRes.status === 200) {
    try {
      token = registerRes.json().access_token;
    } catch (_) {}
  }

  if (!token) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: studentEmail, password: password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (loginRes.status === 200) {
      try {
        token = loginRes.json().access_token;
      } catch (_) {}
    }
  }

  return { token };
}

export default function (data) {
  const authHeaders = data && data.token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
      }
    : { 'Content-Type': 'application/json' };

  // Journey 1: Browse and Search Catalog
  group('Browse and search', () => {
    // 1. List catalog books
    const listRes = http.get(`${BASE_URL}/api/books`, {
      headers: authHeaders,
      tags: { name: 'list' },
    });
    const listOk = check(listRes, {
      'list status 200': (r) => r.status === 200,
      'list has items': (r) => {
        try {
          return Array.isArray(r.json());
        } catch (_) {
          return false;
        }
      },
    });
    errorRate.add(!listOk);
    sleep(1); // think time

    // 2. Search books with keyword
    const searchRes = http.get(`${BASE_URL}/api/books?q=Algorithms`, {
      headers: authHeaders,
      tags: { name: 'search' },
    });
    const searchOk = check(searchRes, {
      'search status 200': (r) => r.status === 200,
    });
    errorRate.add(!searchOk);
    sleep(1); // think time
  });

  // Journey 2: User Dashboard & Loan Management
  group('My loans dashboard', () => {
    const loansRes = http.get(`${BASE_URL}/api/loans/me`, {
      headers: authHeaders,
      tags: { name: 'my_loans' },
    });
    const loansOk = check(loansRes, {
      'my loans status 200': (r) => r.status === 200,
    });
    errorRate.add(!loansOk);
    loanLatency.add(loansRes.timings.duration);
    sleep(2); // think time
  });
}
