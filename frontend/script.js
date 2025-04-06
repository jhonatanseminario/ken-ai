const textPrimary = document.querySelector('.text-primary');
const textSecondary = document.querySelector('.text-secondary');
const logo = document.querySelector('#logo');
const chatArea = document.querySelector('#chat-area');
const userMessageInput = document.querySelector('#user-message-input');

let chatHistory = [];

userMessageInput.focus();
userMessageInput.addEventListener('keydown', processUserMessage);

logo.addEventListener('click', () => {
    chatArea.innerHTML = '';

    textPrimary.removeAttribute('hidden');
    textSecondary.removeAttribute('hidden');

    userMessageInput.classList.add('centered');
    userMessageInput.value = '';
    userMessageInput.focus();

    chatHistory = [];
});


async function processUserMessage (event) {

    if (event.key === 'Enter') {

        if (event.shiftKey) {
            event.preventDefault();

            const cursorPosition = userMessageInput.selectionStart;
            const currentValue = userMessageInput.value;

            userMessageInput.value = currentValue.slice(0, cursorPosition) + "\n" + currentValue.slice(cursorPosition);
            userMessageInput.selectionStart = userMessageInput.selectionEnd = cursorPosition + 1;

        } else {
            event.preventDefault();

            let userMessage = userMessageInput.value.trim();
        
            if (!userMessage) return;

            userMessageInput.classList.remove('centered')

            textPrimary.setAttribute('hidden', '');
            textSecondary.setAttribute('hidden', '');

            userMessage = userMessage.replace(/\n/g, '<br>');

            const userMessageBubble = document.createElement('div');
            
            userMessageBubble.classList.add('user-message-bubble');
            userMessageBubble.innerHTML = marked.parse(userMessage);

            chatArea.appendChild(userMessageBubble);

            document.body.scrollTop = document.body.scrollHeight;
            document.documentElement.scrollTop = document.documentElement.scrollHeight;

            userMessageInput.value = '';
            
            const data = await fetchServerResponse(userMessage, chatHistory);
            
            if (data) {
                updateChatArea(data);
                chatHistory = data.chatHistory;
            }
        }
    }
}


function updateChatArea (data) {
    const modelMessageBubble = document.createElement('div');
        
    modelMessageBubble.classList.add('model-message-bubble');
    modelMessageBubble.innerHTML = marked.parse(data.contents);

    chatArea.appendChild(modelMessageBubble);

    document.body.scrollTop = document.body.scrollHeight;
    document.documentElement.scrollTop = document.documentElement.scrollHeight;
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
        console.error(`Unable to connect to the server.\n\n${error}\n\n`);
    }
}
