
const express = require('express');
const cantante = require('./cantante');
const app = express();
const port = process.env.PORT || 3000;
const EventosService = require('./eventos'); 


const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Variables de entorno cargadas:', {
    SOCKET_URL: process.env.SOCKET_URL || 'no encontrada',
    SOCKET_CANAL: process.env.SOCKET_CANAL || 'no encontrada',
    SOCKET_TOKEN_ENVIA: process.env.SOCKET_TOKEN_ENVIA || 'no encontrada',
    SOCKET_TOKEN_RECIBE: process.env.SOCKET_TOKEN_RECIBE || 'no encontrada'
});

// Middleware para parsear JSON
app.use(express.json());

// Middleware de validación
const validateRequest = (req, res, next) => {
    const { sala, intervalo, qty = 75 } = req.body;

    // Validar que sala sea un número entero
    if (!Number.isInteger(sala)) {
        return res.status(400).json({ error: 'sala debe ser un número entero' });
    }

    // Validar que intervalo sea un número entero entre 5 y 60
    if (!Number.isInteger(intervalo) || intervalo < 5 || intervalo > 60) {
        return res.status(400).json({ error: 'intervalo debe ser un número entero entre 5 y 60' });
    }

    // Si pasa todas las validaciones, continuar
    next();
};

// Ruta POST que acepta el JSON
app.post('/api/datos', validateRequest, (req, res) => {
    const { sala, intervalo, qty = 75 } = req.body;
    
    console.log('Datos recibidos:', {
        sala,
        intervalo,
        qty
    });

    cantante.iniciarCantante(sala, intervalo, qty);

    res.json({
        message: 'Cantante iniciado correctamente',
        datos: { sala, intervalo, qty }
    });
});
app.get('/api/test-socket', async (req, res) => {
    try {
        console.log('Iniciando prueba de socket...');
        console.log('URL:', process.env.SOCKET_URL);
        console.log('Canal:', process.env.SOCKET_CANAL);
        
        const resultado = await EventosService.emitirEvento(
            'TEST',
            'test_api',
            new Date(),
            { test: true }
        );

        console.log('Resultado de la prueba:', resultado);

        res.json({
            success: resultado,
            message: resultado ? 'Socket conectado' : 'Error de conexión',
            debug: {
                url: process.env.SOCKET_URL,
                canal: process.env.SOCKET_CANAL,
                tieneToken: !!process.env.SOCKET_TOKEN_ENVIA
            }
        });
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});
//Inicialr el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log('Configuración del socket:');
    console.log('URL:', process.env.SOCKET_URL);
    console.log('Canal:', process.env.SOCKET_CANAL);
});