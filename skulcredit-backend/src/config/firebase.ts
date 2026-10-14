import admin from 'firebase-admin';
import env from './env';
import logger from './logger';

let initialised = false;

export function initFirebase(): void {
  if (initialised) return;

  if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
    logger.warn('Firebase credentials not configured — FCM push notifications disabled');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey:  env.firebase.privateKey,
    }),
  });

  initialised = true;
  logger.info('Firebase Admin SDK initialised');
}

export function getFirebaseMessaging(): unknown {
  if (!initialised) return null;
  return admin.messaging();
}

export function isFirebaseReady(): boolean {
  return initialised;
}
