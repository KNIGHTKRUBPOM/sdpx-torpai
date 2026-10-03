import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health' },
  });

  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health is ok': (r) => {
      try {
        return r.json().status === 'ok';
      } catch (_) {
        return false;
      }
    },
    'response < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
