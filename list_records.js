import { MongoClient } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);
async function list() {
    try {
        await client.connect();
        const db = client.db('bandhan-db');
        const collection = db.collection('reports');
        const records = await collection.find({}).limit(10).toArray();
        console.log(JSON.stringify(records, null, 2));
    } catch (e) { console.error(e); }
    finally { await client.close(); }
}
list();
