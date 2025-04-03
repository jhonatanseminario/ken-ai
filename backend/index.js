module.exports.handler = async event => {
    try {
        const validationResult = validateRequest(event);
        if (validationResult) return validationResult;
        
        const response = await fetchApiResponse(event);
        return response;

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'No se pudo responder a la solicitud.' }),
        }
    }
}


function validateRequest (event) { 
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { "Allow": "POST" },
            body: JSON.stringify({ error: 'Método no permitido, utiliza POST.' })
        }
    }
    
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No se recibió el cuerpo de la solicitud.' })
        }
    }

    const { userMessage, chatHistory } = JSON.parse(event.body);
        
    if (!userMessage || !chatHistory) {
        return {
            statusCode: 422,
            body: JSON.stringify({ error: 'Faltan los campos requeridos o están malformados.' })
        }
    }
}


async function fetchApiResponse (event) {
    const apiUrl = process.env.API_URL;
    const apiKey = process.env.API_KEY;

    const { userMessage, chatHistory } = JSON.parse(event.body);

    updateChatHistory(chatHistory, "user", userMessage);

    const response = await fetch(apiUrl + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: chatHistory }),
    });

    if (!response.ok) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error al intentar conectarse con la API.' })
        }
    }

    const data = await response.json();
    const modelMessage = data.candidates[0].content.parts[0].text;

    updateChatHistory(chatHistory, "model", modelMessage);

    return {
        statusCode: 200,
        body: JSON.stringify({ contents: modelMessage, chatHistory }),
    }
}


function updateChatHistory (chatHistory, role, message) {
    chatHistory.push({
        role,
        parts: [{ text: message }]
    });
}
