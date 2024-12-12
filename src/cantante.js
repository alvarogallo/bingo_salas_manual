// Almacena los intervalos activos por sala
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

function iniciarCantante(sala, intervalo, qty) {
    if (intervalosActivos.has(sala)) {
        clearInterval(intervalosActivos.get(sala).intervaloId);
    }

    const numerosEmitidos = new Set();
    
    console.log(`[Sala ${sala}] Iniciando cantante - Intervalo: ${intervalo}s, Cantidad máxima: ${qty}`);

    // Emitir primer número inmediatamente
    setTimeout(async () => {
        const primerNumero = generarNumeroUnico(numerosEmitidos, qty);
        if (primerNumero) {
            numerosEmitidos.add(primerNumero);
            console.log(`[Sala ${sala}] Primer número emitido: ${primerNumero} (1/${qty})`);
            await emitirNumero(sala, primerNumero, 1);
        }
    }, 0);

    // Configurar el intervalo para los siguientes números
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
}
module.exports = {
    iniciarCantante
};