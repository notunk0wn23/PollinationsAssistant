// Define a Chat class to manage the chat data

import { AIManager } from './manager.js';


const ai = new AIManager('https://text.pollinations.ai/openai');

ai.newChat();

const chatList = document.querySelector('.chat-list');
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
            messageElement.textContent = message.content;
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
    while(elements.length > 0){
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


document.querySelector('.new-chat-button').addEventListener('click', () => {
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



// Welcome message at the top
const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : new Date().getHours() < 22 ? 'evening' : 'night';
const messages = [
    "Howdy.",
    "Heya!",
    "How's it going?",
    "What's up?",
    "Welcome.",
    `Good ${timeOfDay}!`,
    "Hello!",
    "Hi!",
    "Hello there!",
    "Hiya!"
]

const message = messages[Math.floor(Math.random() * messages.length)];
const welcomeMessage = document.getElementsByClassName('greeting')[0];
welcomeMessage.textContent = message;



window.ai = ai