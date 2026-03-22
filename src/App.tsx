import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import Hero from './components/Hero';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import FloatingCartButton from './components/FloatingCartButton';
import AdminDashboard from './components/AdminDashboard';
import RestaurantList from './components/RestaurantList';
import RestaurantMenu from './components/RestaurantMenu';
import ServiceSelection from './components/ServiceSelection';
import PadalaBooking from './components/PadalaBooking';
import Requests from './components/Requests';
import { useRestaurants } from './hooks/useRestaurants';
import { Restaurant, MenuItem, Variation, AddOn } from './types';

function ServiceSelectionPage() {
  const navigate = useNavigate();
  
  const handleServiceSelect = (service: 'food' | 'pabili' | 'padala' | 'requests') => {
    switch (service) {
      case 'food':
        navigate('/food');
        break;
      case 'pabili':
        navigate('/pabili');
        break;
      case 'padala':
        navigate('/padala');
        break;
      case 'requests':
        navigate('/requests');
        break;
    }
  };

  return <ServiceSelection onServiceSelect={handleServiceSelect} />;
}

function FoodService() {
  const navigate = useNavigate();
  const cart = useCart();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [currentView, setCurrentView] = React.useState<'restaurants' | 'restaurant-menu' | 'cart' | 'checkout'>('restaurants');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);

  // Toast notification state
  const [toast, setToast] = React.useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-restaurant warning dialog state
  const [pendingItem, setPendingItem] = React.useState<{
    item: MenuItem;
    quantity: number;
    variation?: Variation;
    addOns?: AddOn[];
  } | null>(null);

  const showToast = React.useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  }, []);

  // Wrapped addToCart that checks for multi-restaurant
  const handleAddToCart = React.useCallback((item: MenuItem, quantity: number = 1, variation?: Variation, addOns?: AddOn[]) => {
    const existingRestaurantIds = new Set(cart.cartItems.map(ci => ci.restaurantId).filter(Boolean));
    const isNewRestaurant = item.restaurantId && existingRestaurantIds.size > 0 && !existingRestaurantIds.has(item.restaurantId);

    if (isNewRestaurant) {
      // Show warning dialog
      setPendingItem({ item, quantity, variation, addOns });
    } else {
      // Add directly
      cart.addToCart(item, quantity, variation, addOns);
      showToast(`${item.name} added to cart!`);
    }
  }, [cart, showToast]);

  const confirmPendingAdd = React.useCallback(() => {
    if (pendingItem) {
      cart.addToCart(pendingItem.item, pendingItem.quantity, pendingItem.variation, pendingItem.addOns);
      showToast(`${pendingItem.item.name} added to cart!`);
      setPendingItem(null);
    }
  }, [pendingItem, cart, showToast]);

  const cancelPendingAdd = React.useCallback(() => {
    setPendingItem(null);
  }, []);

  const handleViewChange = (view: 'restaurants' | 'restaurant-menu' | 'cart' | 'checkout') => {
    setCurrentView(view);
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentView('restaurant-menu');
  };

  const handleBackToRestaurants = () => {
    setSelectedRestaurant(null);
    setCurrentView('restaurants');
  };

  const handleBackToServices = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-offwhite font-inter">
      <Header 
        cartItemsCount={cart.getTotalItems()}
        onCartClick={() => handleViewChange('cart')}
        onMenuClick={handleBackToServices}
        hideCart={currentView === 'cart' || currentView === 'checkout'}
      />

      {/* Back to Services pill - only visible on food homepage (restaurants view) */}
      {currentView === 'restaurants' && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <button
            onClick={handleBackToServices}
            className="absolute z-10 left-0 top-0 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-delivery-primary text-white text-sm sm:text-base font-medium shadow hover:bg-delivery-dark transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Services</span>
          </button>
        </div>
      )}
      
      {currentView === 'restaurants' && (
        <>
          <Hero 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            restaurantCount={restaurants.length}
          />
          <RestaurantList
            restaurants={restaurants}
            searchQuery={searchQuery}
            onRestaurantClick={handleRestaurantClick}
            loading={restaurantsLoading}
          />
        </>
      )}

      {currentView === 'restaurant-menu' && selectedRestaurant && (
        <RestaurantMenu
          restaurant={selectedRestaurant}
          cartItems={cart.cartItems}
          onBack={handleBackToRestaurants}
          onAddToCart={handleAddToCart}
          updateQuantity={cart.updateQuantity}
        />
      )}
      
      {currentView === 'cart' && (
        <Cart 
          cartItems={cart.cartItems}
          updateQuantity={cart.updateQuantity}
          removeFromCart={cart.removeFromCart}
          clearCart={cart.clearCart}
          getTotalPrice={cart.getTotalPrice}
          onContinueShopping={() => handleViewChange('restaurants')}
          onCheckout={() => handleViewChange('checkout')}
        />
      )}
      
      {currentView === 'checkout' && (
        <Checkout 
          cartItems={cart.cartItems}
          totalPrice={cart.getTotalPrice()}
          onBack={() => handleViewChange('cart')}
        />
      )}
      
      {currentView === 'restaurants' || currentView === 'restaurant-menu' ? (
        <FloatingCartButton 
          itemCount={cart.getTotalItems()}
          onCartClick={() => handleViewChange('cart')}
        />
      ) : null}

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast.visible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <span className="text-green-400 text-lg">✓</span>
          {toast.message}
        </div>
      </div>

      {/* Multi-Restaurant Warning Dialog */}
      {pendingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Different Restaurant
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You're adding an item from a different restaurant. Each restaurant will have a <span className="font-semibold text-gray-900">separate delivery fee</span>.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Would you like to continue?
              </p>
            </div>
            <div className="border-t border-gray-100 flex">
              <button
                onClick={cancelPendingAdd}
                className="flex-1 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200 border-r border-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmPendingAdd}
                className="flex-1 py-3.5 text-sm font-semibold text-delivery-primary hover:bg-red-50 transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PabiliService() {
  const navigate = useNavigate();
  return <PadalaBooking title="Pabili" mode="simple" onBack={() => navigate('/')} />;
}

function PadalaService() {
  const navigate = useNavigate();
  return <PadalaBooking title="Padala" mode="full" onBack={() => navigate('/')} />;
}

function RequestsService() {
  const navigate = useNavigate();
  return <Requests onBack={() => navigate('/')} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ServiceSelectionPage />} />
        <Route path="/food" element={<FoodService />} />
        <Route path="/pabili" element={<PabiliService />} />
        <Route path="/padala" element={<PadalaService />} />
        <Route path="/requests" element={<RequestsService />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;