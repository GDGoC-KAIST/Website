import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {SeedService} from "../services/seedService";
import {setCorsHeaders} from "../utils/cors";

const seedService = new SeedService();

export const seedAdmin = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {adminId, existed} = await seedService.createInitialAdmin();

    response.status(200).json({
      message: existed ? "Admin already exists" : "Admin account ready",
      adminId,
      note: "Copy this adminId to use in the Admin Dashboard",
    });
  } catch (error) {
    logger.error("Failed to seed admin", error);
    response.status(500).json({
      error: "Failed to seed admin",
    });
  }
});
