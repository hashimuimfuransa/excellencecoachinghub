const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/excellencecoachinghub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      console.log('Super admin details:', {
        name: `${existingSuperAdmin.firstName} ${existingSuperAdmin.lastName}`,
        email: existingSuperAdmin.email,
        role: existingSuperAdmin.role,
        isActive: existingSuperAdmin.isActive
      });
    } else {
      // Create super admin user
      const hashedPassword = await bcrypt.hash('superadmin123', 12);
      
      const superAdmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@excellencecoaching.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      });
      
      await superAdmin.save();
      console.log('Super admin created successfully!');
      console.log('Email: superadmin@excellencecoaching.com');
      console.log('Password: superadmin123');
    }
    
    // Show all users and their roles
    const allUsers = await User.find({}, 'firstName lastName email role isActive');
    console.log('\nAll users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();