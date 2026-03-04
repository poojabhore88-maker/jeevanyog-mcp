/**
 * ===================================================
 *  apply-schema.js
 *  Run once to set up MongoDB Atlas with proper
 *  schema validation and indexes.
 *
 *  Usage:  node apply-schema.js
 * ===================================================
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { coupleSchemaValidator, recommendedIndexes } from './models/coupleSchema.js';

dotenv.config();

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'bandhan-db';
const COLLECTION = process.env.COLLECTION_NAME || 'reports';

async function applySchema() {
    if (!uri) {
        console.error("❌ MONGODB_URI not found in .env — please set it first.");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("✅ Connected to MongoDB Atlas");

        const db = client.db(DB_NAME);

        // List existing collections
        const collections = await db.listCollections({ name: COLLECTION }).toArray();
        const collectionExists = collections.length > 0;

        if (!collectionExists) {
            // Create collection with validator
            console.log(`📦 Creating collection '${COLLECTION}' with schema validation...`);
            await db.createCollection(COLLECTION, {
                validator: coupleSchemaValidator,
                validationLevel: "moderate",   // "moderate" allows existing docs that don't match
                validationAction: "warn"        // "error" to block bad inserts
            });
            console.log(`✅ Collection '${COLLECTION}' created with schema validation.`);
        } else {
            // Apply validator to existing collection
            console.log(`🔄 Collection '${COLLECTION}' already exists. Applying schema validation...`);
            await db.command({
                collMod: COLLECTION,
                validator: coupleSchemaValidator,
                validationLevel: "moderate",
                validationAction: "warn"
            });
            console.log(`✅ Schema validation applied to existing collection.`);
        }

        // Create indexes
        console.log("\n📌 Creating indexes...");
        const collection = db.collection(COLLECTION);

        for (const index of recommendedIndexes) {
            try {
                const result = await collection.createIndex(index.key, index.options);
                console.log(`  ✅ Index created: ${result}`);
            } catch (err) {
                if (err.code === 85 || err.code === 86) {
                    console.log(`  ⚠️  Index already exists: ${index.options.name}`);
                } else {
                    throw err;
                }
            }
        }

        console.log("\n🎉 MongoDB Atlas setup complete!");
        console.log(`   Database  : ${DB_NAME}`);
        console.log(`   Collection: ${COLLECTION}`);
        console.log(`   Indexes   : ${recommendedIndexes.length} applied`);
        console.log("\n📋 Next steps:");
        console.log("  1. Go to MongoDB Atlas → Browse Collections → bandhan-db.reports");
        console.log("  2. You should see the collection and indexes listed.");
        console.log("  3. Run 'node upload_couple_data.js' to add your first couple.");

    } catch (error) {
        console.error("❌ Schema setup failed:", error.message);
    } finally {
        await client.close();
    }
}

applySchema();
