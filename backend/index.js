module.exports.handler = async(event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers: { "Allow": "POST" },
                body: JSON.stringify({ error: 'Método no permitido, utiliza POST.' })
            }
        }

        const { nombre } = JSON.parse(event.body);

        if (!nombre || nombre.trim() === "") {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El campo "nombre" es requerido y no puede estar vacío.' })
            }
        }

        const saludo = process.env.SALUDO || 'Hola,';

        return {
            statusCode: 200,
            body: JSON.stringify({ bienvenida: `${saludo} ${nombre}` }),
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Hubo un problema al procesar tu solicitud.' })
        }
    }
}
