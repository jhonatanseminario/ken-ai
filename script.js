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

            const lines = userMessage.split('\n');

            lines.forEach( (line, index) => {
                userMessageBubble.appendChild(document.createTextNode(line));
                if (index < lines.length - 1) userMessageBubble.appendChild(document.createElement('br'));
            });

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

    const thinkingBubble = document.createElement('div');

    thinkingBubble.classList.add('thinking-message');
    thinkingBubble.textContent = 'Pensando...';
    chatArea.appendChild(thinkingBubble);

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

        if (thinkingBubble && thinkingBubble.parentNode) thinkingBubble.remove();

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
                const parts = obj.message.split(/(```)/);

                parts.forEach( part => { if (part) smd.parser_write(parser, part) });
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
                        const pre = block.closest('pre');
        
                        if (!pre.querySelector('.title-button')) {
                            const titleButton = document.createElement('button');

                            titleButton.textContent = `${language}`;
                            titleButton.classList.add('title-button');

                            pre.appendChild(titleButton);
                        }
                    
                        if (!pre.querySelector('.copy-button')) {
                            const copyButton = document.createElement('button');

                            copyButton.textContent = 'Copiar';
                            copyButton.classList.add('copy-button');

                            pre.appendChild(copyButton);

                            copyButton.addEventListener('click', () => {
                                navigator.clipboard.writeText(block.textContent);
                                copyButton.textContent = '✔ Copiado';
                                    
                                setTimeout(() => {
                                    copyButton.textContent = 'Copiar';
                                }, 2000);
                            });
                        }
                    }
                }
                hljs.highlightElement(block); 
            });

        }
        
        const codeBlocks = document.querySelectorAll('pre code');

        if (codeBlocks.length > 0) {
            const lastBlock = codeBlocks[codeBlocks.length - 1];
            const lines = lastBlock.textContent.split('\n');
            const firstLine = lines[0];
            const match = firstLine.match(/^ +/);

            if (match) {
                const baseIndent = match[0].length;
                const trimmedLines = lines.map( line => line.slice(baseIndent) );

                lastBlock.textContent = trimmedLines.join('\n');
                lastBlock.removeAttribute("data-highlighted");
                hljs.highlightElement(lastBlock);
            }
        }   

        smd.parser_end(parser);

        chatHistory.push(
            { role: "user", text: userMessage },
            { role: "model", text: modelMessageBubble.textContent }
        );
    
    } catch (error) {
        console.error(`Unable to connect to the server.\n\n${error}\n\n`);
    }
}

function wrapTablesInContainer() {
    const tables = chatArea.querySelectorAll("table");

    tables.forEach( table => {
        if (!table.parentElement.classList.contains("table-wrapper")) {
            const wrapper = document.createElement("div");
            
            wrapper.className = "table-wrapper";
            table.parentElement.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

const observerTables = new MutationObserver(() => {
    wrapTablesInContainer();
});

observerTables.observe(chatArea, {
    childList: true,
    subtree: true
});

const observerBlockCodes = new MutationObserver( mutations => {
    mutations.forEach( mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'PRE' && node.querySelector('code')) {
                    const codeElements = document.querySelectorAll('pre code');
                    
                    if (codeElements.length > 1) {
                        const allButLast = Array.from(codeElements).slice(0, -1);

                        allButLast.forEach( penultimateCode => {
                            const lines = penultimateCode.textContent.split('\n');
                            const firstLine = lines[0];
                            const match = firstLine.match(/^ +/);
                
                            if (!match) return;

                            const baseIndent = match[0].length;
                            const trimmedLines = lines.map( line => line.slice(baseIndent) );
                        
                            penultimateCode.textContent = trimmedLines.join('\n');
                            penultimateCode.removeAttribute("data-highlighted");

                            hljs.highlightElement(penultimateCode);
                        });
                    }
                }
            });
        }
    });
});

observerBlockCodes.observe(chatArea, {
    childList: true,
    subtree: true
});
