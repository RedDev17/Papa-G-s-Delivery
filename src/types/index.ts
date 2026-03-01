export interface Variation {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  popular?: boolean;
  available?: boolean;
  variations?: Variation[];
  addOns?: AddOn[];
  // Discount pricing fields
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountActive?: boolean;
  // Computed effective price (calculated in the app)
  effectivePrice?: number;
  isOnDiscount?: boolean;
  restaurantId?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedVariation?: Variation;
  selectedAddOns?: AddOn[];
  totalPrice: number;
}

export interface OrderData {
  items: CartItem[];
  customerName: string;
  contactNumber: string;
  serviceType: 'delivery'; // Only delivery is supported
  address: string; // Required for delivery
  paymentMethod: 'gcash' | 'maya' | 'bank-transfer';
  referenceNumber?: string;
  total: number;
  notes?: string;
  landmark?: string;
}

export type PaymentMethod = 'gcash' | 'maya' | 'bank-transfer';
export type ServiceType = 'delivery'; // Only delivery is supported

// Site Settings Types
export interface SiteSetting {
  id: string;
  value: string;
  type: 'text' | 'image' | 'boolean' | 'number';
  description?: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_description: string;
  currency: string;
  currency_code: string;
  service_food_visible: boolean;
  service_pabili_visible: boolean;
  service_padala_visible: boolean;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  type: 'Restaurant' | 'Cafe' | 'Fast Food' | 'Bakery' | 'Desserts';
  image: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string; // e.g., "30-45 mins", "45-60 mins"
  deliveryFee: number; // e.g., 0
  description?: string;
  logo?: string;
  active: boolean;
  sort_order?: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

// Restaurant Menu Item (different from general MenuItem)
export interface RestaurantMenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  popular?: boolean;
  available?: boolean;
  variations?: Variation[];
  addOns?: AddOn[];
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountActive?: boolean;
  effectivePrice?: number;
  isOnDiscount?: boolean;
}

// Grocery Item (for Pabili service)
export interface Grocery {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  unit: string; // e.g., 'piece', 'kg', 'pack', 'bottle'
  available: boolean;
  popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Padala Booking
export interface PadalaBooking {
  id: string;
  customer_name: string;
  contact_number: string;
  pickup_address: string;
  delivery_address: string;
  item_description: string;
  item_weight?: string;
  item_value?: number;
  special_instructions?: string;
  preferred_date?: string;
  preferred_time?: string;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  delivery_fee?: number;
  distance_km?: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Request
export interface Request {
  id: string;
  customer_name: string;
  contact_number: string;
  request_type: string; // e.g., 'custom_order', 'special_request', 'complaint', 'suggestion'
  subject: string;
  description: string;
  address?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// Custom Location (admin-managed address suggestions)
export interface CustomLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}