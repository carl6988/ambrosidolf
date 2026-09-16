import { PrismaClient, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await prisma.linkClickImport.deleteMany();
  await prisma.postDailyMetric.deleteMany();
  await prisma.accountDailyMetric.deleteMany();
  await prisma.post.deleteMany();
  await prisma.account.deleteMany();
  await prisma.creator.deleteMany();

  const accountsData = [
    {
      creatorName: "Reisewelt Media",
      username: "reisewelt_de",
      displayName: "Reisewelt DE",
      profileUrl: "https://instagram.com/reisewelt_de",
      sltBioPageSlug: "reisewelt-de",
      baseFollowers: 24500,
      posts: [
        {
          url: "https://instagram.com/reel/reisewelt_de/1",
          caption: "Sonnenuntergang auf Santorini 🌅",
          mediaType: MediaType.REEL,
          postedAt: daysAgo(9),
          thumbnailUrl: "https://picsum.photos/seed/reisewelt1/400/400",
          baseViews: 18000,
        },
        {
          url: "https://instagram.com/p/reisewelt_de/2",
          caption: "Die schönsten Strände der Karibik",
          mediaType: MediaType.CAROUSEL,
          postedAt: daysAgo(5),
          thumbnailUrl: "https://picsum.photos/seed/reisewelt2/400/400",
          baseViews: 9000,
        },
      ],
    },
    {
      creatorName: "Foodie Berlin Collective",
      username: "foodie.berlin",
      displayName: "Foodie Berlin",
      profileUrl: "https://instagram.com/foodie.berlin",
      sltBioPageSlug: "foodie-berlin",
      baseFollowers: 12800,
      posts: [
        {
          url: "https://instagram.com/reel/foodie.berlin/1",
          caption: "Bestes Ramen in Berlin-Mitte 🍜",
          mediaType: MediaType.REEL,
          postedAt: daysAgo(8),
          thumbnailUrl: "https://picsum.photos/seed/foodie1/400/400",
          baseViews: 25000,
        },
        {
          url: "https://instagram.com/p/foodie.berlin/2",
          caption: "Neue Bäckerei am Prenzlauer Berg",
          mediaType: MediaType.PHOTO,
          postedAt: daysAgo(4),
          thumbnailUrl: "https://picsum.photos/seed/foodie2/400/400",
          baseViews: 4200,
        },
        {
          url: "https://instagram.com/reel/foodie.berlin/3",
          caption: "3 Rezepte für den perfekten Sonntagsbrunch",
          mediaType: MediaType.REEL,
          postedAt: daysAgo(2),
          thumbnailUrl: "https://picsum.photos/seed/foodie3/400/400",
          baseViews: 31000,
        },
      ],
    },
    {
      creatorName: "Fitness Motivation Team",
      username: "fitnessmotivation",
      displayName: "Fitness Motivation",
      profileUrl: "https://instagram.com/fitnessmotivation",
      sltBioPageSlug: null,
      baseFollowers: 58200,
      posts: [
        {
          url: "https://instagram.com/reel/fitnessmotivation/1",
          caption: "10-Minuten Home Workout ohne Geräte 💪",
          mediaType: MediaType.REEL,
          postedAt: daysAgo(7),
          thumbnailUrl: "https://picsum.photos/seed/fitness1/400/400",
          baseViews: 62000,
        },
        {
          url: "https://instagram.com/p/fitnessmotivation/2",
          caption: "Mein Meal-Prep für die Woche",
          mediaType: MediaType.CAROUSEL,
          postedAt: daysAgo(3),
          thumbnailUrl: "https://picsum.photos/seed/fitness2/400/400",
          baseViews: 15000,
        },
      ],
    },
  ];

  for (const accountData of accountsData) {
    const creator = await prisma.creator.create({
      data: { name: accountData.creatorName },
    });

    const account = await prisma.account.create({
      data: {
        creatorId: creator.id,
        username: accountData.username,
        displayName: accountData.displayName,
        profileUrl: accountData.profileUrl,
        sltBioPageSlug: accountData.sltBioPageSlug,
      },
    });

    // AccountDailyMetric for the last 7 days, followers slowly growing
    for (let i = 6; i >= 0; i--) {
      const dayOffset = 6 - i;
      await prisma.accountDailyMetric.create({
        data: {
          accountId: account.id,
          date: daysAgo(i),
          followers:
            accountData.baseFollowers + dayOffset * randomInt(15, 80),
          totalViews: randomInt(20000, 90000),
        },
      });
    }

    for (const postData of accountData.posts) {
      const post = await prisma.post.create({
        data: {
          accountId: account.id,
          url: postData.url,
          caption: postData.caption,
          mediaType: postData.mediaType,
          postedAt: postData.postedAt,
          thumbnailUrl: postData.thumbnailUrl,
        },
      });

      // Daily snapshots since the post went live, up to today (max last 7 days)
      const daysSincePosted = Math.floor(
        (daysAgo(0).getTime() - postData.postedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const snapshotDays = Math.min(daysSincePosted, 6);

      for (let i = snapshotDays; i >= 0; i--) {
        const dayOffset = snapshotDays - i;
        const growthFactor = 1 + dayOffset * randomInt(3, 12) * 0.01;
        const views = Math.round(postData.baseViews * growthFactor);
        const likes = Math.round(views * (randomInt(3, 8) / 100));
        const comments = Math.round(likes * (randomInt(2, 6) / 100));
        const shares = Math.round(views * (randomInt(1, 3) / 1000));
        const saves = Math.round(views * (randomInt(2, 5) / 1000));

        await prisma.postDailyMetric.create({
          data: {
            postId: post.id,
            date: daysAgo(i),
            views,
            likes,
            comments,
            shares,
            saves,
          },
        });
      }
    }
  }

  console.log("Seed abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
