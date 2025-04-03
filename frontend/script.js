const chatArea = document.querySelector('#chat-area');
const userMessageInput = document.querySelector('#user-message-input');

let chatHistory = [];

userMessageInput.addEventListener('keydown', processUserMessage);


async function processUserMessage (event) {

    if (event.key === 'Enter') {
        const userMessage = userMessageInput.value.trim();
    
        if (!userMessage) return;
        
        const data = await fetchServerResponse(userMessage, chatHistory);
        
        if (data) {
            updateChatArea(data);
            chatHistory = data.chatHistory;
        }
    }
}


function updateChatArea (data) {
    chatArea.textContent = data.contents;
}


async function fetchServerResponse (userMessage, chatHistory) {
    try {
        const response = await fetch('/.netlify/functions/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage, chatHistory }),
        });

        if (!response.ok) {
            const errorData = await response.json();

            console.error(`The server returned an error.\n\n` +
                `Message: ${errorData.error}\n` +
                `Status: [${response.status}] ${response.statusText}\n\n`
            );

            return;
        }

        const data = await response.json();
        return data;
    
    } catch (error) {
        console.error(`Unable to connect to the server."\n\n${error}\n\n`);
    }
}
