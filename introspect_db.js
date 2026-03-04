import { MongoClient } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();

async function introspect() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log("Databases on cluster:", dbs.databases.map(d => d.name));

        const db = client.db(process.env.DB_NAME);
        const collections = await db.listCollections().toArray();
        console.log("Collections in DB:", collections.map(c => c.name));

        for (const colName of collections.map(c => c.name)) {
            const count = await db.collection(colName).countDocuments();
            console.log(`- ${colName}: ${count} docs`);

            // Search for "Rutuja" in this collection
            const found = await db.collection(colName).findOne({
                $or: [
                    { name: /Rutuja/i },
                    { wife_name: /Rutuja/i },
                    { husband_name: /BPMPOPM/i }
                ]
            });
            if (found) {
                console.log(`🎯 FOUND in ${colName}:`, JSON.stringify(found, null, 2));
            }
        }
    } catch (e) { console.error(e); }
    finally { await client.close(); }
}
introspect();
