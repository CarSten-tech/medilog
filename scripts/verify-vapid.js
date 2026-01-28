const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// Load .env.local manually since we are running standalone
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const publicKey = env['NEXT_PUBLIC_VAPID_PUBLIC_KEY'];
const privateKey = env['VAPID_PRIVATE_KEY'];
const subject = env['VAPID_SUBJECT'];

console.log("Checking VAPID Configuration...");
console.log(`Public Key: ${publicKey ? 'OK (Start: ' + publicKey.substring(0, 5) + '...)' : 'MISSING'}`);
console.log(`Private Key: ${privateKey ? 'OK (Present)' : 'MISSING'}`);
console.log(`Subject: ${subject ? 'OK (' + subject + ')' : 'MISSING'}`);

try {
    webpush.setVapidDetails(
        subject,
        publicKey,
        privateKey
    );
    console.log("✅ web-push library accepted the keys.");
    
    // Attempt generation of request details (without sending) to verify key validity
    // There isn't a direct "validate" method, but if setVapidDetails didn't throw, basic format is usually ok.
    // We can try to sign a payload (internal logic) but setVapidDetails check is decent.
    
} catch (error) {
    console.error("❌ web-push Configuration Failed:", error.message);
    process.exit(1);
}
