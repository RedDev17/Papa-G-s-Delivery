import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12 flex flex-col pt-16 sm:pt-24 items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <div className="mb-6 flex justify-center">
            <img
              src="/papa.jpg"
              alt="Papa G's Delivery"
              className="w-24 h-24 rounded-full shadow-md object-cover"
              loading="lazy"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add some delicious items to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-delivery-primary text-white px-8 py-3.5 rounded-xl hover:bg-delivery-dark transition-all duration-300 font-semibold shadow-md hover:shadow-xl hover:-translate-y-1"
          >
            Browse Menu
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onContinueShopping}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors duration-200 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline font-medium">Continue Shopping</span>
            <span className="sm:hidden font-medium">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-600 transition-colors duration-200 text-sm font-medium bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100"
          >
            Clear All
          </button>
        </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-4 sm:p-5 ${index !== cartItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              {/* Item info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5 truncate">{item.name}</h3>
                {item.selectedVariation && (
                  <p className="text-xs text-gray-500">Size: {item.selectedVariation.name}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    Add-ons: {item.selectedAddOns.map(addOn => 
                      addOn.quantity && addOn.quantity > 1 
                        ? `${addOn.name} x${addOn.quantity}`
                        : addOn.name
                    ).join(', ')}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">₱{item.totalPrice} each</p>
              </div>
              
              {/* Quantity + price + delete */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-200 transition-colors duration-150"
                  >
                    <Minus className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                  <span className="font-semibold text-gray-900 min-w-[28px] text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-200 transition-colors duration-150"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                </div>
                
                <span className="text-base font-semibold text-gray-900 min-w-[60px] text-right">₱{item.totalPrice * item.quantity}</span>
                
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total + Checkout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-6">
          <span className="text-xl font-bold">Total</span>
          <span className="text-2xl text-delivery-primary">₱{parseFloat(getTotalPrice().toString()).toFixed(2)}</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform bg-delivery-primary text-white hover:bg-delivery-dark hover:-translate-y-1 shadow-md hover:shadow-xl"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
    </div>
  );
};

export default Cart;