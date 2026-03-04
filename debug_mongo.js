import { MongoClient, ObjectId } from 'mongodb';
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collName = process.env.COLLECTION_NAME;
const testId = "68f1d8943a12180bab0f7ed6";

async function checkData() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const coll = db.collection(collName);

        console.log(`Checking ${dbName}.${collName} for ID: ${testId}`);

        // Try as coupleId
        const byCoupleId = await coll.findOne({ coupleId: testId });
        console.log("Found by coupleId:", byCoupleId ? "YES" : "NO");

        // Try as _id
        try {
            const byId = await coll.findOne({ _id: new ObjectId(testId) });
            console.log("Found by _id (ObjectId):", byId ? "YES" : "NO");
            if (byId) {
                console.log("Document keys:", Object.keys(byId));
            }
        } catch (e) {
            console.log("Found by _id (ObjectId): Error (probably not a valid ObjectId string)");
        }

        // List 1 sample to see field names
        const sample = await coll.findOne({});
        if (sample) {
            console.log("\nSample Document Keys:", Object.keys(sample));
            if (sample.coupleId) console.log("Sample coupleId:", sample.coupleId);
            if (sample._id) console.log("Sample _id:", sample._id);
        } else {
            console.log("\nCollection is EMPTY!");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

checkData();
