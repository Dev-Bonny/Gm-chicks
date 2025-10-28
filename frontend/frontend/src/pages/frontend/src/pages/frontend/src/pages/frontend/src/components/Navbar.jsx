// ============================================
// FILE: frontend/src/components/Navbar.jsx
// ============================================
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl">🐥</span>
              <span className="ml-2 text-xl font-bold text-primary-600">GM Chicks</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="hover:text-primary-600 transition">Products</Link>
            <Link to="/farm-visit" className="hover:text-primary-600 transition">Farm Visit</Link>
            <Link to="/vaccination" className="hover:text-primary-600 transition">Vaccination</Link>
            <Link to="/learn" className="hover:text-primary-600 transition">Learn</Link>
            <Link to="/contact" className="hover:text-primary-600 transition">Contact</Link>
            
            <Link to="/cart" className="relative hover:text-primary-600 transition">
              <FiShoppingCart size={24} />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 hover:text-primary-600">
                  <FiUser size={24} />
                  <span>{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                  <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">Admin Panel</Link>
                  )}
                  <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">Login</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <Link to="/products" className="block px-4 py-2 hover:bg-gray-50">Products</Link>
          <Link to="/farm-visit" className="block px-4 py-2 hover:bg-gray-50">Farm Visit</Link>
          <Link to="/vaccination" className="block px-4 py-2 hover:bg-gray-50">Vaccination</Link>
          <Link to="/learn" className="block px-4 py-2 hover:bg-gray-50">Learn</Link>
          <Link to="/contact" className="block px-4 py-2 hover:bg-gray-50">Contact</Link>
          <Link to="/cart" className="block px-4 py-2 hover:bg-gray-50">Cart ({getCartCount()})</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-50">Dashboard</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="block px-4 py-2 hover:bg-gray-50">Admin Panel</Link>
              )}
              <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-gray-50">Logout</button>
            </>
          ) : (
            <Link to="/login" className="block px-4 py-2 hover:bg-gray-50">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}

// ============================================
// FILE: frontend/src/components/Footer.jsx
// ============================================
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">🐥 GM Chicks</h3>
            <p className="text-gray-400">Quality poultry for your farm. From day-old chicks to mature birds.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-white">Products</Link></li>
              <li><Link to="/farm-visit" className="text-gray-400 hover:text-white">Farm Visit</Link></li>
              <li><Link to="/vaccination" className="text-gray-400 hover:text-white">Vaccination Schedule</Link></li>
              <li><Link to="/learn" className="text-gray-400 hover:text-white">Learning Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white">My Orders</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white">FAQs</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400">
                <FiPhone className="mr-2" />
                <span>+254 700 123 456</span>
              </li>
              <li className="flex items-center text-gray-400">
                <FiMail className="mr-2" />
                <span>info@gmchicks.com</span>
              </li>
              <li className="flex items-start text-gray-400">
                <FiMapPin className="mr-2 mt-1" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 GM Chicks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// FILE: frontend/src/components/PrivateRoute.jsx
// ============================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// ============================================
// FILE: frontend/src/components/AdminRoute.jsx
// ============================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

// ============================================
// FILE: frontend/src/components/ProductCard.jsx
// ============================================
import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Chicken';

  return (
    <div className="card hover:shadow-xl transition-shadow duration-300">
      <Link to={`/products/${product._id}`}>
        <img src={imageUrl} alt={product.name} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/products/${product._id}`}>
            <h3 className="font-semibold text-lg hover:text-primary-600">{product.name}</h3>
          </Link>
          <span className={`px-2 py-1 text-xs rounded ${
            product.category === 'chick' ? 'bg-yellow-100 text-yellow-800' :
            product.category === 'layer' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {product.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{product.age}</p>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-primary-600">Ksh {product.price}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={product.quantity === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              product.quantity === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            <FiShoppingCart />
            <span>{product.quantity === 0 ? 'Out of Stock' : 'Add'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">In stock: {product.quantity}</p>
      </div>
    </div>
  );
}