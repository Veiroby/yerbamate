import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db";

type AudienceRow = {
  "Email Address": string;
  "First Name": string;
  "Last Name": string;
};

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error("Usage: pnpm import:audience <path-to-audience-csv>");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  console.log(`Reading audience from ${filePath}...`);

  const raw = await fs.readFile(filePath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as AudienceRow[];

  console.log(`Parsed ${rows.length} rows from CSV.`);

  let added = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const rawEmail = (row["Email Address"] || "").trim().toLowerCase();
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      skippedInvalid++;
      continue;
    }

    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email: rawEmail },
        update: {},
        create: { email: rawEmail },
      });
      added++;
    } catch (err) {
      console.error(`Failed to upsert subscriber ${rawEmail}`, err);
    }
  }

  console.log(`Imported / ensured ${added} subscribers.`);
  console.log(`Skipped ${skippedInvalid} rows with invalid or empty email.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

