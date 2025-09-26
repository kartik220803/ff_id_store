# Admin Panel Documentation

## Overview
The FF-ID-STORE admin panel provides comprehensive management capabilities for the gaming marketplace platform.

## Admin Features

### 1. User Management
- **View all users**: Browse all registered users with pagination
- **User details**: View comprehensive user statistics including products listed, comments posted, offers made, and transaction history
- **Delete users**: Remove users and all associated data (products, comments, offers, orders, notifications)
- **Protection**: Admins cannot delete themselves or other admin accounts

### 2. Product Management
- **View all products**: Browse all products with seller information
- **Modify products**: Edit any product details as if you were the seller
- **Delete products**: Remove products and all associated data (comments, offers)
- **Likes management**: Manually adjust the number of likes on any product
- **Status control**: Change product availability status

### 3. Comment Management
- **View all comments**: Browse all comments across all products
- **Add custom comments**: Create comments on behalf of any user
- **Edit comments**: Modify existing comment content
- **Delete comments**: Remove inappropriate or spam comments
- **Admin comments**: Special marking for admin-created comments

### 4. Offer Management
- **View all offers**: See all offers across the platform
- **Product-specific offers**: View all offers for a specific product
- **Offer details**: See buyer information, amounts, status, and timestamps
- **Offer tracking**: Monitor offer acceptance and rejection rates

### 5. Transaction Management
- **View all transactions**: Browse all completed and pending transactions
- **Transaction details**: See buyer, seller, product, amount, and payment status
- **Payment tracking**: Monitor payment success/failure rates
- **Revenue analytics**: Track total platform revenue

### 6. Dashboard Analytics
- **User statistics**: Total registered users
- **Product statistics**: Total products listed and sold
- **Financial metrics**: Total revenue and successful payments
- **Activity monitoring**: Recent users, products, and orders

## API Endpoints

### Authentication
All admin endpoints require admin authentication:
```
Authorization: Bearer <admin_jwt_token>
```

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### User Management
- `GET /api/admin/users` - Get all users (with pagination and filters)
- `GET /api/admin/users/:userId` - Get user details with statistics
- `DELETE /api/admin/users/:userId` - Delete user and associated data

### Product Management
- `GET /api/admin/products` - Get all products (with pagination and filters)
- `PUT /api/admin/products/:productId` - Update product details
- `DELETE /api/admin/products/:productId` - Delete product and associated data
- `PATCH /api/admin/products/:productId/likes` - Update product likes count

### Comment Management
- `GET /api/admin/comments` - Get all comments (with pagination and filters)
- `POST /api/admin/comments` - Create admin comment
- `PUT /api/admin/comments/:commentId` - Update comment content
- `DELETE /api/admin/comments/:commentId` - Delete comment

### Offer Management
- `GET /api/admin/offers` - Get all offers (with pagination and filters)
- `GET /api/admin/products/:productId/offers` - Get offers for specific product

### Transaction Management
- `GET /api/admin/transactions` - Get all transactions (with pagination and filters)

## How to Create Admin Users

### Method 1: Using the Promotion Script
1. Register a user normally through the frontend
2. Run the promotion script from the server directory:
```bash
node utils/promoteAdmin.js user@example.com
```

### Method 2: Direct Database Update
1. Connect to MongoDB
2. Update the user's role field:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

## Security Features

### Admin Middleware
- JWT token validation
- Role-based access control
- Automatic user lookup and role verification
- Comprehensive error handling

### Route Protection
- All admin routes are protected by the admin middleware
- Non-admin users receive 403 Forbidden responses
- Invalid tokens are rejected with appropriate error messages

### Data Protection
- Admins cannot delete themselves
- Cascading deletes ensure data integrity
- Transaction logs are maintained for audit purposes

## Frontend Access

### Admin Dashboard Route
- URL: `/admin`
- Protected by AdminRoute component
- Automatic redirect for non-admin users
- Responsive design for mobile and desktop

### Navigation
- Admin Dashboard link appears in the navbar for admin users only
- Easy access to all admin functions through tabbed interface

## Usage Guidelines

### Best Practices
1. **User Management**: Only delete spam or problematic accounts
2. **Product Management**: Use likes adjustment sparingly and for legitimate reasons
3. **Comment Moderation**: Remove inappropriate content promptly
4. **Data Monitoring**: Regularly review transaction patterns for fraud detection

### Monitoring
- Monitor dashboard statistics daily
- Review user activity patterns
- Track payment success rates
- Investigate unusual offer patterns

## Support
For technical issues or feature requests related to the admin panel, contact the development team.
