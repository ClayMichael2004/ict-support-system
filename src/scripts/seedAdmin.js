require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const seedAdmin = async () => {
  try {
    const passwordHash = await bcrypt.hash('Admin@123', 12);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [
        'System Administrator',
        'admin@ictsupport.local',
        passwordHash,
        1, // ADMIN role
      ]
    );

    console.log('✅ Admin user created with ID:', result.insertId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
