import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Check for service account file
const SERVICE_ACCOUNT_PATH = './service-account.json';

try {
    // Check if file exists (will throw if not)
    readFileSync(SERVICE_ACCOUNT_PATH);

    initializeApp({
        credential: cert(SERVICE_ACCOUNT_PATH)
    });
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error('❌ Error: service-account.json not found in the root directory.');
        console.error('👉 Please download a new private key from Firebase Console -> Project Settings -> Service accounts');
        console.error('👉 Rename it to "service-account.json" and place it in the root of the project.');
    } else {
        console.error('❌ Error initializing app:', error.message);
    }
    process.exit(1);
}

const email = process.argv[2];

if (!email) {
    console.error('❌ usage: node scripts/verify_user.mjs <email-to-verify>');
    process.exit(1);
}

console.log(`🔍 Looking for user with email: ${email}...`);

getAuth()
    .getUserByEmail(email)
    .then((userRecord) => {
        console.log(`✅ Found user: ${userRecord.uid}`);
        if (userRecord.emailVerified) {
            console.log('ℹ️ User is already verified.');
            return;
        }

        console.log('🔄 Verifying email...');
        return getAuth().updateUser(userRecord.uid, {
            emailVerified: true,
        });
    })
    .then((userRecord) => {
        if (userRecord) {
            console.log(`🎉 Successfully manually verified email for user: ${userRecord.uid}`);
        }
    })
    .catch((error) => {
        console.error('❌ Error verifying user:', error.message);
        if (error.code === 'auth/user-not-found') {
            console.error('👉 The user does not exist in Firebase Auth. Please sign up in the app first.');
        }
    });
