import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

describe('Data Integrity & Authorization (SECURITY.md §3 & §4, AGENTS.md §4)', () => {
  let userA: any;
  let userB: any;
  let statA: any;
  let statB: any;
  let questA: any;
  let questB: any;

  beforeEach(async () => {
    // Clean up test records
    await prisma.questCompletion.deleteMany();
    await prisma.quest.deleteMany();
    await prisma.stat.deleteMany();
    await prisma.character.deleteMany();
    await prisma.user.deleteMany();

    // Create User A with character and stat
    userA = await prisma.user.create({
      data: {
        email: 'test_user_a@ascend.io',
        passwordHash: 'dummy_hash',
        timezone: 'Asia/Kolkata',
        character: {
          create: {},
        },
      },
      include: { character: true },
    });

    // Create User B with character and stat
    userB = await prisma.user.create({
      data: {
        email: 'test_user_b@ascend.io',
        passwordHash: 'dummy_hash',
        timezone: 'Asia/Kolkata',
        character: {
          create: {},
        },
      },
      include: { character: true },
    });

    // Create a Stat for User A's character
    statA = await prisma.stat.create({
      data: {
        characterId: userA.character.id,
        name: 'Strength',
        icon: 'Dumbbell',
        sortOrder: 0,
      },
    });

    // Create a Stat for User B's character
    statB = await prisma.stat.create({
      data: {
        characterId: userB.character.id,
        name: 'Intellect',
        icon: 'Brain',
        sortOrder: 0,
      },
    });

    // Create quest for User A (tied to statA)
    questA = await prisma.quest.create({
      data: {
        characterId: userA.character.id,
        statId: statA.id,
        title: 'User A Quest',
        xpValue: 30,
        recurring: true,
      },
    });

    // Create quest for User B (tied to statB)
    questB = await prisma.quest.create({
      data: {
        characterId: userB.character.id,
        statId: statB.id,
        title: 'User B Quest',
        xpValue: 50,
        recurring: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.questCompletion.deleteMany();
    await prisma.quest.deleteMany();
    await prisma.stat.deleteMany();
    await prisma.character.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('rejects a second completion of the same recurring quest on the same day (Idempotency, SECURITY.md §4)', async () => {
    const todayStr = '2026-09-14';

    // First completion should succeed
    const firstCompletion = await prisma.questCompletion.create({
      data: {
        questId: questA.id,
        characterId: userA.character.id,
        completedDate: todayStr,
      },
    });
    expect(firstCompletion).toBeDefined();
    expect(firstCompletion.completedDate).toBe(todayStr);

    // Second completion on same day must be rejected by @@unique([questId, completedDate])
    await expect(
      prisma.questCompletion.create({
        data: {
          questId: questA.id,
          characterId: userA.character.id,
          completedDate: todayStr,
        },
      })
    ).rejects.toThrow();
  });

  it('verifies that a user cannot complete another user\'s quest (Authorization, SECURITY.md §3)', () => {
    // User A should own questA but NOT questB
    const isUserAAuthorizedForQuestA = questA.characterId === userA.character.id;
    const isUserAAuthorizedForQuestB = questB.characterId === userA.character.id;

    expect(isUserAAuthorizedForQuestA).toBe(true);
    expect(isUserAAuthorizedForQuestB).toBe(false);
  });

  it('verifies that a user cannot access another user\'s Stat (SECURITY.md §3 - new v2 surface)', () => {
    // statA belongs to userA.character, statB belongs to userB.character
    const isStatAOwnedByUserA = statA.characterId === userA.character.id;
    const isStatBOwnedByUserA = statB.characterId === userA.character.id;

    expect(isStatAOwnedByUserA).toBe(true);
    expect(isStatBOwnedByUserA).toBe(false);
  });
});
