const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('GM Chicks API Tests', () => {
  let authToken;
  let productId;

  // Close database connection after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('Authentication', () => {
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: 'test123456',
      phone: '254700999888'
    };

    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should not register user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(400);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      
      // Save token for other tests
      authToken = res.body.token;
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
    });
  });

  describe('Products', () => {
    it('should get all products', async () => {
      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      
      // Save first product ID for other tests
      if (res.body.products.length > 0) {
        productId = res.body.products[0]._id;
      }
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products?category=chick');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      if (res.body.products.length > 0) {
        expect(res.body.products[0].category).toBe('chick');
      }
    });

    it('should get single product by ID', async () => {
      if (!productId) {
        console.log('Skipping: No products available');
        return;
      }

      const res = await request(app).get(`/api/products/${productId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product._id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/products/${fakeId}`);
      
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Vaccination Schedule', () => {
    it('should get vaccination schedule', async () => {
      const res = await request(app).get('/api/vaccinations/schedule');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.schedule)).toBe(true);
      expect(res.body.schedule.length).toBeGreaterThan(0);
    });

    it('should get vaccination schedule for broilers', async () => {
      const res = await request(app).get('/api/vaccinations/schedule?chickType=broiler');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chickType).toBe('broiler');
    });

    it('should get upcoming vaccinations', async () => {
      const res = await request(app).get('/api/vaccinations/upcoming?chickAge=10&chickType=layer');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.currentAge).toBe(10);
    });

    it('should get vaccination tips', async () => {
      const res = await request(app).get('/api/vaccinations/tips');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tips)).toBe(true);
    });
  });

  describe('Orders (Protected)', () => {
    it('should not create order without authentication', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ product: productId, quantity: 5 }]
        });
      
      expect(res.statusCode).toBe(401);
    });

    it('should create order with authentication', async () => {
      if (!productId || !authToken) {
        console.log('Skipping: Missing product or auth token');
        return;
      }

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product: productId, quantity: 5 }],
          deliveryAddress: {
            street: '123 Test St',
            city: 'Nairobi',
            county: 'Nairobi',
            postalCode: '00100'
          }
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order).toBeDefined();
    });

    it('should get user orders', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token');
        return;
      }

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  describe('Farm Visits', () => {
    it('should check availability for a date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app).get(`/api/visits/availability/${dateStr}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.available).toBeDefined();
      expect(res.body.spotsLeft).toBeDefined();
    });

    it('should not schedule visit without authentication', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/visits')
        .send({
          visitDate: tomorrow,
          visitTime: '10:00',
          numberOfVisitors: 2,
          purpose: 'tour'
        });
      
      expect(res.statusCode).toBe(401);
    });

    it('should schedule visit with authentication', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token');
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const res = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          visitDate: tomorrow,
          visitTime: '10:00',
          numberOfVisitors: 2,
          purpose: 'tour',
          notes: 'Test visit'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for invalid route', async () => {
      const res = await request(app).get('/api/invalid-route');
      expect(res.statusCode).toBe(404);
    });

    it('should handle invalid ObjectId', async () => {
      const res = await request(app).get('/api/products/invalid-id');
      expect(res.statusCode).toBe(500);
    });
  });
});

// Performance test
describe('Performance Tests', () => {
  it('should handle multiple concurrent requests', async () => {
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(request(app).get('/api/products'));
    }

    const responses = await Promise.all(requests);
    
    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
    });
  });

  it('should respond within acceptable time', async () => {
    const start = Date.now();
    await request(app).get('/api/products');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });
});