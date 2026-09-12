import { PrismaClient, Priority, Role, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000);
async function main() {
  await prisma.activity.deleteMany(); await prisma.notification.deleteMany(); await prisma.task.deleteMany(); await prisma.project.deleteMany(); await prisma.client.deleteMany(); await prisma.user.deleteMany();
  const passwordHash = await bcrypt.hash('password123', 10);
  const [admin, pmOne, pmTwo, ...developers] = await Promise.all([
    prisma.user.create({ data: { name: 'Aisha Khan', email: 'admin@agency.local', role: Role.ADMIN, passwordHash } }),
    prisma.user.create({ data: { name: 'Ravi Mehta', email: 'ravi@agency.local', role: Role.PM, passwordHash } }),
    prisma.user.create({ data: { name: 'Maya Singh', email: 'maya@agency.local', role: Role.PM, passwordHash } }),
    ...['Noah Patel','Zara Shah','Leo Martin','Ishaan Roy'].map((name, i) => prisma.user.create({ data: { name, email: `dev${i + 1}@agency.local`, role: Role.DEVELOPER, passwordHash } }))
  ]);
  const clients = await Promise.all(['Northstar Health','Atlas Finance','Field Notes Co.'].map(name => prisma.client.create({ data: { name } })));
  const projects = await Promise.all([
    prisma.project.create({ data: { name: 'Northstar patient portal', description: 'A calmer digital front door for patients.', ownerId: pmOne.id, clientId: clients[0].id } }),
    prisma.project.create({ data: { name: 'Atlas mobile banking', description: 'A fast, accessible banking experience.', ownerId: pmOne.id, clientId: clients[1].id } }),
    prisma.project.create({ data: { name: 'Field Notes rebrand', description: 'A new identity for independent makers.', ownerId: pmTwo.id, clientId: clients[2].id } })
  ]);
  const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE, TaskStatus.OVERDUE];
  const priorities = [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW, Priority.HIGH];
  for (let p = 0; p < projects.length; p++) for (let i = 0; i < 5; i++) {
    const task = await prisma.task.create({ data: { title: ['Discovery workshop','Build dashboard shell','API integration','Accessibility pass','Release checklist'][i], description: 'A focused delivery milestone for the project team.', priority: priorities[i], status: statuses[(i + p) % statuses.length], dueDate: daysFromNow(i === 4 ? -2 : i + 1), projectId: projects[p].id, developerId: developers[(i + p) % developers.length].id } });
    if (i > 0) await prisma.activity.create({ data: { projectId: projects[p].id, taskId: task.id, actorId: i % 2 ? pmOne.id : developers[(i + p) % developers.length].id, fromStatus: TaskStatus.TODO, toStatus: task.status } });
  }
  console.log('Seeded: admin@agency.local, ravi@agency.local, maya@agency.local, dev1@agency.local..dev4@agency.local / password123');
}
main().finally(() => prisma.$disconnect());
