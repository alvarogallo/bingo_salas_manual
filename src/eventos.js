// eventos.js
require('dotenv').config();
const moment = require('moment-timezone');
const https = require('https');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

class EventosService {
    constructor() {
        let baseUrl = process.env.SOCKET_URL;
        if (!baseUrl) {
            throw new Error('SOCKET_URL no está definido en las variables de entorno');
        }
        
        // Asegurar que la URL comienza con https://
        if (!baseUrl.startsWith('https://')) {
            baseUrl = 'https://' + baseUrl;
        }
        
        this.socketUrl = `${baseUrl}/enviar-mensaje`;
        this.socketCanal = process.env.SOCKET_CANAL;
        this.socketTokenEnvia = process.env.SOCKET_TOKEN_ENVIA;
        this.socketTokenRecibe = process.env.SOCKET_TOKEN_RECIBE;

        if (!this.socketCanal || !this.socketTokenEnvia) {
            throw new Error('Faltan variables de entorno requeridas (SOCKET_CANAL o SOCKET_TOKEN)');
        }

        console.log('\n=== Configuración del Socket ===');
        console.log('URL:', this.socketUrl);
        console.log('Canal:', this.socketCanal);
        console.log('Token:', this.socketTokenEnvia ? '********' : 'NO CONFIGURADO');
        console.log('Zona Horaria:', TIMEZONE);
        console.log('============================\n');
    }

    async emitirEvento(tipo, nombreEvento, fecha, mensaje = null) {
        return new Promise((resolve, reject) => {
            try {
                const fechaFormateada = this.formatearFecha(fecha);
                
                const data = {
                    canal: this.socketCanal,
                    token: this.socketTokenEnvia,
                    evento: nombreEvento,
                    mensaje: mensaje || {
                        fecha: fechaFormateada,
                        timestamp: moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                        zonaHoraria: TIMEZONE,
                        tipo: tipo
                    }
                };

                console.log(`📤 Enviando evento: ${nombreEvento}`, {
                    tipo,
                    mensaje: data.mensaje
                });

                const urlObj = new URL(this.socketUrl);
                const postData = JSON.stringify(data);

                const options = {
                    hostname: urlObj.hostname,
                    port: 443,
                    path: urlObj.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            console.error(`HTTP Error: ${res.statusCode} - ${responseData}`);
                            resolve(false);
                            return;
                        }

                        try {
                            const jsonResponse = JSON.parse(responseData);
                            if (jsonResponse.error) {
                                throw new Error(jsonResponse.error);
                            }
                            console.log(`✅ Evento enviado exitosamente: ${nombreEvento}`);
                            resolve(true);
                        } catch (error) {
                            console.error('Error al procesar respuesta:', error);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error(`❌ Error al emitir evento ${nombreEvento}:`, error.message);
                    resolve(false);
                });

                req.write(postData);
                req.end();

            } catch (error) {
                console.error(`❌ Error al emitir evento ${nombreEvento}:`, error.message);
                resolve(false);
            }
        });
    }

    formatearFecha(fecha) {
        return moment(fecha).tz(TIMEZONE).format('YYYY-MM-DD_HH:mm');
    }

    async verificarConexion() {
        try {
            const testEvent = {
                tipo: 'TEST',
                nombreEvento: 'conexion_test',
                fecha: new Date(),
                mensaje: { test: true }
            };

            const resultado = await this.emitirEvento(
                testEvent.tipo,
                testEvent.nombreEvento,
                testEvent.fecha,
                testEvent.mensaje
            );

            if (resultado) {
                console.log('✅ Conexión al socket verificada correctamente');
                return true;
            } else {
                console.error('❌ Error al verificar la conexión al socket');
                return false;
            }
        } catch (error) {
            console.error('❌ Error durante la verificación de conexión:', error);
            return false;
        }
    }
}

const eventosService = new EventosService();
console.log('EventosService inicializado');

module.exports = eventosService;