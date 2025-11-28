import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Delete in order to respect foreign key constraints
    // 1. Delete all messages (comments and replies)
    console.log('Deleting messages (comments and replies)...');
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} messages\n`);

    // 2. Delete all photos
    console.log('Deleting photos...');
    const deletedPhotos = await prisma.photo.deleteMany({});
    console.log(`✅ Deleted ${deletedPhotos.count} photos\n`);

    // 3. Delete all library memberships
    console.log('Deleting library memberships...');
    const deletedMemberships = await prisma.libraryMember.deleteMany({});
    console.log(`✅ Deleted ${deletedMemberships.count} library memberships\n`);

    // 4. Delete all libraries
    console.log('Deleting libraries...');
    const deletedLibraries = await prisma.library.deleteMany({});
    console.log(`✅ Deleted ${deletedLibraries.count} libraries\n`);

    // 5. Delete all users
    console.log('Deleting users...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users\n`);

    console.log('✨ Database cleanup completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Users: ${deletedUsers.count}`);
    console.log(`  - Libraries: ${deletedLibraries.count}`);
    console.log(`  - Library Memberships: ${deletedMemberships.count}`);
    console.log(`  - Photos: ${deletedPhotos.count}`);
    console.log(`  - Messages/Comments: ${deletedMessages.count}`);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });






