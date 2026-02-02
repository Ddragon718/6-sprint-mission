import { prismaClient } from "../src/libs/prismaClient.js";
import { resetDatabase } from "./utils/testDb.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
  await prismaClient.$disconnect();
});

