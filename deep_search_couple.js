import { MongoClient } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();

async function deepSearch() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const collections = await db.listCollections().toArray();

        console.log(`🔎 Systematic Search for "Rutuja" or "BPMPOPM" in ${process.env.DB_NAME}...`);

        for (const col of collections) {
            const collection = db.collection(col.name);
            // Search in any field
            const found = await collection.findOne({
                $or: [
                    { husband_name: /BPMPOPM/i },
                    { wife_name: /Rutuja/i },
                    { name: /Rutuja/i },
                    { coupleId: /Rutuja/i },
                    { coupleId: /BPMPOPM/i },
                    { _id: "68f1d8943a12180bab0f7ed6" }
                ]
            });

            if (found) {
                console.log(`\n🎯 MATCH FOUND in collection: ${col.name}`);
                console.log(JSON.stringify(found, null, 2));
                return; // Stop after first match
            }

            if (!found && col.name === 'wpd_compatibility_question_en') {
                // Try searching with ObjectId just in case
                try {
                    const { ObjectId } = await import('mongodb');
                    const foundById = await collection.findOne({ _id: new ObjectId("68f1d8943a12180bab0f7ed6") });
                    if (foundById) {
                        console.log(`🎯 MATCH FOUND (by ObjectId) in collection: ${col.name}`);
                        console.log(JSON.stringify(foundById, null, 2));
                        return;
                    }
                } catch (e) { }
            }
        }
        console.log("\n❌ Still no match found in any collection.");
    } catch (e) {
        console.error("Search Error:", e);
    } finally {
        await client.close();
    }
}

deepSearch();
