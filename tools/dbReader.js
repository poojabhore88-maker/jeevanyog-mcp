import { MongoClient, ObjectId } from 'mongodb';

// Initializing MongoClient inside the function to ensure process.env is ready
export async function getJeevanYog(coupleId) {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    coupleId = coupleId.trim();
    try {
        await client.connect();

        // Dynamic DB and Collection names from .env
        const dbName = process.env.DB_NAME || 'bandhan-db';
        const collName = process.env.COLLECTION_NAME || 'reports';

        const database = client.db(dbName);
        const collection = database.collection(collName);

        // Find the data: try coupleId first, then _id (string), then _id (ObjectId)
        console.log(`🔍 Searching MongoDB (${dbName}.${collName}) for identifier: ${coupleId}`);
        let data = await collection.findOne({ coupleId: coupleId });

        if (!data) {
            console.log(`ℹ️ Not found as coupleId, trying as _id (string)...`);
            data = await collection.findOne({ _id: coupleId });
        }

        if (!data && ObjectId.isValid(coupleId)) {
            const oid = new ObjectId(coupleId);
            console.log(`ℹ️ Not found as string _id, trying as _id (ObjectId: ${oid.toString()})...`);
            data = await collection.findOne({ _id: oid });
        }

        return data;
    } catch (error) {
        console.error("❌ Database Error:", error);
        throw error;
    } finally {
        await client.close();
    }
}
