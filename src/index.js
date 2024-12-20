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
            messagesList.appendChild(messageElement);
        }
    });
}

updateChatList();

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
    updateMessagesList();
});

