import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const coupleId = "BPM-RUT-001"; // Actual data from desktop PDF
const API_URL = `http://127.0.0.1:9000/api/analyze/${coupleId}`;
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');

async function fetchAndDownloadReport() {
    try {
        // Create downloads folder if it doesn't exist
        if (!fs.existsSync(DOWNLOAD_DIR)) {
            fs.mkdirSync(DOWNLOAD_DIR);
        }

        console.log(`🚀 Requesting analysis for Couple ID: ${coupleId}...`);

        // 1. Trigger Analysis
        const response = await axios.post(API_URL);
        const { reportUrl, analysis } = response.data;

        console.log("✅ Analysis Complete!");
        console.log(`📊 Decision: ${analysis.decision}`);
        console.log(`🔗 Report URL: ${reportUrl}`);

        // 2. Fetch/Download the PDF
        const fileName = path.basename(reportUrl);
        const localPath = path.join(DOWNLOAD_DIR, fileName);

        console.log(`📥 Fetching PDF to: ${localPath}...`);

        const pdfResponse = await axios({
            url: reportUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(localPath);
        pdfResponse.data.pipe(writer);

        writer.on('finish', () => {
            console.log("✨ PDF Fetched successfully!");

            // 3. Open the PDF (Windows specific)
            console.log("📂 Opening report...");
            exec(`start "" "${localPath}"`);
        });

    } catch (error) {
        console.error("❌ Error fetching report:");
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data.error || error.message}`);
        } else {
            console.error(`   ${error.message}`);
        }
        console.log("\n💡 Make sure your server is running (node server.js) before running this script.");
    }
}

fetchAndDownloadReport();
