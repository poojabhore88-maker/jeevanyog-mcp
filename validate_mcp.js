import axios from 'axios';

const coupleIds = ["VAL-001", "VAL-002", "VAL-003", "VAL-004", "VAL-005"];
const API_URL = "http://127.0.0.1:9000/api/analyze";

async function runValidation() {
    console.log("🚀 STARTING REAL-WORLD VALIDATION BATCH...");
    console.log("-----------------------------------------");

    const batchResults = [];

    for (const id of coupleIds) {
        console.log(`\n🔍 Analyzing Couple: ${id}...`);
        try {
            const start = Date.now();
            const response = await axios.post(`${API_URL}/${id}`);
            const duration = (Date.now() - start) / 1000;

            const { analysis, reportUrl } = response.data;

            console.log(`✅ Success (${duration}s)`);
            console.log(`   Decision: ${analysis.decision}`);
            console.log(`   Confidence: ${analysis.confidence}`);
            console.log(`   PDF: ${reportUrl}`);

            batchResults.push({
                id,
                status: "SUCCESS",
                decision: analysis.decision,
                confidence: analysis.confidence,
                reportUrl
            });
        } catch (error) {
            console.error(`❌ Failed for ${id}:`, error.response?.data?.error || error.message);
            batchResults.push({ id, status: "FAILED", error: error.message });
        }
    }

    console.log("\n\n📊 VALIDATION SUMMARY REPORT");
    console.log("============================");
    console.table(batchResults);
    console.log("\nInstructions for review:");
    console.log("1. Open the PDF URLs above to verify the '12 Experts' depth.");
    console.log("2. Compare the 'decision' with your manual expert judgement.");
    console.log("3. Note any mismatches for prompt refining.");
}

runValidation();
