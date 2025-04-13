import * as smd from "./smd.js";

const textPrimary = document.querySelector('.text-primary');
const textSecondary = document.querySelector('.text-secondary');
const logo = document.querySelector('#logo');
const chatArea = document.querySelector('#chat-area');
const userMessageInput = document.querySelector('#user-message-input');

const renderer = smd.default_renderer(chatArea);
const parser = smd.parser(renderer);

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

            const userMessageBubble = document.createElement('div');
            
            userMessageBubble.classList.add('user-message-bubble');
            userMessageBubble.innerHTML = userMessage.replace(/\n/g, '<br>');

            chatArea.appendChild(userMessageBubble);

            document.body.scrollTop = document.body.scrollHeight;
            document.documentElement.scrollTop = document.documentElement.scrollHeight;

            userMessageInput.value = '';
            
            await fetchServerResponse(userMessage, chatHistory);
        }
    }
}

async function fetchServerResponse (userMessage, chatHistory) {
    const endpoint = 'https://jsjbyfewdphbvloudeaz.supabase.co/functions/v1/hola-mundo';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzamJ5ZmV3ZHBoYnZsb3VkZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MDM4MDIsImV4cCI6MjA1OTQ3OTgwMn0.9Wds_GSE_-CsFXaeNP6zwTQDc2j807qnIzM_jNbLxuw';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
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

        const modelMessageBubble = document.createElement('div');
        modelMessageBubble.classList.add('model-message-bubble');
        chatArea.appendChild(modelMessageBubble);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let done, chunk;

        while (!done) {
            const { value, done } = await reader.read();

            if (done) break;

            chunk = decoder.decode(value, { stream: true });

            const matches = chunk.match(/(?=\{"message":)({[\s\S]*?})(?=\{|$)/g);
            const objects = matches.map(json => JSON.parse(json));


            objects.forEach( obj => {
                modelMessageBubble.textContent = " ";
                smd.parser_write(parser, obj.message);
            });

            const codeBlocks = document.querySelectorAll('pre code');

            codeBlocks.forEach( block => {
                block.removeAttribute("data-highlighted");
                
                if (!block.className.includes('language-') && block.className !== "animation") {
                    block.className = `language-${block.className || 'txt'}`;
                }
        
                if (block.className.startsWith('language-')) {
                    const languageClass = Array.from(block.classList).find(className => className.startsWith('language-'));
        
                    if (languageClass) {
                        const language = languageClass.replace('language-', '');
                        const uniqueId = `language-style-${language}`;
                        const pre = block.closest('pre');
        
                        if (!document.getElementById(uniqueId)) {
                            const style = document.createElement('style');
                            style.id = uniqueId;
        
                            style.textContent = `
                                pre code.language-${language}::before {
                                    content: "${language}";
                                    color: rgb(96, 96, 96);
                                    display: block;
                                    font-size: 12px;
                                    left: -8px;
                                    position: relative;
                                    top: -24px;
                                }
                            `;
                            document.head.appendChild(style);
                        }

                        if (!pre.querySelector('button')) {
                            const button = document.createElement('button');

                            button.textContent = 'Copiar';
                            button.classList.add('copy-button');
                            pre.appendChild(button);

                            button.addEventListener('click', () => {
                                navigator.clipboard.writeText(block.textContent);
                                button.textContent = '✔ Copiado';
                                    
                                setTimeout(() => {
                                    button.textContent = 'Copiar';
                                }, 2000);
                            });
                        }
                    }
                }
                hljs.highlightElement(block); 
            });

        }
        
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach( block => {
            const lines = block.textContent.split('\n');
            const firstLine = lines[0];
            const match = firstLine.match(/^ +/);

            if (!match) return;
        
            const baseIndent = match[0].length;
            const trimmedLines = lines.map( line => line.slice(baseIndent) );
        
            block.textContent = trimmedLines.join('\n');
            block.removeAttribute("data-highlighted");
            hljs.highlightElement(block);
        });
        
        smd.parser_end(parser);

        chatHistory.push(
            { role: "user", text: userMessage },
            { role: "model", text: modelMessageBubble.textContent }
        );
    
    } catch (error) {
        console.error(`Unable to connect to the server.\n\n${error}\n\n`);
    }
}
