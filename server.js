require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://lirux-api.onrender.com'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Middleware para procesar JSON
app.use(express.json());

// Importar rutas
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 