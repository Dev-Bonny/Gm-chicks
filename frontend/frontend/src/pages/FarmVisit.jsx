// ============================================
// FILE: frontend/src/pages/FarmVisit.jsx
// ============================================
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FarmVisit() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    visitDate: '',
    visitTime: '10:00',
    numberOfVisitors: 1,
    purpose: 'tour',
    notes: ''
  });
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAvailability = async (date) => {
    if (!date) return;
    try {
      const res = await axios.get(`/api/visits/availability/${date}`);
      setAvailability(res.data);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setFormData({ ...formData, visitDate: date });
    checkAvailability(date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Please login to schedule a visit');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/visits', formData);
      toast.success('Visit scheduled successfully! We will send you a confirmation.');
      setFormData({
        visitDate: '',
        visitTime: '10:00',
        numberOfVisitors: 1,
        purpose: 'tour',
        notes: ''
      });
      setAvailability(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule visit');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h1 className="text-4xl font-bold mb-4">Visit Our Farm</h1>
          <p className="text-gray-600 mb-6">
            See our operations firsthand and learn about modern poultry farming. Our farm tours are educational and perfect for both beginners and experienced farmers.
          </p>

          <div className="bg-primary-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">What to Expect</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Guided tour of our facilities</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>See different breeds and age groups</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Learn about feeding and vaccination</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Q&A with our poultry experts</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Opportunity to purchase on-site</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Farm Location</h3>
            <p className="text-gray-700 mb-4">
              📍 Nairobi, Kenya<br />
              ⏰ Open: Monday - Saturday, 9:00 AM - 5:00 PM<br />
              📞 Phone: +254 700 123 456
            </p>
            <div className="bg-gray-300 h-48 rounded-lg flex items-center justify-center">
              <p className="text-gray-600">[Map Integration Here]</p>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Schedule Your Visit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Visit Date *</label>
                <input
                  type="date"
                  required
                  min={minDateStr}
                  value={formData.visitDate}
                  onChange={handleDateChange}
                  className="input-field"
                />
                {availability && (
                  <p className={`text-sm mt-2 ${availability.available ? 'text-green-600' : 'text-red-600'}`}>
                    {availability.available
                      ? `✓ ${availability.spotsLeft} spots available`
                      : '✗ This date is fully booked'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Time *</label>
                <select
                  required
                  value={formData.visitTime}
                  onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                  className="input-field"
                >
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Visitors *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={formData.numberOfVisitors}
                  onChange={(e) => setFormData({ ...formData, numberOfVisitors: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Purpose *</label>
                <select
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="input-field"
                >
                  <option value="tour">Farm Tour</option>
                  <option value="purchase">Purchase Visit</option>
                  <option value="consultation">Consultation</option>
                  <option value="inspection">Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows="4"
                  placeholder="Any special requests or questions?"
                />
              </div>

              <button
                type="submit"
                disabled={loading || (availability && !availability.available)}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Visit'}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-600 text-center">
                  You'll need to login to complete the booking
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/Learn.jsx
// ============================================
export default function Learn() {
  const articles = [
    {
      title: 'Getting Started with Poultry Farming',
      content: 'Poultry farming is a rewarding venture. Start by choosing the right breed for your goals - layers for eggs or broilers for meat. Ensure proper housing with adequate ventilation and space.',
      icon: '🐣'
    },
    {
      title: 'Feeding Programs for Maximum Growth',
      content: 'Nutrition is crucial. Chicks need starter feed (0-8 weeks) with 20-22% protein, grower feed (8-18 weeks) with 16-18% protein, and layer feed for mature hens with calcium for strong eggshells.',
      icon: '🌾'
    },
    {
      title: 'Disease Prevention & Biosecurity',
      content: 'Prevention is better than cure. Maintain clean housing, provide fresh water, follow vaccination schedules, quarantine new birds, and limit visitor access to your farm.',
      icon: '🏥'
    },
    {
      title: 'Housing Requirements',
      content: 'Provide 2-4 square feet per bird. Ensure good ventilation without drafts. Use deep litter system or raised wire floors. Include nesting boxes for layers (1 box per 4-5 hens).',
      icon: '🏠'
    },
    {
      title: 'Water Management',
      content: 'Clean water is essential. Chickens drink 2-3 times more than they eat. Change water daily, clean waterers regularly, and ensure adequate access points.',
      icon: '💧'
    },
    {
      title: 'Record Keeping',
      content: 'Maintain records of feed consumption, mortality rates, egg production, vaccination dates, and expenses. Good records help identify problems early and improve profitability.',
      icon: '📊'
    }
  ];

  const faqs = [
    {
      q: 'How many chickens should I start with?',
      a: 'Beginners should start with 50-100 birds to learn the basics before scaling up.'
    },
    {
      q: 'What is the profit margin in poultry?',
      a: 'With good management, layers can give 20-30% profit margin, broilers 15-25%.'
    },
    {
      q: 'How long until layers start producing eggs?',
      a: 'Most layer breeds start laying at 18-22 weeks of age.'
    },
    {
      q: 'What is the best breed for beginners?',
      a: 'Kenbro and Kienyeji chickens are hardy and good for beginners in Kenya.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Learning Center</h1>
      <p className="text-gray-600 mb-12">
        Everything you need to know about successful poultry farming
      </p>

      {/* Articles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {articles.map((article, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">{article.icon}</div>
            <h3 className="text-xl font-semibold mb-3">{article.title}</h3>
            <p className="text-gray-600">{article.content}</p>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b pb-4 last:border-b-0">
              <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 bg-primary-500 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Expert Advice?</h2>
        <p className="mb-6">Schedule a farm visit and consult with our poultry experts</p>
        <a href="/farm-visit" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">
          Schedule Consultation
        </a>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/Contact.jsx
// ============================================
import { FiPhone, FiMail, FiMapPin, FiMessageSquare } from 'react-icons/fi';

export default function Contact() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-600 mb-12">
        Get in touch with us for any inquiries or support
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <FiPhone className="text-primary-500 text-2xl mr-4 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Phone</h3>
                <p className="text-gray-600">+254 700 123 456</p>
                <p className="text-gray-600">+254 720 987 654</p>
              </div>
            </div>

            <div className="flex items-start">
              <FiMail className="text-primary-500 text-2xl mr-4 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-gray-600">info@gmchicks.com</p>
                <p className="text-gray-600">sales@gmchicks.com</p>
              </div>
            </div>

            <div className="flex items-start">
              <FiMapPin className="text-primary-500 text-2xl mr-4 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Location</h3>
                <p className="text-gray-600">Nairobi, Kenya</p>
                <p className="text-gray-600">Open: Mon-Sat, 9:00 AM - 5:00 PM</p>
              </div>
            </div>

            <div className="flex items-start">
              <FiMessageSquare className="text-primary-500 text-2xl mr-4 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">WhatsApp</h3>
                <a 
                  href="https://wa.me/254700123456" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-100 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Business Hours</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span>8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input type="text" className="input-field" placeholder="Your name" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" className="input-field" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input type="tel" className="input-field" placeholder="254700123456" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input type="text" className="input-field" placeholder="How can we help?" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea 
                className="input-field" 
                rows="5" 
                placeholder="Your message..."
              />
            </div>

            <button type="submit" className="w-full btn-primary">
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Find Us</h2>
        <div className="bg-gray-300 h-96 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">
            [Google Maps Integration - Add iframe with your location]
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/ProductDetail.jsx
// ============================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`/api/products/${id}`);
      setProduct(res.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link to="/products" className="text-primary-600 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/600x400?text=Chicken';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm mb-6">
        <Link to="/" className="text-primary-600 hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="text-primary-600 hover:underline">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        <div>
          <span className={`inline-block px-3 py-1 text-sm rounded mb-4 ${
            product.category === 'chick' ? 'bg-yellow-100 text-yellow-800' :
            product.category === 'layer' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {product.category}
          </span>
          
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-primary-600 mb-6">
            Ksh {product.price.toLocaleString()}
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-semibold">{product.age}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Breed</p>
                <p className="font-semibold">{product.breed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold capitalize">{product.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="font-semibold">{product.quantity} available</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>

          {product.features && product.features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center space-x-4 mb-6">
              <label className="font-semibold">Quantity:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border rounded hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-16 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="w-10 h-10 border rounded hover:bg-gray-100"
                  disabled={quantity >= product.quantity}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => addToCart(product, quantity)}
              disabled={product.quantity === 0}
              className={`w-full flex items-center justify-center space-x-2 py-4 rounded-lg font-semibold ${
                product.quantity === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              <FiShoppingCart size={20} />
              <span>{product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/AdminDashboard.jsx
// ============================================
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPackage, FiDollarSign, FiUsers, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';

function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data.statistics);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
            </div>
            <FiPackage className="text-4xl text-primary-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Revenue</p>
              <p className="text-3xl font-bold">Ksh {(stats?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <FiDollarSign className="text-4xl text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <FiUsers className="text-4xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Visits</p>
              <p className="text-3xl font-bold">{stats?.pendingVisits || 0}</p>
            </div>
            <FiCalendar className="text-4xl text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="space-y-1">
          <Link
            to="/admin"
            className={`block px-6 py-3 ${
              location.pathname === '/admin' ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : 'hover:bg-gray-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/products"
            className={`block px-6 py-3 ${
              location.pathname.includes('/admin/products') ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : 'hover:bg-gray-50'
            }`}
          >
            Products
          </Link>
          <Link
            to="/admin/orders"
            className={`block px-6 py-3 ${
              location.pathname.includes('/admin/orders') ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : 'hover:bg-gray-50'
            }`}
          >
            Orders
          </Link>
          <Link
            to="/admin/visits"
            className={`block px-6 py-3 ${
              location.pathname.includes('/admin/visits') ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : 'hover:bg-gray-50'
            }`}
          >
            Farm Visits
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="products" element={<div>Products Management (Coming Soon)</div>} />
          <Route path="orders" element={<div>Orders Management (Coming Soon)</div>} />
          <Route path="visits" element={<div>Visits Management (Coming Soon)</div>} />
        </Routes>
      </div>
    </div>
  );
}