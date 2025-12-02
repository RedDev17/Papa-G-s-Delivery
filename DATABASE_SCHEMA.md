# Database Schema Documentation

This document describes the complete database structure for the Papa G's Delivery application.

## Overview

The application uses **Supabase (PostgreSQL)** as the database backend. All tables have Row Level Security (RLS) enabled with appropriate policies for public read access and authenticated admin access.

## Tables

### 1. `restaurants` Table

Stores restaurant information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique restaurant identifier |
| `name` | text | NOT NULL | Restaurant name |
| `type` | text | NOT NULL, CHECK IN ('Restaurant', 'Cafe', 'Fast Food', 'Bakery', 'Desserts') | Restaurant type |
| `image` | text | NOT NULL | Restaurant image URL |
| `logo` | text | NULL | Restaurant logo URL (optional) |
| `rating` | numeric(3,1) | DEFAULT 0.0 | Average rating |
| `review_count` | integer | DEFAULT 0 | Number of reviews |
| `delivery_time` | text | NOT NULL | Delivery time (e.g., "30-45 mins") |
| `delivery_fee` | numeric(10,2) | DEFAULT 0 | Delivery fee amount |
| `description` | text | NULL | Restaurant description |
| `active` | boolean | DEFAULT true | Whether restaurant is active |
| `sort_order` | integer | NOT NULL, DEFAULT 0 | Display order |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_restaurants_active` on `active`
- `idx_restaurants_sort_order` on `sort_order`

**Policies:**
- Public: Can read active restaurants
- Authenticated: Can manage all restaurants

---

### 2. `menu_items` Table

Stores menu items that can belong to restaurants or be general items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique menu item identifier |
| `name` | text | NOT NULL | Menu item name |
| `description` | text | NOT NULL | Menu item description |
| `base_price` | decimal(10,2) | NOT NULL | Base price |
| `category` | text | NOT NULL, FOREIGN KEY → categories(id) | Category ID |
| `popular` | boolean | DEFAULT false | Whether item is popular |
| `available` | boolean | DEFAULT true | Whether item is available |
| `image_url` | text | NULL | Menu item image URL |
| `discount_price` | decimal(10,2) | NULL | Discounted price |
| `discount_start_date` | timestamptz | NULL | Discount start date |
| `discount_end_date` | timestamptz | NULL | Discount end date |
| `discount_active` | boolean | DEFAULT false | Whether discount is active |
| `restaurant_id` | uuid | NULL, FOREIGN KEY → restaurants(id) ON DELETE CASCADE | Restaurant ID (NULL for general items) |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_menu_items_restaurant_id` on `restaurant_id`
- `idx_menu_items_discount_active` on `discount_active`
- `idx_menu_items_discount_dates` on `discount_start_date, discount_end_date`

**Policies:**
- Public: Can read all menu items
- Authenticated: Can manage all menu items

**Relationships:**
- Many menu items can belong to one restaurant (restaurant_id)
- Many menu items can belong to one category (category)
- One menu item can have many variations (variations table)
- One menu item can have many add-ons (add_ons table)

---

### 3. `variations` Table

Stores size/option variations for menu items (e.g., Small, Medium, Large).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique variation identifier |
| `menu_item_id` | uuid | NOT NULL, FOREIGN KEY → menu_items(id) ON DELETE CASCADE | Menu item ID |
| `name` | text | NOT NULL | Variation name (e.g., "Small", "Medium", "Large") |
| `price` | decimal(10,2) | NOT NULL, DEFAULT 0 | Additional price for this variation |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |

**Policies:**
- Public: Can read all variations
- Authenticated: Can manage all variations

**Relationships:**
- Many variations can belong to one menu item (menu_item_id)

---

### 4. `add_ons` Table

Stores add-ons/extras for menu items (e.g., Extra Cheese, Spice Level).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique add-on identifier |
| `menu_item_id` | uuid | NOT NULL, FOREIGN KEY → menu_items(id) ON DELETE CASCADE | Menu item ID |
| `name` | text | NOT NULL | Add-on name (e.g., "Extra Cheese", "Mild", "Hot") |
| `price` | decimal(10,2) | NOT NULL, DEFAULT 0 | Additional price for this add-on |
| `category` | text | NOT NULL | Add-on category (e.g., "spice", "protein", "sauce", "extras") |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |

**Policies:**
- Public: Can read all add-ons
- Authenticated: Can manage all add-ons

**Relationships:**
- Many add-ons can belong to one menu item (menu_item_id)

---

### 5. `categories` Table

Stores menu item categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PRIMARY KEY | Category ID (e.g., "jollibee-burgers", "hot-coffee") |
| `name` | text | NOT NULL | Category name |
| `icon` | text | NOT NULL, DEFAULT '☕' | Category icon (emoji) |
| `sort_order` | integer | NOT NULL, DEFAULT 0 | Display order |
| `active` | boolean | DEFAULT true | Whether category is active |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Policies:**
- Public: Can read active categories
- Authenticated: Can manage all categories

**Relationships:**
- One category can have many menu items (menu_items.category)

---

### 6. `site_settings` Table

Stores site-wide settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PRIMARY KEY | Setting key (e.g., "site_name", "site_logo") |
| `value` | text | NOT NULL | Setting value |
| `type` | text | NOT NULL, DEFAULT 'text' | Setting type (text, image, boolean, number) |
| `description` | text | NULL | Setting description |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Policies:**
- Public: Can read all site settings
- Authenticated: Can manage all site settings

---

### 7. `payment_methods` Table

Stores payment method information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique payment method identifier |
| `name` | text | NOT NULL | Payment method name |
| `account_number` | text | NOT NULL | Account number |
| `account_name` | text | NOT NULL | Account name |
| `qr_code_url` | text | NOT NULL | QR code image URL |
| `active` | boolean | DEFAULT true | Whether payment method is active |
| `sort_order` | integer | DEFAULT 0 | Display order |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Policies:**
- Public: Can read active payment methods
- Authenticated: Can manage all payment methods

---

## Database Functions

### `update_updated_at_column()`

Trigger function that automatically updates the `updated_at` timestamp when a row is updated.

**Used by:**
- `restaurants` table
- `menu_items` table
- `categories` table
- `site_settings` table
- `payment_methods` table

### `is_discount_active(discount_active, discount_start_date, discount_end_date)`

Returns whether a discount is currently active based on the discount_active flag and date range.

**Parameters:**
- `discount_active` (boolean): Whether discount is enabled
- `discount_start_date` (timestamptz): Start date (nullable)
- `discount_end_date` (timestamptz): End date (nullable)

**Returns:** boolean

### `get_effective_price(base_price, discount_price, discount_active, discount_start_date, discount_end_date)`

Returns the effective price (discounted or regular) for a menu item.

**Parameters:**
- `base_price` (decimal): Base price
- `discount_price` (decimal): Discount price (nullable)
- `discount_active` (boolean): Whether discount is enabled
- `discount_start_date` (timestamptz): Start date (nullable)
- `discount_end_date` (timestamptz): End date (nullable)

**Returns:** decimal

---

## Database Triggers

### `update_restaurants_updated_at`
- **Table:** restaurants
- **When:** BEFORE UPDATE
- **Action:** Updates `updated_at` column

### `update_menu_items_updated_at`
- **Table:** menu_items
- **When:** BEFORE UPDATE
- **Action:** Updates `updated_at` column

### `update_categories_updated_at`
- **Table:** categories
- **When:** BEFORE UPDATE
- **Action:** Updates `updated_at` column

### `update_site_settings_updated_at`
- **Table:** site_settings
- **When:** BEFORE UPDATE
- **Action:** Updates `updated_at` column

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

1. **Public Read Access:**
   - Most tables allow public read access
   - Some tables filter by `active` status (restaurants, categories, payment_methods)

2. **Authenticated Admin Access:**
   - All tables allow authenticated users to perform all operations (SELECT, INSERT, UPDATE, DELETE)

---

## Migration Files

The database schema is managed through migration files in `supabase/migrations/`:

1. `20250101000000_add_discount_pricing_and_site_settings.sql` - Adds discount pricing and site settings
2. `20250102000000_create_restaurants_table.sql` - Creates restaurants table
3. `20250103000000_add_restaurant_menu_items.sql` - Adds restaurant_id to menu_items and creates sample data
4. `20250829160942_green_stream.sql` - Creates initial menu items table
5. Additional migrations for various updates

---

## Sample Data

### Jollibee Restaurant

The migration includes sample data for Jollibee restaurant with:
- 8 categories (Burgers, Chicken, Spaghetti, Rice Meals, Breakfast, Desserts, Drinks, Sides)
- 50+ menu items
- Variations for drinks (Regular, Large)
- Complete menu structure

---

## Usage Examples

### Query Menu Items for a Restaurant

```sql
SELECT 
  mi.*,
  json_agg(DISTINCT v.*) as variations,
  json_agg(DISTINCT a.*) as add_ons
FROM menu_items mi
LEFT JOIN variations v ON v.menu_item_id = mi.id
LEFT JOIN add_ons a ON a.menu_item_id = mi.id
WHERE mi.restaurant_id = 'restaurant-uuid'
GROUP BY mi.id;
```

### Query General Menu Items (No Restaurant)

```sql
SELECT * FROM menu_items 
WHERE restaurant_id IS NULL;
```

### Query Active Discounts

```sql
SELECT * FROM menu_items
WHERE discount_active = true
  AND (discount_start_date IS NULL OR discount_start_date <= now())
  AND (discount_end_date IS NULL OR discount_end_date >= now());
```

---

## Notes

1. **Restaurant Menu Items:** Menu items with `restaurant_id` are specific to that restaurant. Menu items with `restaurant_id IS NULL` are general items.

2. **Cascade Deletes:** When a restaurant is deleted, all its menu items are automatically deleted (CASCADE). When a menu item is deleted, all its variations and add-ons are automatically deleted (CASCADE).

3. **Category Foreign Key:** The `category` field in `menu_items` references `categories.id`. Categories must exist before menu items can be created.

4. **Discount Logic:** Discounts are considered active if:
   - `discount_active` is true
   - Current time is within the date range (if dates are set)
   - `discount_price` is not null

5. **Type Safety:** TypeScript types are defined in `src/lib/supabase.ts` to match the database schema.

---

## Database Setup

To set up the database:

1. Create a Supabase project
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run migrations using Supabase CLI or Supabase Dashboard
4. Verify tables and policies are created correctly

---

## Maintenance

- **Backups:** Supabase automatically backs up the database
- **Indexes:** Indexes are created for frequently queried columns
- **Performance:** Use indexes for filtering by `restaurant_id`, `active`, and `sort_order`
- **Security:** RLS policies ensure data access is properly restricted

---

Last Updated: 2025-01-03

