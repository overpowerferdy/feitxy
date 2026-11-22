#!/usr/bin/env node

/** Add the OAuth callback intent filter to the generated Android project. */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

const filter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="com.feit.app"
                    android:host="auth"
                    android:pathPrefix="/callback" />
            </intent-filter>
`;

try {
  let xml = await fs.readFile(manifest, 'utf-8');
  if (xml.includes('android:scheme="com.feit.app"')) {
    console.log('✓ OAuth deep link already configured');
    process.exit(0);
  }

  const activity = /(<activity[\s\S]*?android:name="\.MainActivity"[\s\S]*?)(<\/activity>)/;
  if (!activity.test(xml)) {
    console.error('❌ Could not find MainActivity in AndroidManifest.xml');
    process.exit(1);
  }
  xml = xml.replace(activity, `$1${filter}        $2`);
  await fs.writeFile(manifest, xml, 'utf-8');
  console.log('✓ Added com.feit.app://auth/callback deep link');
} catch (error) {
  console.error('❌ Could not update AndroidManifest.xml:', error.message);
  process.exit(1);
}
