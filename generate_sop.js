import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

async function createSOP() {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(process.cwd(), 'Bandhan_MCP_Production_SOP.pdf');
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Title Page
    doc.fillColor('#1e1b4b').fontSize(28).text('Bandhan AI MCP System', { align: 'center' });
    doc.fontSize(22).text('Standard Operating Procedure (SOP)', { align: 'center' });
    doc.moveDown();
    doc.rect(50, doc.y, 500, 2).fill('#6366f1');
    doc.moveDown(2);

    doc.fillColor('#475569').fontSize(12).text('Version: 1.0.0', { align: 'right' });
    doc.text(`Last Updated: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(3);

    // Header Helper
    const sectionHeader = (title) => {
        doc.addPage();
        doc.fillColor('#1e1b4b').fontSize(18).text(title, { underline: true });
        doc.moveDown();
    };

    const subHeader = (title) => {
        doc.fillColor('#4338ca').fontSize(14).text(title);
        doc.moveDown(0.5);
    };

    const bodyText = (text) => {
        doc.fillColor('#334155').fontSize(11).text(text, { align: 'justify', lineGap: 2 });
        doc.moveDown();
    };

    // 1. Executive Summary
    doc.fillColor('#1e1b4b').fontSize(18).text('1. Executive Summary', { underline: true });
    doc.moveDown();
    bodyText('This document outlines the standard operating procedures for the Bandhan AI Marriage Counselling Model Context Protocol (MCP) server. The system is designed to provide high-precision relationship analysis using a panel of 12 virtual experts powered by OpenAI GPT-4o-mini.');

    subHeader('Key Objectives:');
    doc.list([
        'Scalable traffic handling using BullMQ and Redis.',
        'Asynchronous background job processing for stability.',
        'Permanent report storage in the local reports/ folder.',
        'Modern Glassmorphism dashboard for result visualization.',
        'PM2 Process Management for 24/7 uptime.'
    ], { indent: 20 });
    doc.moveDown();

    // 2. System Architecture
    sectionHeader('2. System Architecture');
    bodyText('The system follows a modern micro-service-oriented architecture designed for maximum performance and traffic handling.');

    subHeader('Technology Stack:');
    doc.list([
        'Runtime: Node.js (ES Modules)',
        'Server: Express.js',
        'Queue: BullMQ (Traffic Management)',
        'Backend Data Store: Redis (Job Queue Storage)',
        'Database: MongoDB (Source Profile Data)',
        'Process Manager: PM2 (Autostart & Monitoring)'
    ], { indent: 20 });

    // 3. Setup & Installation
    sectionHeader('3. Setup & Installation');
    subHeader('Environment Variables (.env)');
    bodyText('The .env file contains all sensitive keys. Please ensure these are correct:');
    doc.font('Courier').fontSize(10).text('OPENAI_API_KEY=sk-...\nMOCK_AI=false\nMONGODB_URI=mongodb+...\nDB_NAME=...\nCOLLECTION_NAME=...');
    doc.font('Helvetica').fontSize(11).moveDown();

    subHeader('Prerequisites:');
    doc.list([
        'Node.js v20+',
        'Redis Server (Must be RUNNING at localhost:6379)',
        'Internet connection for OpenAI API'
    ], { indent: 20 });

    // 4. Practical Usage
    sectionHeader('4. Practical Usage');
    subHeader('Starting the Server');
    bodyText('To start the production-ready server manually:');
    doc.font('Courier').fontSize(10).text('node server.js');
    doc.font('Helvetica').fontSize(11).moveDown();

    subHeader('Accessing the Dashboard');
    bodyText('Open your browser and navigate to: http://localhost:9000');

    // 5. Traffic Processing
    sectionHeader('5. Traffic Processing');
    subHeader('BullMQ Queue Logic');
    bodyText('When a user clicks "Consult", the request is added to a job queue. A "Worker" then picks up the job, talks to OpenAI, and generates a PDF. This ensures the server never crashes due to too many simultaneous requests.');

    // 6. Maintenance
    sectionHeader('6. Maintenance');
    subHeader('PDF Reports');
    bodyText('Generated PDFs are stored permanently in the /reports directory. You can access them via the provided links in the dashboard.');

    subHeader('Restarting Redis');
    bodyText('If you see "ECONNREFUSED" errors, it means Redis is stopped. Go to Windows Services and restart "Memurai" or "Redis".');

    // Finalize
    doc.moveDown(5);
    doc.rect(50, doc.y, 500, 1).fill('#cbd5e1');
    doc.moveDown();
    doc.fontSize(10).fillColor('#94a3b8').text('Confidential - Bandhan AI Internal Use Only', { align: 'center' });

    doc.end();

    stream.on('finish', () => {
        console.log(`✅ Production SOP generated: ${filePath}`);
    });
}

createSOP();
