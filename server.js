import { handler } from './build/handler.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Let SvelteKit handle everything else
app.use(handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
});
