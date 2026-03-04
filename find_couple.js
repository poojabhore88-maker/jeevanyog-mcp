import { MongoClient } from 'mongodb';
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function find() {
    try {
        await client.connect();
        const dbName = process.env.DB_NAME || 'bandhan-db';
        const collName = process.env.COLLECTION_NAME || 'reports';
        const db = client.db(dbName);
        const collection = db.collection(collName);

        console.log(`🔍 Searching ${dbName}.${collName} for couple...`);

        // Search by name or coupleId or even substring
        const results = await collection.find({
            $or: [
                { _id: "68f1d8943a12180bab0f7ed6" },
                { coupleId: "68f1d8943a12180bab0f7ed6" }
            ]
        }).toArray();

        if (results.length === 0) {
            console.log("❌ No couple found with that name.");
        } else {
            results.forEach(r => {
                console.log(`✅ Found: ${r.name} | coupleId: ${r.coupleId || r._id}`);
            });
        }
    } catch (error) {
        console.error("❌ Search failed:", error);
    } finally {
        await client.close();
    }
}

find();
