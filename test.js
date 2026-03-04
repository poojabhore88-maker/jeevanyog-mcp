// Node 24 has built-in fetch, no import needed


const testData = {
    coupleId: "68f1d8943a12180bab0f7ed6" // Real coupleId from DB
};

async function runTest() {
    console.log("🚀 Sending request to server (Integration Route)...");
    try {
        const response = await fetch(`http://127.0.0.1:9000/api/analyze/${testData.coupleId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        console.log("\n✨ AI Structured Analysis Results:");
        console.log("----------------------------------");
        console.log(JSON.stringify(data.analysis, null, 2));

        if (data.reportUrl) {
            console.log("\n📄 PDF Report Generated:");
            console.log(`URL: ${data.reportUrl}`);
        }
    } catch (error) {
        console.error("❌ Connection Error Detail:", error.message);
        console.error("Make sure 'node server.js' is running and port 5005 is open.");
    }
}

runTest();
