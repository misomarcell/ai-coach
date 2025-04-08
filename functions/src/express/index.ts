import cors from "cors";
import express from "express";
import { onRequest } from "firebase-functions/https";
import { router } from "./router";

const expressApp = express();
expressApp.use(express.json());
expressApp.use(cors());
expressApp.use(router);

export const expressApiHandler = onRequest({ timeoutSeconds: 300, region: "europe-west1", secrets: ["TELEGRAM_BOT_TOKEN"] }, expressApp);
