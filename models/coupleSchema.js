/**
 * =============================================
 *  JEEVANYOG MCP — MongoDB Schema Definition
 *  Collection: reports (in bandhan-db)
 * =============================================
 *
 *  This file defines the schema structure used
 *  in MongoDB Atlas for the JeevanYog MCP project.
 *
 *  Use this as a reference when creating records
 *  or when setting up MongoDB Atlas Schema Validation.
 */

// ─────────────────────────────────────────────
//  MongoDB Atlas JSON Schema Validator
//  Apply this via Atlas UI → Collections →
//  "Validation" tab, or run the command below.
// ─────────────────────────────────────────────

export const coupleSchemaValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: ["coupleId", "husband_name", "wife_name", "disc", "wpd", "jeevanyog"],
        properties: {

            // ── Core Identity ──────────────────────────────
            coupleId: {
                bsonType: "string",
                description: "Unique couple identifier e.g. BPM-RUT-001. REQUIRED."
            },
            husband_name: {
                bsonType: "string",
                description: "Full name of the husband. REQUIRED."
            },
            wife_name: {
                bsonType: "string",
                description: "Full name of the wife. REQUIRED."
            },
            created_at: {
                bsonType: "date",
                description: "Timestamp when the record was created."
            },
            updated_at: {
                bsonType: "date",
                description: "Timestamp when the record was last updated."
            },

            // ── DISC Psychometric Scores ───────────────────
            // D = Dominance, I = Influence, S = Steadiness, C = Conscientiousness
            // Scores range from 0 to 100
            disc: {
                bsonType: "object",
                required: ["male", "female"],
                properties: {
                    male: {
                        bsonType: "object",
                        properties: {
                            D: { bsonType: "int", minimum: 0, maximum: 100 },
                            I: { bsonType: "int", minimum: 0, maximum: 100 },
                            S: { bsonType: "int", minimum: 0, maximum: 100 },
                            C: { bsonType: "int", minimum: 0, maximum: 100 }
                        }
                    },
                    female: {
                        bsonType: "object",
                        properties: {
                            D: { bsonType: "int", minimum: 0, maximum: 100 },
                            I: { bsonType: "int", minimum: 0, maximum: 100 },
                            S: { bsonType: "int", minimum: 0, maximum: 100 },
                            C: { bsonType: "int", minimum: 0, maximum: 100 }
                        }
                    }
                }
            },

            // ── WPD (Work/Personality/Values) Scores ──────
            // Scores range from 0 to 100 per dimension
            wpd: {
                bsonType: "object",
                required: ["male", "female"],
                properties: {
                    male: {
                        bsonType: "object",
                        properties: {
                            Aesthetic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Economic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Individualistic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Political: { bsonType: "int", minimum: 0, maximum: 100 },
                            Altruistic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Regulatory: { bsonType: "int", minimum: 0, maximum: 100 },
                            Theoretical: { bsonType: "int", minimum: 0, maximum: 100 },
                            Traditional: { bsonType: "int", minimum: 0, maximum: 100 },
                            Social: { bsonType: "int", minimum: 0, maximum: 100 }
                        }
                    },
                    female: {
                        bsonType: "object",
                        properties: {
                            Aesthetic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Economic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Individualistic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Political: { bsonType: "int", minimum: 0, maximum: 100 },
                            Altruistic: { bsonType: "int", minimum: 0, maximum: 100 },
                            Regulatory: { bsonType: "int", minimum: 0, maximum: 100 },
                            Theoretical: { bsonType: "int", minimum: 0, maximum: 100 },
                            Traditional: { bsonType: "int", minimum: 0, maximum: 100 },
                            Social: { bsonType: "int", minimum: 0, maximum: 100 }
                        }
                    }
                }
            },

            // ── JeevanYog Synergy Gauges ───────────────────
            // Array of named gauge scores (0–100)
            jeevanyog: {
                bsonType: "object",
                required: ["gauges"],
                properties: {
                    gauges: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["name", "score"],
                            properties: {
                                name: {
                                    bsonType: "string",
                                    description: "Gauge name e.g. Emotional Energy Exchange"
                                },
                                score: {
                                    bsonType: "int",
                                    minimum: 0,
                                    maximum: 100,
                                    description: "Synergy score 0–100"
                                }
                            }
                        }
                    }
                }
            },

            // ── AI Analysis Results (stored after analysis) ─
            analysis: {
                bsonType: "object",
                properties: {
                    decision: {
                        bsonType: "string",
                        enum: ["Green", "Amber", "Red"],
                        description: "Final match decision"
                    },
                    confidence: {
                        bsonType: "double",
                        minimum: 0,
                        maximum: 1,
                        description: "Confidence score between 0 and 1"
                    },
                    expert_consensus: {
                        bsonType: "string",
                        description: "Summary from the 12-expert panel"
                    },
                    risks: {
                        bsonType: "array",
                        items: { bsonType: "string" }
                    },
                    advice: {
                        bsonType: "array",
                        items: { bsonType: "string" }
                    },
                    analysed_at: {
                        bsonType: "date",
                        description: "When this analysis was generated"
                    },
                    report_url: {
                        bsonType: "string",
                        description: "URL path to the PDF report"
                    }
                }
            }
        }
    }
};


// ─────────────────────────────────────────────
//  MongoDB Shell Command to Apply Validation
//  Run this in MongoDB Atlas → Shell (mongosh)
// ─────────────────────────────────────────────
//
//  db.createCollection("reports", {
//      validator: <paste coupleSchemaValidator.$jsonSchema here>
//  });
//
//  OR to add validation to an existing collection:
//
//  db.runCommand({
//      collMod: "reports",
//      validator: <paste coupleSchemaValidator.$jsonSchema here>,
//      validationLevel: "moderate"   // "strict" also available
//  });


// ─────────────────────────────────────────────
//  Index Recommendations for Performance
// ─────────────────────────────────────────────
export const recommendedIndexes = [
    { key: { coupleId: 1 }, options: { unique: true, name: "idx_coupleId_unique" } },
    { key: { "analysis.decision": 1 }, options: { name: "idx_decision" } },
    { key: { created_at: -1 }, options: { name: "idx_created_desc" } }
];
