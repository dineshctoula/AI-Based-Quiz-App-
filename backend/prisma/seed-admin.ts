import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in the environment variables!');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@quiz.com';
  // Hash password
  // पासवर्डलाई hash गर्ने
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Check if admin user already exists
  // के admin प्रयोगकर्ता पहिले नै अवस्थित छ भनी जाँच गर्ने
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingUser) {
    // Promote user to ADMIN
    // प्रयोगकर्तालाई ADMIN मा स्तरोन्नति गर्ने
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });
    console.log(`Promoted existing user ${adminEmail} to ADMIN.`);
  } else {
    // Create new ADMIN user
    // नयाँ ADMIN प्रयोगकर्ता सिर्जना गर्ने
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN'
      }
    });
    console.log(`Created new ADMIN user: ${adminEmail} with password: admin123`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

