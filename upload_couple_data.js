import { MongoClient } from 'mongodb';
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const coupleData = {
    coupleId: "BPM-RUT-001",
    husband_name: "BPMPOPM",
    wife_name: "Rutuja Padher",
    disc: {
        male: { D: 96, I: 50, S: 4, C: 25 },
        female: { D: 49, I: 17, S: 37, C: 60 }
    },
    wpd: {
        male: { Aesthetic: 42, Economic: 45, Individualistic: 43, Political: 48, Altruistic: 45, Regulatory: 52, Theoretical: 75 },
        female: { Aesthetic: 92, Economic: 47, Individualistic: 73, Political: 40, Altruistic: 35, Regulatory: 23, Theoretical: 40 }
    },
    jeevanyog: {
        gauges: [
            { name: "Emotional Energy Exchange", score: 10 },
            { name: "Conflict Navigation", score: 18 },
            { name: "Decision Ownership", score: 10 },
            { name: "Lifestyle Rhythm", score: 43 },
            { name: "Emotional Safety", score: 0 },
            { name: "Expectation Gap", score: 26 },
            { name: "Marriage Readiness Maturity", score: 84 }
        ]
    }
};

async function uploadCouple() {
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME || 'bandhan-db');
        const collection = db.collection(process.env.COLLECTION_NAME || 'reports');

        console.log(`📡 Uploading data for: ${coupleData.husband_name} & ${coupleData.wife_name}...`);

        // Use upsert to avoid duplicates
        await collection.updateOne(
            { coupleId: coupleData.coupleId },
            { $set: coupleData },
            { upsert: true }
        );

        console.log("✅ Data uploaded successfully!");
        console.log(`👉 Now you can run: node fetch_pdf.js (update the ID to CUSTOM-001)`);

    } catch (error) {
        console.error("❌ Upload failed:", error);
    } finally {
        await client.close();
    }
}

uploadCouple();
