// Example usage of MongoDB connection and models
require('dotenv').config({ path: '.env.local' });

const dbModels = require('./models');

async function testDatabaseConnection() {
    try {
        console.log('🚀 Testing database connection...');

        // Initialize database connection
        await dbModels.init();

        // Test creating a user
        const testUser = {
            name: 'Usuario de Prueba',
            email: 'test@ugt-granada.es',
            dni: '12345678Z',
            phone: '600000000',
            membershipType: 'affiliate',
            membershipFee: 15
        };

        console.log('👤 Creating test user...');
        // const createdUser = await dbModels.createUser(testUser);
        // console.log('✅ User created:', createdUser);

        // Test getting dashboard stats
        console.log('📊 Getting dashboard statistics...');
        const stats = await dbModels.getDashboardStats();
        console.log('📈 Dashboard Stats:', stats);

        // Test finding user by email
        console.log('🔍 Finding user by email...');
        // const foundUser = await dbModels.findUserByEmail('test@ugt-granada.es');
        // console.log('👤 Found user:', foundUser);

        console.log('✅ Database test completed successfully!');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        // Cleanup connection
        await dbModels.cleanup();
    }
}

// Export for use in other modules
module.exports = { testDatabaseConnection };

// Run test if this file is executed directly
if (require.main === module) {
    testDatabaseConnection();
}