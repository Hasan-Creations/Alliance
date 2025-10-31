import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function GET() {
  const tokensSnapshot = await admin.firestore().collection("userTokens").get();

  const messages = tokensSnapshot.docs.map(doc => ({
    token: doc.id,
    notification: {
      title: "Task Reminder 🕒",
      body: "You still have unfinished tasks today!",
    },
  }));

  await Promise.all(messages.map(msg => admin.messaging().send(msg)));

  return Response.json({ success: true });
}
