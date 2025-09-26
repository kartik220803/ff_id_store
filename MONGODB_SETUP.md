# MongoDB Atlas Setup Instructions

## Current Configuration
Your MongoDB Atlas connection string has been configured in the `.env` file.

## Important: Set Your Database Password

1. **Replace the placeholder password:**
   - Open `/server/.env` file
   - Find the line: `MONGO_URI=mongodb+srv://kartik220803:<db_password>@cluster0.2ezkwdp.mongodb.net/secondhand-mobiles?retryWrites=true&w=majority&appName=Cluster0`
   - Replace `<db_password>` with your actual MongoDB Atlas password

2. **Example:**
   ```
   # Before (current state):
   MONGO_URI=mongodb+srv://kartik220803:<db_password>@cluster0.2ezkwdp.mongodb.net/secondhand-mobiles?retryWrites=true&w=majority&appName=Cluster0
   
   # After (with your actual password):
   MONGO_URI=mongodb+srv://kartik220803:your_actual_password@cluster0.2ezkwdp.mongodb.net/secondhand-mobiles?retryWrites=true&w=majority&appName=Cluster0
   ```

## Database Setup
- **Database Name:** `secondhand-mobiles`
- **Collections:** The User and Product models will automatically create the following collections:
  - `users` - Stores user authentication details (username, email, hashed password)
  - `products` - Stores mobile phone listings

## User Authentication Schema
Your User model already includes all necessary fields for authentication:
- `name` - User's full name
- `email` - User's email address (unique)
- `password` - Hashed password using bcrypt
- `phone` - User's phone number
- `location` - User's location
- `avatar` - Profile picture URL
- `role` - User role (user/admin)
- `createdAt` - Account creation timestamp

## Security Features
- Passwords are automatically hashed using bcrypt before storing
- JWT tokens are used for authentication
- Email validation with regex pattern
- Password minimum length validation (6 characters)

## Testing the Connection
After setting your password, you can test the connection by starting your server:

```bash
cd server
npm run dev
```

You should see: "MongoDB Connected: cluster0.2ezkwdp.mongodb.net"

## MongoDB Atlas Dashboard
You can monitor your database and view collections at:
https://cloud.mongodb.com/

## Troubleshooting
1. **Authentication Error:** Ensure your password doesn't contain special characters that need URL encoding
2. **Connection Timeout:** Check if your IP address is whitelisted in MongoDB Atlas
3. **Database Access:** Verify that your user has proper database permissions

## Next Steps
Once connected, you can:
1. Register users through your API
2. View user data in MongoDB Atlas dashboard
3. Monitor database performance and usage
