import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
    },
  });
  
  console.log('\nAll users in database:');
  console.log('====================');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}, Username: ${user.username}, ID: ${user.id}`);
  });
  console.log('');
  
  return users;
}

async function deleteUser(email?: string) {
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }
    
    await prisma.user.delete({
      where: { email },
    });
    
    console.log(`\n✅ User ${email} (${user.username}) deleted successfully!`);
  } else {
    // Delete all users (for testing)
    const users = await prisma.user.findMany();
    for (const user of users) {
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`✅ Deleted user: ${user.email} (${user.username})`);
    }
    console.log(`\n✅ All ${users.length} user(s) deleted successfully!`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'list') {
    await listUsers();
  } else if (args[0] === 'delete' && args[1]) {
    await deleteUser(args[1]);
  } else if (args[0] === 'delete-all') {
    await deleteUser();
  } else {
    console.log('Usage:');
    console.log('  npm run delete-user list          - List all users');
    console.log('  npm run delete-user delete <email> - Delete user by email');
    console.log('  npm run delete-user delete-all     - Delete all users');
    await listUsers();
  }
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});









