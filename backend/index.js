module.exports.handler = async event => {
    try {
        const validationResult = validateRequest(event);
        if (validationResult) return validationResult;
        
        const response = await fetchApiResponse(event);
        return response;

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not respond to the request.' }),
        }
    }
}


function validateRequest (event) { 
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { "Allow": "POST" },
            body: JSON.stringify({ error: 'Method not allowed, use POST.' })
        }
    }
    
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No request body received.' })
        }
    }

    const { userMessage, chatHistory } = JSON.parse(event.body);
        
    if (!userMessage || !chatHistory) {
        return {
            statusCode: 422,
            body: JSON.stringify({ error: 'Required fields are missing or malformed.' })
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
            body: JSON.stringify({ error: 'Error trying to connect to the API.' })
        }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let done, value;
    let modelMessage = "";

    while (!done) {
        ({ done, value } = await reader.read());

        if (done) { break }

        const chunk = decoder.decode(value, { stream: true });
        const json = chunk.replace(/^data: /, '').trim();
        const data = JSON.parse(json);

        newMessage = data.candidates[0].content.parts[0].text; //! ACCUMULATE CHUNKS AND SEND THE FINAL RESULT
        modelMessage += newMessage;

        // modelMessage = data.candidates[0].content.parts[0].text; //! ENVIA EL ULTIMO CHUNK
        
        console.log(modelMessage); // TODO

        updateChatHistory(chatHistory, "model", modelMessage);
    }

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
