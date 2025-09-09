const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('Checking existing data...');

  // Get users with clerk_id
  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkId: true,
      name: true
    }
  });

  console.log('Users:', users);

  // Get wallets
  const wallets = await prisma.wallet.findMany({
    select: {
      id: true,
      userClerkId: true,
      balance: true
    }
  });

  console.log('Wallets:', wallets);

  // Get emergency contacts
  const emergencyContacts = await prisma.emergencyContact.findMany({
    select: {
      id: true,
      userClerkId: true,
      contactName: true
    }
  });

  console.log('Emergency Contacts:', emergencyContacts);

  await prisma.$disconnect();
}

checkData().catch(console.error);



