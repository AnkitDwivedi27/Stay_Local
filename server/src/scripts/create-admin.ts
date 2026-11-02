import readline from 'readline';
import { connectDB, disconnectDB, isDatabaseConfigured, isDatabaseConnected } from '../config/db';
import { UserModel } from '../models/user.model';

const DEFAULT_ADMIN_EMAIL = 'ankitdwiivedi689@gmail.com';
const DEFAULT_ADMIN_NAME = 'Ankit Dwivedi';

function promptText(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const promptLabel = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(promptLabel, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdout.write(question);
    let input = '';
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          return resolve(input);
        } else if (char === '\u0003') {
          // Ctrl+C
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n[Admin Provisioning] Aborted by user.\n');
          process.exit(1);
        } else if (char === '\b' || char === '\x7f') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          input += char;
          process.stdout.write('*');
        }
      }
    };

    stdin.on('data', onData);
  });
}

export async function createAdmin(): Promise<void> {
  console.log('\n==================================================');
  console.log('🌲 StayLocal — Permanent Administrator Account Setup');
  console.log('==================================================\n');

  if (!isDatabaseConfigured()) {
    console.error('❌ Configuration Error: MONGODB_URI is not set in environment or server/.env.');
    process.exit(1);
  }

  // 1. Connect to MongoDB Atlas
  await connectDB();

  if (!isDatabaseConnected()) {
    console.error('❌ Connection Error: Could not connect to MongoDB Atlas. Check your network / IP whitelist.');
    process.exit(1);
  }

  try {
    // 2. Select Admin Email
    const emailInput = await promptText(`Admin Email`, DEFAULT_ADMIN_EMAIL);
    const normalizedEmail = emailInput.toLowerCase().trim();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      console.error('❌ Validation Error: A valid email address is required.');
      await disconnectDB();
      process.exit(1);
    }

    // 3. Duplicate & Silent Promotion Checks
    const existingUser = await UserModel.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.warn(`\n⚠️  Administrator account '${normalizedEmail}' already exists in MongoDB.`);
        console.info(`   ID:         ${existingUser.id}`);
        console.info(`   Name:       ${existingUser.fullName}`);
        console.info(`   Role:       ${existingUser.role}`);
        console.info(`   Status:     ${existingUser.status}`);
        console.info(`   Created At: ${existingUser.createdAt}`);
        console.info('\nNo duplicate administrator account was created. Existing account preserved.');
        await disconnectDB();
        process.exit(0);
      }

      // Strictly forbid silent promotion of non-admin accounts
      console.error(
        `\n❌ Security Error: An account with email '${normalizedEmail}' already exists with role '${existingUser.role}'.`
      );
      console.error(
        '   Silent promotion of existing tourist, host, or guide accounts to administrator is strictly forbidden.'
      );
      console.error('   Please resolve the role conflict or use a dedicated administrator email address.\n');
      await disconnectDB();
      process.exit(1);
    }

    // 4. Prompt for Full Name
    const fullNameInput = await promptText(`Admin Full Name`, DEFAULT_ADMIN_NAME);
    const fullName = fullNameInput.trim();

    if (fullName.length < 2) {
      console.error('❌ Validation Error: Full name must be at least 2 characters.');
      await disconnectDB();
      process.exit(1);
    }

    // 5. Secure Hidden Password Prompt
    const password = await promptHidden('Enter Admin Password (min 8 chars, letters + numbers/symbols): ');

    if (password.length < 8) {
      console.error('❌ Validation Error: Password must be at least 8 characters long.');
      await disconnectDB();
      process.exit(1);
    }

    if (!/^(?=.*[a-zA-Z])(?=.*[0-9\W_])/.test(password)) {
      console.error(
        '❌ Validation Error: Password must contain letters and at least one number or special symbol.'
      );
      await disconnectDB();
      process.exit(1);
    }

    const confirmPassword = await promptHidden('Confirm Admin Password: ');

    if (password !== confirmPassword) {
      console.error('❌ Validation Error: Passwords do not match. Provisioning aborted.');
      await disconnectDB();
      process.exit(1);
    }

    // 6. Create Admin Account in MongoDB
    const adminId = `usr-admin-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    const adminUser = new UserModel({
      id: adminId,
      email: normalizedEmail,
      password: password, // UserModel's pre-save hook will hash this with bcrypt (10 rounds)
      fullName: fullName,
      role: 'admin',
      status: 'active',
      bio: 'Permanent Platform Administrator for StayLocal Uttarakhand Tourism & Homestay Marketplace',
    });

    await adminUser.save();

    console.log('\n==================================================');
    console.log('✅ Permanent Administrator Account Created Successfully');
    console.log('==================================================');
    console.log(`👤 Name:       ${adminUser.fullName}`);
    console.log(`📧 Email:      ${adminUser.email}`);
    console.log(`🔑 Role:       ${adminUser.role}`);
    console.log(`🛡️  Status:     ${adminUser.status}`);
    console.log(`🆔 User ID:    ${adminUser.id}`);
    console.log('🔒 Password:   [Encrypted with bcrypt (cost factor 10)]');
    console.log('💾 Persistence: Permanently stored in MongoDB Atlas');
    console.log('==================================================');
    console.log('\n🚀 Next Steps:');
    console.log('1. Open your browser: http://localhost:5173/login');
    console.log(`2. Sign in with email: '${normalizedEmail}' and your chosen password.`);
    console.log('3. Access Admin Portals:');
    console.log('   - Verification Queue: http://localhost:5173/admin/verification');
    console.log('   - Host Assignments:   http://localhost:5173/admin/assignments');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Unexpected Error during admin provisioning:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Execute when run directly as CLI script
if (require.main === module || process.argv[1]?.includes('create-admin')) {
  createAdmin().catch((err) => {
    console.error('Fatal admin provisioning error:', err);
    process.exit(1);
  });
}
