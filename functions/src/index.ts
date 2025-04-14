import { initializeApp } from "firebase-admin/app";
import { initializeFirestore } from "firebase-admin/firestore";
import { expressApiHandler } from "./express";
import { analysisRequestCreated } from "./triggers/analysis-request-created.trigger";
import { userAuthCreated } from "./triggers/auth-created.trigger";
import { communicationCreated } from "./triggers/communication-created.trigger";
import { credentialsCreated } from "./triggers/credential-created.trigger";
import { exportRequestCreated } from "./triggers/export-request-created.trigger";
import { healthProfileWrittenTrigger } from "./triggers/health-profile-written.trigger";
import { scheduledRun } from "./triggers/scheduler.trigger";
import { storageTrigger } from "./triggers/storage.trigger";

const FIREBASE_APP = initializeApp();
const FIRESTORE = initializeFirestore(FIREBASE_APP);
FIRESTORE.settings({ ignoreUndefinedProperties: true });
console.log("Firebase app initialized", { firebaseApp: FIREBASE_APP.name, firestore: FIRESTORE.databaseId });

exports.authCreated = userAuthCreated;
exports.credentialsCreated = credentialsCreated;
exports.communicationCreated = communicationCreated;
exports.analysisCreated = analysisRequestCreated;
exports.exportRequestCreated = exportRequestCreated;
exports.api = expressApiHandler;
exports.scheduler = scheduledRun;
exports.storage = storageTrigger;
exports.healthProfileWritten = healthProfileWrittenTrigger;
