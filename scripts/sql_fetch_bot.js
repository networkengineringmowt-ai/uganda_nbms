/* global require, process, __dirname */
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuration for MS SQL Server / Azure SQL
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost', 
    database: process.env.DB_NAME || 'MoWT_BMS',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    }
};

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const BRIDGES_FILE = path.join(OUTPUT_DIR, 'bridges.json');
const CULVERTS_FILE = path.join(OUTPUT_DIR, 'culverts.json');

async function fetchFromDB() {
    try {
        console.log('Connecting to SQL Server...');
        let pool = await sql.connect(config);
        
        console.log('Fetching Bridges Data...');
        let bridgesResult = await pool.request().query('SELECT * FROM BridgesRegistry'); // Adjust table name
        
        console.log('Fetching Culverts Data...');
        let culvertsResult = await pool.request().query('SELECT * FROM MajorCulvertsRegistry'); // Adjust table name
        
        // Ensure data directory exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        
        console.log(`Writing ${bridgesResult.recordset.length} records to bridges.json...`);
        fs.writeFileSync(BRIDGES_FILE, JSON.stringify(bridgesResult.recordset, null, 2));
        
        console.log(`Writing ${culvertsResult.recordset.length} records to culverts.json...`);
        fs.writeFileSync(CULVERTS_FILE, JSON.stringify(culvertsResult.recordset, null, 2));
        
        console.log('Backend Data Fetch Complete!');
        
    } catch (err) {
        console.error('Database connection or query failed:', err);
    } finally {
        sql.close();
    }
}

// Execute
fetchFromDB();
