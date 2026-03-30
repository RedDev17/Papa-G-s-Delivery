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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-5 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Restaurants</span>
        </button>

        {/* Restaurant header card */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            {restaurant.logo && (
              <img
                src={restaurant.logo}
                alt={`${restaurant.name} logo`}
                className="w-14 h-14 rounded-xl object-contain bg-gray-50 p-1"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
              <RestaurantRating
                restaurantId={restaurant.id}
                currentRating={restaurant.rating}
                reviewCount={restaurant.reviewCount}
                onRatingUpdate={refetchRestaurants}
              />
            </div>
          </div>
          {restaurant.description && (
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{restaurant.description}</p>
          )}
        </div>

        {/* Menu Items by Category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <section key={category} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                {category}
              </h2>
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => {
                const cartItem = cartItems.find(cartItem => 
                  cartItem.id.startsWith(item.id) && 
                  cartItem.id.split('-')[0] === item.id
                );
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
                  variationGroupName: item.variationGroupName,
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-delivery-primary"></div>
            <p className="text-gray-500 mt-3 text-sm">Loading menu...</p>
          </div>
        )}

        {!loading && menuItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-gray-500 text-sm">No menu items available for this restaurant.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMenu;
