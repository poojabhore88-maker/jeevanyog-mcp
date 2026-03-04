import { MongoClient, ObjectId } from 'mongodb';
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collName = process.env.COLLECTION_NAME;
const testId = "68f1d8943a12180bab0f7ed6";

async function printDoc() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const coll = db.collection(collName);

        const doc = await coll.findOne({ _id: new ObjectId(testId) });
        console.log(JSON.stringify(doc, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

printDoc();
