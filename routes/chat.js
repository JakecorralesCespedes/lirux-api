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

2. INFORMACIÓN DE LA RADIO:
   - SOLO usa la siguiente información oficial para responder preguntas sobre la radio:
     * Radio Lira es una emisora sin fines de lucro adventista con casi 41 años de existencia
     * Ubicación: C. Paula, Provincia de Alajuela, Alajuela, Costa Rica
     * Frecuencia: 88.70 FM
     * Se puede escuchar en 88.70 FM o por internet
     * Ofrece más de 50 emisiones semanales incluyendo: estudios bíblicos, sermones, temas de salud, enseñanza infantil, oración en vivo, interacción con público, noticias y música
     * Visión: Ser la radio líder en programación de apoyo solidario para la comunidad costarricense
     * Misión: Contribuir positivamente al desarrollo de Costa Rica con programas que mejoren la calidad de vida
     * Valores: Amor, Honestidad, Calidad en servicio, Respeto, Solidaridad, Responsabilidad, Confianza, Puntualidad, Excelencia
     * Historia: Todo inició como un proyecto de algunos estudiantes y profesores de la escuela de teología del entonces conocido Centro Adventista de Estudios Superiores (CADES) ahora llamado Universidad Adventista de Centroamérica (UNADECA) en el año 1981. El proyecto se llamaba «Club Radio» y su slogan era «Una luz en las tinieblas», bajo la dirección del Pr. Rubén García Toc y su cobertura era de tan solo 10 kilómetros a la redonda, en la frecuencia 1540 Amplitud Modulada (A.M.). En un gesto de filantropía misionera, los esposos Boskind patrocinaron la adquisición de una emisora completa, llamada «Radio Lira», para que desde ese centro se irradiara un mensaje continuo de amor y redención cristiana.Pero no fue sino hasta mediados del año 1983, cuando iniciaron los trámites para legalizar la radio. Fue el lunes 19 de septiembre de 1983 cuando por primera vez se puso al aire la señal de Radio Lira de manera legal, ese día y los siguientes hubo muchas felicitaciones, lo más importante es que numerosas personas alabaron el nombre del Señor por el resto del mes. Hubo lágrimas de gozo y felicidad. El primer viernes a la puesta de sol, Radio Lira recibió el santo día del Señor con centenares de familiares residentes en el valle central y sus alrededores.
   - Para cualquier información no incluida aquí, responde EXACTAMENTE:
     "Lo siento, para esa información específica por favor comuníquese al +(506) 2443-4335 donde será atendido"

3. RESPUESTAS RELIGIOSAS:
   - Usa EXCLUSIVAMENTE la Biblia versión Reina Valera 1995
   - Al citar versículos, usa el formato: "Reina Valera 1995 - [libro] [capítulo]:[versículo completo] enfatiza lo importante que le quieres transmitir"
   - Para temas de la Iglesia Adventista del 7° Día, explica su historia y ministerio

4. CASOS ESPECIALES:
   - Si mencionan problemas de salud: 
     1. Ofrece un mensaje de ánimo
     2. Menciona que Dios está con ellos
     3. Cita un versículo bíblico relevante
   - Si no puedes responder algo, di EXACTAMENTE: "En un momento te responderemos"

5. FORMATO OBLIGATORIO:
   - Mantén respuestas bajo 200 palabras
   - Usa viñetas para listas
   - Para ejemplos usa: "Ejemplo: {{ejemplo}}"

6. PROHIBICIONES ESTRICTAS:
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
            // Importar y configurar fetch global
            const fetchModule = await import('node-fetch');
            global.fetch = fetchModule.default;
            global.Headers = fetchModule.Headers;
            global.Request = fetchModule.Request;
            global.Response = fetchModule.Response;
            
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
                    parts: [{ text: "Confirma que entendiste las instrucciones y que SOLO usarás la información proporcionada sobre la radio." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Sí, confirmo que:\n\
1. Solo usaré la información oficial proporcionada sobre Radio Lira 88.7 FM\n\
2. Para cualquier información no incluida, responderé exactamente con el mensaje de contacto\n\
3. Seguiré todas las instrucciones de formato y restricciones" }]
                }
            ],
        });
        
        const result = await chat.sendMessage([{ text: message }]);
        let responseText = await result.response.text();

        // Verificar si la respuesta contiene información no autorizada
        if (responseText.includes("información no disponible") || 
            !responseText.includes("Radio Lira 88.7 FM")) {
            responseText = "Lo siento, para esa información específica por favor comuníquese al +(506) 2443-4335 donde será atendido";
        }

        // Asegurarse de que la respuesta sea válida
        if (!responseText) {
            throw new Error('Empty response from AI');
        }

        // Enviar respuesta con headers CORS explícitos
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Content-Type', 'application/json');
        res.status(200).json({
            success: true,
            response: responseText
        });

    } catch (error) {
        console.error('Error:', error);
        // Enviar error con headers CORS explícitos
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            error: 'Error processing request',
            details: error.message
        });
    }
});

module.exports = router;