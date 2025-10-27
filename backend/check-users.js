const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  password: String
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    const students = await User.find({ role: 'student' }).select('firstName lastName email');
    console.log('👥 Students found:');
    students.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.firstName} ${student.lastName} (${student.email}) - ID: ${student._id}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();