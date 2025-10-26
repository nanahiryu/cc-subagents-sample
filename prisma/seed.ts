import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const todos = [
    {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the ToDo app',
      dueDate: new Date('2025-11-01'),
      completed: false,
    },
    {
      title: 'Review pull requests',
      description: 'Review and merge pending pull requests',
      dueDate: new Date('2025-10-28'),
      completed: true,
    },
    {
      title: 'Update dependencies',
      description: null,
      dueDate: null,
      completed: false,
    },
  ];

  for (const todo of todos) {
    await prisma.todo.create({ data: todo });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
