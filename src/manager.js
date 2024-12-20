class Action {
    constructor(name, format, func) {
        this.name = name;
        this.format = format;
        this.func = func;
    }

    runAction(parameters) {
        return this.func(parameters);
    }
}

class Chat {
    constructor(id, messages) {
        this.id = id;
        this.messages = messages;
        this.basePrompt = '';
        this.name = "New Chat";
    }

    initialize() {
        this.messages = [];
        this.messages.push({
            role: 'system',
            content: this.basePrompt,
            timestamp: Date.now(),
            id: crypto.randomUUID()
        })
    }
}

export class AIManager {
    constructor(api) {
        this.API = {
            text: api,
            image: null
        }

        // Chat Data
        this.chatData = {
            active: new Chat(null, []),
            history: []
        };
        this.config = {
            seed: 0,
            prompts: {
                base: 'You are a helpful AI assistant. Respond in JSON format using a JSON object containing a \'content\' key, containing your message.',
                actions: "You may perform various actions by adding content to your JSON object. When you are requested to perform actions, you must structure your response by including a key called 'content,' which should contain a brief message or explanation of the action being performed for the user. Additionally, you must include a key called 'actions,' which will hold an array of action objects. Even if only one action is being performed, the 'actions' key should contain an array. Each action object will have two keys: 'name,' which specifies the type of action being performed (such as 'math,' 'fetchData,' or 'sortList'), and 'parameters,' which holds the necessary details or inputs for the action (such as an equation for 'math,' a URL for 'fetchData,' or a list for 'sortList'). If multiple actions are to be performed, additional action objects should be added to the 'actions' array. This approach allows for clear specification of the actions being taken and the associated parameters required for each action."
            },
            models: {
                current: 'openai',
                list: {
                    'openai': {
                        name: 'ChatGPT 4o',
                        censored: true,
                        type: 'chat',
                        description: 'A general conversational AI model from OpenAI.'
                    },
                    'mistral': {
                        name: 'Mistral NeMo',
                        censored: false,
                        type: 'chat',
                        description: 'A general conversational AI model from the Mistral AI team.'
                    },
                    'mistral-large': {
                        name: 'Mistral NeMo Large',
                        censored: false,
                        type: 'chat',
                        description: 'A larger version of the Mistral AI model.'
                    },
                    'llama': {
                        name: 'Meta Llama 3.1',
                        censored: true,
                        type: 'completion',
                        description: 'A completion-based large language model from Meta.'
                    },
                    'searchgpt': {
                        name: 'ChatGPT 4o',
                        censored: true,
                        type: 'chat',
                        description: 'ChatGPT 4o, with realtime network access natively'
                    },
                    'p1': {
                        name: 'P1',
                        censored: false,
                        type: 'chat',
                        description: 'An OptiLLM based model made by pollinations.ai'
                    },
                    'qwen-coder': {
                        name: 'Qwen Coder 32b Instruct',
                        censored: true,
                        type: 'chat',
                        description: 'An AI built around programming and coding in various languages'
                    }
                }
            },
            actions: {
                'math': new Action(
                    'math', 
                    JSON.stringify({
                        name: 'math',
                        description: 'Perform mathematical operations. Format as you would in javascript. Use for complex math operations, like 1251*35232',
                        requestParameters: {
                            equation: 'Javascript formatted math operation. Based off of the eval() function.'
                        },
                        responseParameters: {
                            result: 'The result of the math operation.'
                        }
                    }),
                    (equation) => {
                        return eval(equation);
                    }
                ),
                'setChatName': new Action(
                    'setChatName',
                    JSON.stringify({
                        name: 'setChatName',
                        description: 'Set the name of the chat. Make it short and sweet. Run this after the initial message.',
                        requestParameters: {
                            name: 'The name of the chat.'
                        },
                        responseParameters: {
                            previous: 'The previous name of the chat.',
                            result: 'The newname of the chat.'
                        }
                    }),
                    (name) => {
                        const previousName = this.chatData.active.name;
                        this.chatData.active.name = name;
                        return {
                            previous: previousName,
                            result: name
                        }
                    }
                )
            }
        }

        this.chatData.active.initialize();
    }

    saveChat() {
        const id = crypto.randomUUID();
        const messages = this.chatData.active.messages;
        this.chatData.history.push(new Chat(id, messages));
        this.chatData.active = new Chat(null, []);
    }

    loadChat(chatId) {
        const chat = this.chatData.history.find(chat => chat.id === chatId);
        if (chat) {
            this.chatData.active = chat;
        }
    }

    newChat() {
        this.saveChat();
        this.chatData.active = new Chat(null, []);
        const possibleActions = Object.values(this.config.actions).map(action => action.format).join('\n');
        this.chatData.active.basePrompt = this.config.prompts.base + this.config.prompts.actions + 'Here is the format for each currently availible action: ' + possibleActions;
        this.chatData.active.initialize();
    }

    sendMessage(role, content) {
        const uuid = crypto.randomUUID();
        const message = {
            uuid,
            role,
            content,
            timestamp: Date.now()
        }
        this.chatData.active.messages.push(message);
    }

    async getAIResponse() {
        const response = await fetch(this.API.text, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: this.chatData.active.messages,
                seed: this.config.seed,
                model: this.config.models.current,
                jsonMode: true
            })
        });

        const data = await response.json();
        console.log(data)
        const message = JSON.parse(data.choices[0].message.content);


        this.sendMessage('assistant', message);
    }
}