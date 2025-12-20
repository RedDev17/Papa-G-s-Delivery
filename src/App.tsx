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
import { Restaurant } from './types';

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
          onAddToCart={cart.addToCart}
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
      
      {(currentView === 'restaurants' || currentView === 'restaurant-menu') && (
        <FloatingCartButton 
          itemCount={cart.getTotalItems()}
          onCartClick={() => handleViewChange('cart')}
        />
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