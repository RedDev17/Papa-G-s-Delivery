import React, { useMemo } from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';
import MobileNav from './MobileNav';

// Preload images for better performance
const preloadImages = (items: MenuItem[]) => {
  items.forEach(item => {
    if (item.image) {
      const img = new Image();
      img.src = item.image;
    }
  });
};

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
  searchQuery: string;
}

const Menu: React.FC<MenuProps> = ({ menuItems, addToCart, cartItems, updateQuantity, activeCategory, onCategoryClick, searchQuery }) => {
  const { categories } = useCategories();

  // Preload images when menu items change
  React.useEffect(() => {
    if (menuItems.length > 0) {
      preloadImages(menuItems);
    }
  }, [menuItems]);

  const handleCategoryClickInternal = (categoryId: string) => {
    onCategoryClick(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      const headerHeight = 64; // Header height
      const mobileNavHeight = 60; // Mobile nav height
      const offset = headerHeight + mobileNavHeight + 20; // Extra padding
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };




  return (
    <>
      <MobileNav 
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClickInternal}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Show search results or categories */}
        {searchQuery.trim() ? (
          // Search Results View
          <div>
            {menuItems.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Search Results ({menuItems.length})
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {activeCategory !== 'all' 
                      ? `Found ${menuItems.length} item${menuItems.length !== 1 ? 's' : ''} in ${categories.find(c => c.id === activeCategory)?.name || ''} matching "${searchQuery}"`
                      : `Found ${menuItems.length} item${menuItems.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                    }
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {menuItems.map((item) => {
                    // Find cart item - it might have a unique ID if it has variations/add-ons
                    const cartItem = cartItems.find(cartItem => 
                      cartItem.id.startsWith(item.id) && 
                      cartItem.id.split('-')[0] === item.id
                    );
                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={addToCart}
                        quantity={cartItem?.quantity || 0}
                        onUpdateQuantity={updateQuantity}
                        cartItemId={cartItem?.id}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-6">
                  {activeCategory !== 'all' 
                    ? `We couldn't find any items in ${categories.find(c => c.id === activeCategory)?.name || ''} matching "${searchQuery}"`
                    : `We couldn't find any items matching "${searchQuery}"`
                  }
                </p>
                <button
                  onClick={() => onCategoryClick('all')}
                  className="bg-green-primary text-white px-6 py-3 rounded-lg hover:bg-green-dark transition-colors font-medium"
                >
                  Browse All Items
                </button>
              </div>
            )}
          </div>
        ) : activeCategory !== 'all' ? (
          // Single Category View
          <div>
            {menuItems.length > 0 ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{categories.find(c => c.id === activeCategory)?.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {categories.find(c => c.id === activeCategory)?.name}
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {menuItems.map((item) => {
                    // Find cart item - it might have a unique ID if it has variations/add-ons
                    const cartItem = cartItems.find(cartItem => 
                      cartItem.id.startsWith(item.id) && 
                      cartItem.id.split('-')[0] === item.id
                    );
                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={addToCart}
                        quantity={cartItem?.quantity || 0}
                        onUpdateQuantity={updateQuantity}
                        cartItemId={cartItem?.id}
                      />
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          // Normal Category View (All categories)
          categories.map((category) => {
            const categoryItems = menuItems.filter(item => item.category === category.id);
            
            if (categoryItems.length === 0) return null;
            
            return (
              <section key={category.id} id={category.id} className="mb-12 md:mb-16">
                <div className="flex items-center mb-6 md:mb-8">
                  <span className="text-2xl md:text-3xl mr-2 md:mr-3">{category.icon}</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{category.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {categoryItems.map((item) => {
                    // Find cart item - it might have a unique ID if it has variations/add-ons
                    const cartItem = cartItems.find(cartItem => 
                      cartItem.id.startsWith(item.id) && 
                      cartItem.id.split('-')[0] === item.id
                    );
                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={addToCart}
                        quantity={cartItem?.quantity || 0}
                        onUpdateQuantity={updateQuantity}
                        cartItemId={cartItem?.id}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>
    </>
  );
};

export default Menu;