import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Restaurant, RestaurantMenuItem, CartItem, MenuItem, Variation, AddOn } from '../types';
import MenuItemCard from './MenuItemCard';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
import RestaurantRating from './RestaurantRating';
import { useRestaurants } from '../hooks/useRestaurants';

interface RestaurantMenuProps {
  restaurant: Restaurant;
  cartItems: CartItem[];
  onBack: () => void;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

const RestaurantMenu: React.FC<RestaurantMenuProps> = ({
  restaurant,
  cartItems,
  onBack,
  onAddToCart,
  updateQuantity
}) => {
  const { menuItems, loading } = useRestaurantMenu(restaurant.id);
  const { refetch: refetchRestaurants } = useRestaurants();

  // Group menu items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, RestaurantMenuItem[]> = {};
    menuItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Restaurants</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <RestaurantRating
                restaurantId={restaurant.id}
                currentRating={restaurant.rating}
                reviewCount={restaurant.reviewCount}
                onRatingUpdate={refetchRestaurants}
              />
              {restaurant.description && (
                <p className="text-gray-600 max-w-3xl mt-3">{restaurant.description}</p>
              )}
            </div>
            {restaurant.logo && (
              <div className="hidden md:block">
                <img
                  src={restaurant.logo}
                  alt={`${restaurant.name} logo`}
                  className="w-20 h-20 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Menu Items by Category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {category} ({items.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => {
                // Find cart item - it might have a unique ID if it has variations/add-ons
                const cartItem = cartItems.find(cartItem => 
                  cartItem.id.startsWith(item.id) && 
                  cartItem.id.split('-')[0] === item.id
                );
                // Convert RestaurantMenuItem to MenuItem for MenuItemCard
                const menuItem: MenuItem = {
                  id: item.id,
                  restaurantId: restaurant.id,
                  name: item.name,
                  description: item.description,
                  basePrice: item.basePrice,
                  category: item.category,
                  image: item.image,
                  popular: item.popular,
                  available: item.available,
                  variations: item.variations,
                  addOns: item.addOns,
                  discountPrice: item.discountPrice,
                  discountStartDate: item.discountStartDate,
                  discountEndDate: item.discountEndDate,
                  discountActive: item.discountActive,
                  effectivePrice: item.effectivePrice,
                  isOnDiscount: item.isOnDiscount,
                };
                return (
                  <MenuItemCard
                    key={item.id}
                    item={menuItem}
                    onAddToCart={onAddToCart}
                    quantity={cartItem?.quantity || 0}
                    onUpdateQuantity={updateQuantity}
                    deliveryFee={restaurant.deliveryFee}
                    cartItemId={cartItem?.id}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-primary"></div>
            <p className="text-gray-600 mt-4">Loading menu...</p>
          </div>
        )}

        {!loading && menuItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No menu items available for this restaurant.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMenu;

