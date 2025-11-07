const mongoConnection = require('./mongodb');

// Database models and schemas for UGT-CLM-UGR

class DatabaseModels {
    constructor() {
        this.db = null;
    }

    async init() {
        this.db = await mongoConnection.connect();
        await this.createIndexes();
        console.log('📋 Database models initialized');
    }

    async createIndexes() {
        try {
            // Users collection indexes
            await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
            await this.db.collection('users').createIndex({ dni: 1 }, { unique: true });

            // Courses collection indexes
            await this.db.collection('courses').createIndex({ title: 1 });
            await this.db.collection('courses').createIndex({ status: 1 });

            // Enrollments collection indexes
            await this.db.collection('enrollments').createIndex({ userId: 1, courseId: 1 }, { unique: true });
            await this.db.collection('enrollments').createIndex({ status: 1 });

            // Payments collection indexes
            await this.db.collection('payments').createIndex({ userId: 1 });
            await this.db.collection('payments').createIndex({ stripePaymentId: 1 }, { unique: true });
            await this.db.collection('payments').createIndex({ status: 1 });

            console.log('✅ Database indexes created');
        } catch (error) {
            console.error('❌ Error creating indexes:', error);
        }
    }

    // User-related methods
    async createUser(userData) {
        try {
            const user = {
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                role: 'member' // member, admin
            };

            const result = await mongoConnection.insertOne('users', user);
            return { ...user, _id: result.insertedId };
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('El email o DNI ya está registrado');
            }
            throw error;
        }
    }

    async findUserByEmail(email) {
        return await mongoConnection.findOne('users', { email, isActive: true });
    }

    async findUserByDNI(dni) {
        return await mongoConnection.findOne('users', { dni, isActive: true });
    }

    async updateUser(userId, updateData) {
        const updateDoc = {
            $set: {
                ...updateData,
                updatedAt: new Date()
            }
        };

        return await mongoConnection.updateOne('users', { _id: userId }, updateDoc);
    }

    // Course-related methods
    async createCourse(courseData) {
        const course = {
            ...courseData,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            status: 'active' // active, inactive, completed
        };

        const result = await mongoConnection.insertOne('courses', course);
        return { ...course, _id: result.insertedId };
    }

    async getAllCourses() {
        return await mongoConnection.findMany('courses', { isActive: true });
    }

    async getCourseById(courseId) {
        return await mongoConnection.findOne('courses', { _id: courseId, isActive: true });
    }

    // Enrollment-related methods
    async enrollUser(userId, courseId, enrollmentType = 'standard') {
        try {
            const enrollment = {
                userId,
                courseId,
                enrollmentType, // standard, affiliate
                status: 'active', // active, completed, cancelled
                progress: 0,
                enrolledAt: new Date(),
                updatedAt: new Date()
            };

            const result = await mongoConnection.insertOne('enrollments', enrollment);
            return { ...enrollment, _id: result.insertedId };
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('El usuario ya está inscrito en este curso');
            }
            throw error;
        }
    }

    async getUserEnrollments(userId) {
        return await mongoConnection.findMany('enrollments', {
            userId,
            status: { $ne: 'cancelled' }
        });
    }

    async updateEnrollmentProgress(enrollmentId, progress) {
        const updateDoc = {
            $set: {
                progress,
                updatedAt: new Date()
            }
        };

        return await mongoConnection.updateOne('enrollments', { _id: enrollmentId }, updateDoc);
    }

    // Payment-related methods
    async createPayment(paymentData) {
        const payment = {
            ...paymentData,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending' // pending, completed, failed, refunded
        };

        const result = await mongoConnection.insertOne('payments', payment);
        return { ...payment, _id: result.insertedId };
    }

    async updatePaymentStatus(paymentId, status, additionalData = {}) {
        const updateDoc = {
            $set: {
                status,
                ...additionalData,
                updatedAt: new Date()
            }
        };

        return await mongoConnection.updateOne('payments', { _id: paymentId }, updateDoc);
    }

    async getPaymentByStripeId(stripePaymentId) {
        return await mongoConnection.findOne('payments', { stripePaymentId });
    }

    async getUserPayments(userId) {
        return await mongoConnection.findMany('payments', { userId });
    }

    // Analytics and statistics
    async getDashboardStats() {
        try {
            const [
                totalUsers,
                activeUsers,
                totalCourses,
                totalEnrollments,
                totalRevenue
            ] = await Promise.all([
                mongoConnection.findMany('users', {}).then(users => users.length),
                mongoConnection.findMany('users', { isActive: true }).then(users => users.length),
                mongoConnection.findMany('courses', { isActive: true }).then(courses => courses.length),
                mongoConnection.findMany('enrollments', { status: 'active' }).then(enrollments => enrollments.length),
                mongoConnection.findMany('payments', { status: 'completed' }).then(payments =>
                    payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
                )
            ]);

            return {
                totalUsers,
                activeUsers,
                totalCourses,
                totalEnrollments,
                totalRevenue,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
            throw error;
        }
    }

    // Cleanup and maintenance
    async cleanup() {
        await mongoConnection.disconnect();
    }
}

module.exports = new DatabaseModels();