// ============================================
// FILE: frontend/src/pages/Cart.jsx
// ============================================
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <FiShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {cart.map((item) => (
            <div key={item._id} className="bg-white p-6 rounded-lg shadow-md mb-4">
              <div className="flex gap-4">
                <img
                  src={item.images?.[0]?.url || 'https://via.placeholder.com/100'}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.age}</p>
                  <p className="text-primary-600 font-bold mt-2">Ksh {item.price}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 size={20} />
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-8 h-8 border rounded hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-8 h-8 border rounded hover:bg-gray-100"
                      disabled={item.quantity >= item.quantity}
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold mt-2">
                    Ksh {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Ksh {getCartTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Ksh {getCartTotal().toLocaleString()}</span>
              </div>
            </div>
            <button onClick={handleCheckout} className="w-full btn-primary mb-4">
              Proceed to Checkout
            </button>
            <Link to="/products" className="block text-center text-primary-600 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/Checkout.jsx
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: user?.phone || '',
    deliveryAddress: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      county: user?.address?.county || '',
      postalCode: user?.address?.postalCode || ''
    },
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order
      const orderRes = await axios.post('/api/orders', {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity
        })),
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes
      });

      const order = orderRes.data.order;

      // Initiate payment
      const paymentRes = await axios.post('/api/payments/initiate', {
        orderId: order._id,
        phoneNumber: formData.phoneNumber
      });

      if (paymentRes.data.success) {
        toast.success('Payment request sent! Check your phone.');
        clearCart();
        navigate(`/dashboard`);
      } else {
        toast.error('Payment initiation failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div>
                <label className="block text-sm font-medium mb-2">
                  MPesa Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="input-field"
                  placeholder="254700123456"
                />
                <p className="text-xs text-gray-500 mt-1">Payment will be sent to this number</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, street: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress, city: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">County *</label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress.county}
                      onChange={(e) => setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress, county: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.postalCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, postalCode: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Any special instructions for delivery?"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay Ksh ${getCartTotal().toLocaleString()} via MPesa`}
            </button>
          </form>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>Ksh {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Ksh {getCartTotal().toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 You will receive an MPesa prompt on your phone to complete the payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/Vaccination.jsx
// ============================================
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiInfo } from 'react-icons/fi';

export default function Vaccination() {
  const [schedule, setSchedule] = useState([]);
  const [tips, setTips] = useState([]);
  const [chickType, setChickType] = useState('layer');
  const [chickAge, setChickAge] = useState('');
  const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);

  useEffect(() => {
    fetchSchedule();
    fetchTips();
  }, [chickType]);

  useEffect(() => {
    if (chickAge) {
      fetchUpcoming();
    }
  }, [chickAge, chickType]);

  const fetchSchedule = async () => {
    try {
      const res = await axios.get(`/api/vaccinations/schedule?chickType=${chickType}`);
      setSchedule(res.data.schedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchTips = async () => {
    try {
      const res = await axios.get('/api/vaccinations/tips');
      setTips(res.data.tips);
    } catch (error) {
      console.error('Error fetching tips:', error);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await axios.get(`/api/vaccinations/upcoming?chickAge=${chickAge}&chickType=${chickType}`);
      setUpcomingVaccinations(res.data.upcomingVaccinations);
    } catch (error) {
      console.error('Error fetching upcoming:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Vaccination Schedule</h1>
      <p className="text-gray-600 mb-8">
        Keep your chickens healthy with our comprehensive vaccination schedule
      </p>

      {/* Age Calculator */}
      <div className="bg-primary-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Check Upcoming Vaccinations</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Chicken Type</label>
            <select
              value={chickType}
              onChange={(e) => setChickType(e.target.value)}
              className="input-field"
            >
              <option value="layer">Layer</option>
              <option value="broiler">Broiler</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Current Age (days)</label>
            <input
              type="number"
              value={chickAge}
              onChange={(e) => setChickAge(e.target.value)}
              className="input-field"
              placeholder="e.g., 14"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchUpcoming}
              className="btn-primary w-full"
              disabled={!chickAge}
            >
              Check Schedule
            </button>
          </div>
        </div>

        {upcomingVaccinations.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg">
            <h3 className="font-semibold mb-3">📅 Your Next Vaccinations:</h3>
            <div className="space-y-2">
              {upcomingVaccinations.slice(0, 3).map((vacc, idx) => (
                <div key={idx} className="flex items-start p-3 bg-green-50 rounded">
                  <FiCalendar className="mt-1 mr-3 text-green-600" />
                  <div>
                    <p className="font-semibold">Day {vacc.day}: {vacc.vaccine}</p>
                    <p className="text-sm text-gray-600">{vacc.method}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Schedule */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-2xl font-bold">Complete Vaccination Schedule</h2>
          <p className="text-gray-600 mt-2">For {chickType === 'layer' ? 'Layer' : 'Broiler'} Chickens</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Day</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Vaccine</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Method</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedule.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Day {item.day}</td>
                  <td className="px-6 py-4">{item.vaccine}</td>
                  <td className="px-6 py-4 text-sm">{item.method}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Vaccination Tips & Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-start p-4 bg-blue-50 rounded-lg">
              <FiInfo className="mt-1 mr-3 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{tip.title}</h3>
                <p className="text-sm text-gray-700">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: frontend/src/pages/Dashboard.jsx
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiPackage, FiCalendar, FiUser, FiClock } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, visitsRes] = await Promise.all([
        axios.get('/api/orders'),
        axios.get('/api/visits')
      ]);
      setOrders(ordersRes.data.orders);
      setVisits(visitsRes.data.visits);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Manage your orders and farm visits</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <FiPackage className="text-4xl text-primary-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-2xl font-bold">
                {orders.filter(o => o.orderStatus === 'pending').length}
              </p>
            </div>
            <FiClock className="text-4xl text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Farm Visits</p>
              <p className="text-2xl font-bold">{visits.length}</p>
            </div>
            <FiCalendar className="text-4xl text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Account</p>
              <p className="text-sm font-semibold text-primary-600">{user?.role}</p>
            </div>
            <FiUser className="text-4xl text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p>No orders yet</p>
              <Link to="/products" className="text-primary-600 hover:underline mt-2 inline-block">
                Start shopping
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">{order.items.length} items</td>
                    <td className="px-6 py-4 font-semibold">
                      Ksh {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upcoming Visits */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Farm Visits</h2>
          <Link to="/farm-visit" className="text-primary-600 hover:underline text-sm">
            Schedule New Visit
          </Link>
        </div>
        <div className="p-6">
          {visits.length === 0 ? (
            <div className="text-center text-gray-600">
              <p>No scheduled visits</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.slice(0, 3).map((visit) => (
                <div key={visit._id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {new Date(visit.visitDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{visit.visitTime}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {visit.numberOfVisitors} visitor(s)
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded ${getStatusColor(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}