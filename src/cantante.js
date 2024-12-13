// cantante.js
const intervalosActivos = new Map();
const EventosService = require('./eventos'); 
const moment = require('moment-timezone');

async function emitirNumero(sala, numero, secuencia) {
    try {
        const fechaHora = moment().format('YYYY-MM-DD HH:mm:ss');
        const evento = `nums_${sala}`;
        const mensaje = {
            sec: secuencia,
            num: numero,
            fechaHora
        };

        console.log(`📤 Emitiendo a socket - Evento: ${evento}`, mensaje);

        const resultado = await EventosService.emitirEvento(
            'CANTANTE',
            evento,
            new Date(),
            mensaje
        );

        if (resultado) {
            console.log(`✅ Número emitido correctamente al socket - Sala ${sala}`);
        } else {
            console.log(`❌ Error al emitir número al socket - Sala ${sala}`);
        }

    } catch (error) {
        console.error(`Error al emitir número para sala ${sala}:`, error);
    }
}

async function emitirComando(sala, comando) {
    try {
        const fechaHora = moment().format('YYYY-MM-DD HH:mm:ss');
        const evento = `cmd_${sala}`;
        const mensaje = {
            cmd: comando,
            fechaHora
        };

        console.log(`📤 Emitiendo comando al socket - Evento: ${evento}`, mensaje);

        const resultado = await EventosService.emitirEvento(
            'CANTANTE',
            evento,
            new Date(),
            mensaje
        );

        if (resultado) {
            console.log(`✅ Comando emitido correctamente al socket - Sala ${sala}`);
        } else {
            console.log(`❌ Error al emitir comando al socket - Sala ${sala}`);
        }

    } catch (error) {
        console.error(`Error al emitir comando para sala ${sala}:`, error);
    }
}

function generarNumeroUnico(numerosEmitidos, maximo) {
    if (numerosEmitidos.size >= maximo) {
        return null;
    }

    let numero;
    do {
        numero = Math.floor(Math.random() * maximo) + 1;
    } while (numerosEmitidos.has(numero));

    return numero;
}

function iniciarCantante(sala, intervalo, qty, secs_to_start = 0) {
    if (intervalosActivos.has(sala)) {
        clearInterval(intervalosActivos.get(sala).intervaloId);
    }

    const numerosEmitidos = new Set();
    
    console.log(`[Sala ${sala}] Iniciando cantante - Espera inicial: ${secs_to_start}s, Intervalo: ${intervalo}s, Cantidad máxima: ${qty}`);

    // Esperar secs_to_start segundos antes de iniciar la secuencia
    setTimeout(async () => {
        // Emitir evento de inicio
        await emitirComando(sala, 'starting');
        console.log(`[Sala ${sala}] Enviado comando de inicio`);

        // Configurar el intervalo para todos los números, incluyendo el primero
        const intervaloId = setInterval(async () => {
            const numero = generarNumeroUnico(numerosEmitidos, qty);
            
            if (numero === null) {
                console.log(`[Sala ${sala}] Se han emitido todos los números del 1 al ${qty}`);
                clearInterval(intervaloId);
                intervalosActivos.delete(sala);
                return;
            }

            numerosEmitidos.add(numero);
            const secuencia = numerosEmitidos.size;
            
            console.log(`[Sala ${sala}] Número emitido: ${numero} (${secuencia}/${qty})`);
            await emitirNumero(sala, numero, secuencia);
        }, intervalo * 1000);

        intervalosActivos.set(sala, {
            intervaloId,
            numerosEmitidos
        });
    }, secs_to_start * 1000);
}

module.exports = {
    iniciarCantante
};