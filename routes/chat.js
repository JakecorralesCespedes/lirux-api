const express = require('express');
const router = express.Router();
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuración específica de CORS para esta ruta
const corsOptions = {
  origin: true, // Permite cualquier origen
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar CORS a nivel de router
router.use(cors(corsOptions));

// Define las instrucciones iniciales
const SYSTEM_PROMPT = `Eres un asistente virtual profesional para Radio Lira 88.7 FM. DEBES SEGUIR ESTAS INSTRUCCIONES AL PIE DE LA LETRA:

1. IDENTIDAD:
   - Siempre identifícate como el asistente virtual de Radio Lira 88.7 FM cuando te lo pregunten
   - Cuando menciones la radio, SIEMPRE usa el formato exacto "Radio Lira 88.7 FM"

2. RESPUESTAS RELIGIOSAS:
   - Usa EXCLUSIVAMENTE la Biblia versión Reina Valera 1995
   - Al citar versículos, usa el formato: "Reina Valera 1995 - [libro] [capítulo]:[versículo]"
   - Para temas de la Iglesia Adventista, explica su historia y ministerio

3. CASOS ESPECIALES:
   - Si mencionan problemas de salud: 
     1. Ofrece un mensaje de ánimo
     2. Menciona que Dios está con ellos
     3. Cita un versículo bíblico relevante
   - Si no puedes responder algo, di EXACTAMENTE: "En un momento te responderemos"

4. FORMATO OBLIGATORIO:
   - Mantén respuestas bajo 200 palabras
   - Usa viñetas para listas
   - Para ejemplos usa: "Ejemplo: {{ejemplo}}"

5. PROHIBICIONES ESTRICTAS:
   - NO des consejos médicos
   - NO compartas información personal
   - NO proceses pagos
   - NO accedas a enlaces externos
   - NO des información falsa o engañosa

¿Has entendido estas instrucciones? Debes seguirlas al pie de la letra en cada respuesta.`;

let model = null;
let initialized = false;

// Inicialización asíncrona
async function initializeAI() {
    try {
        if (!initialized) {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            initialized = true;
        }
    } catch (error) {
        console.error('Error initializing AI:', error);
        throw error;
    }
}

router.post('/', async (req, res) => {
    try {
        if (!initialized) {
            await initializeAI();
        }

        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Sí, he entendido completamente las instrucciones y las seguiré al pie de la letra." }],
                }
            ],
        });
        
        const result = await chat.sendMessage([{ text: message }]);
        const responseText = await result.response.text();
        
        // Asegurarse de que la respuesta sea válida
        if (!responseText) {
            throw new Error('Empty response from AI');
        }

        // Enviar respuesta con headers CORS explícitos
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Content-Type', 'application/json');
        res.status(200).json({
            success: true,
            response: responseText
        });

    } catch (error) {
        console.error('Error:', error);
        // Enviar error con headers CORS explícitos
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            error: 'Error processing request',
            details: error.message
        });
    }
});

module.exports = router;