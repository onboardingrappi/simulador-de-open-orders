const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Inicialización de Firebase Admin SDK (asegúrate de configurar las variables de entorno en Netlify)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = getFirestore();
const auth = getAuth();

// Token de autenticación fijo para pruebas
const FIXED_AUTH_TOKEN = process.env.WEBHOOK_AUTH_TOKEN;
const FIREBASE_COLLECTION = `artifacts/${process.env.APP_ID}/public/data/webhook-logs`;

exports.handler = async (event) => {
  // Asegurarse de que la solicitud sea POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  // Validar el token de autenticación
  const token = event.headers.authorization;
  if (!token || token.replace('Bearer ', '') !== FIXED_AUTH_TOKEN) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: Invalid authentication token" })
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Guardar el log en Firestore
    await db.collection(FIREBASE_COLLECTION).add({
      body: body,
      headers: event.headers,
      receivedAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK" })
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" })
    };
  }
};
