import { MongoClient } from 'mongodb';
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

const testCouples = [
    {
        coupleId: "VAL-001",
        name: "Case 1: High Compatibility",
        disc: {
            male: { D: 30, I: 70, S: 60, C: 40 },
            female: { D: 25, I: 75, S: 65, C: 35 }
        },
        wpd: {
            male: { Economic: 60, Aesthetic: 70, Social: 80 },
            female: { Economic: 55, Aesthetic: 75, Social: 85 }
        },
        jeevanyog: { gauges: [{ name: "Values", score: 85 }, { name: "Communication", score: 90 }] }
    },
    {
        coupleId: "VAL-002",
        name: "Case 2: Power Struggle (High D vs High D)",
        disc: {
            male: { D: 85, I: 40, S: 30, C: 45 },
            female: { D: 80, I: 35, S: 25, C: 50 }
        },
        wpd: {
            male: { Economic: 90, Political: 85 },
            female: { Economic: 85, Political: 90 }
        },
        jeevanyog: { gauges: [{ name: "Conflict Resolution", score: 40 }] }
    },
    {
        coupleId: "VAL-003",
        name: "Case 3: Financial Mismatch",
        disc: {
            male: { S: 80, C: 70 },
            female: { I: 80, D: 60 }
        },
        wpd: {
            male: { Economic: 20, Social: 90 },
            female: { Economic: 95, Social: 30 }
        },
        jeevanyog: { gauges: [{ name: "Financial Planning", score: 35 }] }
    },
    {
        coupleId: "VAL-004",
        name: "Case 4: Cultural/Traditional vs Modern",
        disc: {
            male: { C: 90, S: 70 },
            female: { D: 70, I: 80 }
        },
        wpd: {
            male: { Traditional: 95, Social: 40 },
            female: { Traditional: 30, Theoretical: 85 }
        },
        jeevanyog: { gauges: [{ name: "Lifestyle", score: 45 }] }
    },
    {
        coupleId: "VAL-005",
        name: "Case 5: Ideal Balanced Pair",
        disc: {
            male: { D: 50, I: 50, S: 50, C: 50 },
            female: { D: 45, I: 55, S: 52, C: 48 }
        },
        wpd: {
            male: { Economic: 65, Social: 65 },
            female: { Economic: 60, Social: 70 }
        },
        jeevanyog: { gauges: [{ name: "Maturity", score: 88 }] }
    }
];

async function seed() {
    try {
        await client.connect();
        const db = client.db('bandhan-db');
        const collection = db.collection('reports');

        console.log("🧹 Cleaning old validation data...");
        await collection.deleteMany({ coupleId: { $regex: /^VAL-/ } });

        console.log("🌱 Seeding 5 validation cases...");
        await collection.insertMany(testCouples);
        console.log("✅ Seed complete!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        await client.close();
    }
}

seed();
