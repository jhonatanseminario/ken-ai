//*==========================================================================*//
//*                     INICIALIZAR CONSTANTES GLOBALES                      *//
//*==========================================================================*//

const chatArea = document.querySelector('#chat-area');
const userMessageInput = document.querySelector('#user-message-input');

let chatHistory = [];


//*==========================================================================*//
//*                       MANEJAR ENTRADA DEL USUARIO                        *//
//*==========================================================================*//

userMessageInput.addEventListener('keydown', async event => {
    if (event.key === 'Enter') {
        const userMessage = userMessageInput.value.trim();
    
        if (!userMessage) return;
        
        const data = await fetchServerResponse(userMessage, chatHistory);
        
        if (data) {
            chatArea.textContent = data.contents;
            chatHistory = data.chatHistory;
        }
    }
});


//*==========================================================================*//
//*                      REALIZAR SOLICITUD AL BACKEND                       *//
//*==========================================================================*//

async function fetchServerResponse(userMessage, chatHistory) {
    try {
        const response = await fetch('/.netlify/functions/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage, chatHistory }),
        });

        if (!response.ok) {
            const errorData = await response.json();

            console.error(`El servidor ha devuelto un error.\n\n` +
                `Message: ${errorData.error}\n` +
                `Status: [${response.status}] ${response.statusText}\n\n`
            );

            return;
        }

        const data = await response.json();
        return data;
    
    } catch (error) {
        console.error(`No se pudo establecer la conexión con el servidor.\n\n${error}\n\n`);
    }
}
