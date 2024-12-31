class Chat {
    constructor(id, messages) {
        this.id = id;
        this.messages = messages;
        this.basePrompt = ``;
        this.name = "New Chat";
    }

    initialize() {
        this.messages = [];
        this.messages.push({
            role: 'system',
            content: this.basePrompt,
            timestamp: Date.now(),
            uuid: crypto.randomUUID()
        })
    }
}


export class AIManager {
    constructor(apiType, apiKey, apiUrl, models, config) {
        this.API = {
            type: apiType,
            key: apiKey,
            url: apiUrl
        }

        // Chat Data
        this.chatData = {
            active: new Chat(null, []),
            history: []
        };
        this.config = config || {
            seed: 0,
            temperature: 0.6,
            maxTokens: 1024,
            models: {
                current: '',
                list: models
            },
            systemPrompt: '',
            functions: {}
        }

        this.chatData.active.basePrompt = this.config.systemPrompt;
        this.chatData.active.initialize();

        /* Callbacks can be used to, ex, render chat messages once they've been generated adding a function. 
        You can use the following callbacks:
          - message - On Message Send
          - preResponse - Before fetching AI Response
          - postResponse - After fetching AI Response
          - chatSave - After Chat is saved
          - chatEdit - After Chat is edited, like name changes
          - chatLoad - After Chat is loaded
          - action - On Action Ran
        */
        this.callbacks = {
            message: null,
            preResponse: null,
            responseChunkRecived: null,
            postResponse: null,
            chatSave: null,
            chatEdit: null,
            chatLoad: null,
            action: null
        }
    }

    saveChat() {
        const id = crypto.randomUUID();
        const messages = this.chatData.active.messages;
        this.chatData.history.push(new Chat(id, messages));
        this.chatData.active = this.chatData.history[this.chatData.history.length - 1];
        //this.chatData.active = new Chat(null, []);

        if (this.callbacks.chatSave) this.callbacks.chatSave();
    }

    loadChat(chatId) {
        this.saveChat();
        const chat = this.chatData.history.find(chat => chat.id === chatId);
        if (chat) {
            this.chatData.active = chat;
        }

        if (this.callbacks.chatLoad) this.callbacks.chatLoad();
    }

    newChat() {
        this.saveChat();
        this.chatData.active = new Chat(null, []);
        this.chatData.active.basePrompt = this.config.systemPrompt;
        this.chatData.active.initialize();

        if (this.callbacks.chatLoad) this.callbacks.chatLoad();
    }

    sendMessage(role, content, messageTags) {
        // Message tags are a way to specify if something specific happened when a message happened, such as an action.
        const uuid = crypto.randomUUID();
        const message = {
            uuid,
            role,
            content,
            timestamp: Date.now(),
            tags: messageTags
        }
        this.chatData.active.messages.push(message);

        if (this.callbacks.message) this.callbacks.message(message);
    }

    async getAIResponse() {
        if (this.callbacks.preResponse) this.callbacks.preResponse()

        // Get Data
        let out, responseData, url

        switch (this.API.type) {
            case 'openai':
                url = this.API.url
                responseData = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.API.key}`
                    },
                    body: JSON.stringify({
                        model: this.config.models.current,
                        messages: this.chatData.active.messages,
                    })
                }).json();

                out = responseData.choices[0].message?.content;
                break;
            case 'huggingface':
                const { inference } = await import('@huggingface/inference');
                const hfInference = new inference.HFInference(this.API.key);
                const result = hfInference.chatCompletion({
                    temperature: this.config.temperature,
                    max_length: this.config.maxTokens,
                    model: this.config.models.current,
                    messages: this.chatData.active.messages,
                });
                out = result.choices[0].message?.content;
                break;
        }


        console.log(out)
        let message


        try {
            message = JSON.parse(out);
        } catch (error) {
            if (out.startsWith('```json') && out.endsWith('```')) {
                try {
                    const trimmedMessage = out.split('\n').slice(1, -1).join('\n');
                    const parsedMessage = JSON.parse(trimmedMessage);
                    message = parsedMessage;
                } catch (jsonError) {
                    message = { content: out };
                }
            } else {
                message = { content: out };
            }
        }

        if (message.content) this.sendMessage('assistant', message.content);

        if (message.functions) {
            if (message.functions.length > 0) {
                message.functions.forEach(functionCall, index => {
                    if (this.config.functions[functionCall.name]) {
                        const result = this.config.functions[functionCall.name].run(functionCall.parameters);
                        this.sendMessage('user', "(SYSTEM MSG) Function call at index " + index + " of function calls arrayreturned: " + JSON.stringify(result));
                    }
                });
                this.getAIResponse();
            }
        }

        if (this.callbacks.postResponse) this.callbacks.postResponse();
    }
}