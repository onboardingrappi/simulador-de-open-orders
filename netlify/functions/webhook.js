const admin = require('firebase-admin');

// Obtener las variables de entorno de Netlify
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const webhookAuthToken = process.env.WEBHOOK_AUTH_TOKEN;

// Verificar que las variables de entorno estén presentes
if (!serviceAccountKey || !webhookAuthToken) {
    console.error("Missing environment variables. Please set FIREBASE_SERVICE_ACCOUNT_KEY and WEBHOOK_AUTH_TOKEN.");
    return;
}

// Inicializar Firebase Admin SDK con la clave de servicio
try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    return;
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // Si la solicitud no es POST, devolver un error 405
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    // Verificar el token de autenticación en el encabezado
    const authHeader = event.headers['authorization'];
    if (!authHeader || authHeader.split(' ')[1] !== webhookAuthToken) {
        return {
            statusCode: 401,
            body: 'Unauthorized'
        };
    }

    try {
        const payload = JSON.parse(event.body);

        // Generar un ID único para el documento
        const logId = `${payload.id}_${Date.now()}`;

        // Guardar el payload completo en Firestore
        const docRef = db.collection('artifacts').doc(process.env.APP_ID).collection('public').doc('data').collection('webhook-logs').doc(logId);
        await docRef.set({
            payload: payload,
            receivedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Devolver una respuesta exitosa
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook received and logged successfully!" })
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};
