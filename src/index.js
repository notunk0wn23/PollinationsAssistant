import { AIManager } from './manager.js'
import { systemPrompt } from './prompts.js'
import { timedate, math } from './function_calls.js'
import { marked } from 'marked'
import { hf_models } from './models.js'

const key = import.meta.env.VITE_HUGGINGFACE_API
const models = hf_models

const ai = new AIManager('huggingface', key, 'https://api-inference.huggingface.co/', models);
ai.config.systemPrompt = systemPrompt([timedate, math]);


ai.newChat();

const chatList = document.querySelector('#chat-list.conversation-list');
const messagesList = document.querySelector('.messages-list');

function updateChatList() {
    chatList.innerHTML = '';
    ai.chatData.history.forEach(chat => {
        const chatElement = document.createElement('li');
        chatElement.textContent = chat.name;
        chatElement.addEventListener('click', () => {
            ai.loadChat(chat.id);
            updateMessagesList();
        });
        chatList.appendChild(chatElement);
    });
}



function updateMessagesList() {
    messagesList.innerHTML = '';
    ai.chatData.active.messages.forEach(message => {
        if (message.role !== 'system') {
            const messageElement = document.createElement('div');
            const renderedContent = marked.parse(message.content);
            messageElement.innerHTML = renderedContent;
            messageElement.classList.add(message.role === 'user' ? 'user' : 'ai');
            messageElement.classList.add('message');
            messagesList.appendChild(messageElement);
        }
    });
}

updateChatList();

ai.callbacks.message = () => {
    updateMessagesList();
}

ai.callbacks.action = () => {
    const actionElement = document.createElement('div');
    actionElement.classList.add('message');
    actionElement.classList.add('action');
    actionElement.textContent = 'Performing Action...';
    messagesList.appendChild(actionElement);
}

ai.callbacks.preResponse = () => {
    const typingElement = document.createElement('div');
    typingElement.classList.add('message');
    typingElement.classList.add('typing');
    typingElement.innerHTML = `<span>.</span><span>.</span><span>.</span>`;
    messagesList.appendChild(typingElement);

    const dots = typingElement.getElementsByTagName('span');
    let dotIndex = 0;
    const dotInterval = setInterval(() => {
        if (dotIndex > 2) dotIndex = 0;
        for (let i = 0; i < dots.length; i++) {
            if (i === dotIndex) {
                dots[i].style.opacity = 1;
            } else {
                dots[i].style.opacity = 0;
            }
        }
        dotIndex++;
    }, 300);
}

ai.callbacks.postResponse = () => {
    const elements = messagesList.getElementsByClassName('typing');
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
    const actionElement = document.querySelector('.action');
    if (actionElement) {
        actionElement.parentNode.removeChild(actionElement);
    }
    updateMessagesList();
}

ai.callbacks.chatEdit = () => {
    updateChatList();
    updateMessagesList();
}


document.querySelector('#newChat.sidebar-greeting-button').addEventListener('click', () => {
    ai.newChat();
    updateChatList();
    updateMessagesList();
});
document.querySelector('#send-button').addEventListener('click', () => {
    const messageBox = document.querySelector('#message-box');
    const message = messageBox.value;
    messageBox.value = '';
    ai.sendMessage('user', message);
    ai.getAIResponse();
    //updateMessagesList();
});


document.querySelector('#toggleSidebar').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
    console.log("sidebar toggled")
});


// Welcome message at the top
const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : new Date().getHours() < 22 ? 'evening' : 'night';
const welcomeMessage = document.getElementsByClassName('greeting-text')[0];
welcomeMessage.textContent = `Good ${timeOfDay}.`;


// Expose AI for debug purposes
window.ai = ai