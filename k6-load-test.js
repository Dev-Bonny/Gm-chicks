import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '5m', target: 5000 },  // Spike to 5000 users
    { duration: '5m', target: 10000 }, // Spike to 10000 users
    { duration: '5m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test 1: Health check
  let healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get products
  let productsRes = http.get(`${BASE_URL}/api/products?page=1&limit=12`);
  check(productsRes, {
    'get products status is 200': (r) => r.status === 200,
    'products returned': (r) => JSON.parse(r.body).products.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get vaccination schedule
  let vaccinationRes = http.get(`${BASE_URL}/api/vaccinations/schedule?chickType=layer`);
  check(vaccinationRes, {
    'vaccination schedule status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Check farm visit availability
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  let availabilityRes = http.get(`${BASE_URL}/api/visits/availability/${dateStr}`);
  check(availabilityRes, {
    'availability check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);

  // Test 5: Register new user (unique email per virtual user)
  const timestamp = Date.now();
  const vuNum = __VU; // Virtual User number
  const testEmail = `loadtest${vuNum}_${timestamp}@test.com`;
  
  const registerPayload = JSON.stringify({
    name: `Load Test User ${vuNum}`,
    email: testEmail,
    password: 'test123456',
    phone: `254${Math.floor(700000000 + Math.random() * 100000000)}`,
  });

  const registerParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  let registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    registerPayload,
    registerParams
  );

  let token = null;
  if (registerRes.status === 201) {
    const body = JSON.parse(registerRes.body);
    token = body.token;
    
    check(registerRes, {
      'registration successful': (r) => r.status === 201,
      'token received': () => token !== null,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 6: Create order (if registered successfully)
  if (token) {
    // First, get a product ID
    let productsForOrder = http.get(`${BASE_URL}/api/products?limit=1`);
    if (productsForOrder.status === 200) {
      const products = JSON.parse(productsForOrder.body).products;
      if (products.length > 0) {
        const productId = products[0]._id;

        const orderPayload = JSON.stringify({
          items: [
            {
              product: productId,
              quantity: 5,
            },
          ],
          deliveryAddress: {
            street: '123 Test St',
            city: 'Nairobi',
            county: 'Nairobi',
            postalCode: '00100',
          },
          notes: 'Load test order',
        });

        const orderParams = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };

        let orderRes = http.post(
          `${BASE_URL}/api/orders`,
          orderPayload,
          orderParams
        );

        check(orderRes, {
          'order created successfully': (r) => r.status === 201,
        }) || errorRate.add(1);
      }
    }
  }

  sleep(2);
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting load test...');
  console.log(`Target URL: ${BASE_URL}`);
  return { startTime: Date.now() };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration} seconds`);
}