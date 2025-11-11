const { MongoClient, ServerApiVersion } = require('mongodb');

class MongoDBConnection {
    constructor() {
        this.client = null;
        this.db = null;

        // SECURITY: MongoDB URI must be configured via environment variable
        if (!process.env.MONGODB_URI) {
            throw new Error(
                '❌ MONGODB_URI no configurada.\n' +
                'Esta variable es REQUERIDA para producción.\n' +
                'Configúrala en Vercel → Settings → Environment Variables'
            );
        }

        this.uri = process.env.MONGODB_URI;
        this.dbName = "ugt_sindical";
    }

    async connect() {
        try {
            if (this.client) {
                console.log('Already connected to MongoDB');
                return this.db;
            }

            // Create a MongoClient with a MongoClientOptions object to set the Stable API version
            this.client = new MongoClient(this.uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
                maxPoolSize: 10, // Maximum number of connections in the connection pool
                serverSelectionTimeoutMS: 5000, // How long to try selecting a server before giving up
                socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timing out
            });

            // Connect the client to the server
            await this.client.connect();

            // Select the database
            this.db = this.client.db(this.dbName);

            // Send a ping to confirm a successful connection
            await this.client.db("admin").command({ ping: 1 });
            console.log("✅ Successfully connected to MongoDB Atlas!");
            console.log(`📊 Using database: ${this.dbName}`);

            return this.db;
        } catch (error) {
            console.error('❌ Error connecting to MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
                console.log('✅ Disconnected from MongoDB');
            }
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    getDatabase() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    getCollection(collectionName) {
        const db = this.getDatabase();
        return db.collection(collectionName);
    }

    // Helper methods for common operations
    async findOne(collectionName, query) {
        const collection = this.getCollection(collectionName);
        return await collection.findOne(query);
    }

    async findMany(collectionName, query = {}, options = {}) {
        const collection = this.getCollection(collectionName);
        return await collection.find(query, options).toArray();
    }

    async insertOne(collectionName, document) {
        const collection = this.getCollection(collectionName);
        const result = await collection.insertOne(document);
        return result;
    }

    async insertMany(collectionName, documents) {
        const collection = this.getCollection(collectionName);
        const result = await collection.insertMany(documents);
        return result;
    }

    async updateOne(collectionName, query, update, options = {}) {
        const collection = this.getCollection(collectionName);
        const result = await collection.updateOne(query, update, options);
        return result;
    }

    async updateMany(collectionName, query, update, options = {}) {
        const collection = this.getCollection(collectionName);
        const result = await collection.updateMany(query, update, options);
        return result;
    }

    async deleteOne(collectionName, query) {
        const collection = this.getCollection(collectionName);
        const result = await collection.deleteOne(query);
        return result;
    }

    async deleteMany(collectionName, query) {
        const collection = this.getCollection(collectionName);
        const result = await collection.deleteMany(query);
        return result;
    }
}

// Create and export a singleton instance
const mongoConnection = new MongoDBConnection();

module.exports = mongoConnection;