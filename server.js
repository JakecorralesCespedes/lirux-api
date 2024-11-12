require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON
app.use(express.json());

// Importar rutas
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 