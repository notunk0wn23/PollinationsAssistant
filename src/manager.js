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
            uuid: crypto.randomUUID()
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
                "base": "You are an AI assistant. Your task is to respond to user inquiries with helpful & insightful answers. Respond in JSON with a key named 'content'. Regardless of circumstances, always respond in JSON. By default, use a casual although informative tone, aiming to make interactions feel natural. If you are unable to give a confident answer to a query, do not attempt to make a educated or non educated guess. Your task in this situation is to explain why you are unable to respond with a confident and/or correct answer to the user's query.",
                "actions": "You may perform extended functionality through actions. You may perform an action by expanding upon your existing JSON format. Within your JSON format, create a new key named 'actions'. The contents should be an array with a JSON object containing the action you wish to execute. Each item within the array should be a JSON object containing two keys: name, which should be the precise name of the action as listed within the action format object, and parameters, which contains a JSON object with action parameters as listed in the format. The third key withing each action is called 'flags'. It allows you to tell the action handler to perform extra tasks when you run an action. The only tag you may use is 'sendNextMessage', will trigger you to create a new chat message after the action is finished triggering. Optionally, when performing actions, you can omit the 'content' key to run an action before responding for a more natural user experience. When performing this, include the 'sendNextMessage' flag."
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
                        description: 'Perform mathematical operations using the javascript evaluation function. Equations must be formatted as they would be in javascript.',
                        parameters: {
                            equation: {
                                type: 'string',
                                description: 'The equation to evaluate.'
                            }
                        },
                        required: ["equation"]
                    }),
                    (params) => {
                        console.log("Math action: new request for evaluate: " + params.equation)
                        return {
                            result: eval(params.equation)
                        };
                    }
                ),
                'setChatName': new Action(
                    'setChatName',
                    JSON.stringify({
                        name: 'setChatName',
                        description: 'Set the name of the chat. Ensure that the name summarizes the content of the chat in a few words. When the user sends their initial message, name the chat after you respond.',
                        parameters: {
                            name: {
                                type: 'string',
                                description: 'The name of the chat.'
                            }
                        },
                        required: ['name']
                    }),
                    (params) => {
                        const previousName = this.chatData.active.name;
                        this.chatData.active.name = params.name;
                        this.saveChat();
                        this.callbacks.chatEdit();
                        return {
                            previous: previousName,
                            result: this.chatData.active.name 
                        }
                    }
                ),
                'timedate': new Action(
                    'timedate',
                    JSON.stringify({
                        name: 'timedate',
                        description: 'Get the current time and date. Unless the user specifies that they want both, only show the one they ask for. Only show seconds when requested.',
                        parameters: {
                            required: []
                        }
                    }),
                    (params) => {
                        return {
                            result: new Date().toLocaleString()
                        }
                    }
                )
            }
        }



        this.config.actions.getInfo = new Action(
            'getInfo',
            JSON.stringify({
                name: 'getInfo',
                description: 'Get information about yourself, the chat, and more. If a user requests info about you, such as your model or the model list or what actions you may run, you will use this action to get data about the requested information, and respond based off of the information given to you.',
                parameters: {
                    info: {
                        type: 'string',
                        description: 'The information you want to get. This can be: model - the model that you are running on, refer to models list for all possible models. chatHistory - list of previous chats and their names. seed - the random UUID value used to randomize your responses. actions - all possible actions you can perform. models - all possible models you can use.',
                    },
                    required: ['info']
                },
            }),
            (params) => {
                switch (params.info) {
                    case 'model':
                        return {
                            result: this.config.models.list[this.config.models.current].name + ' - ' + this.config.models.list[this.config.models.current].description
                        }
                    case 'chatHistory':
                        return {
                            result: this.chatData.history.map(chat => chat.name)
                        }
                    case 'seed':
                        return {
                            result: this.config.seed
                        }
                    case 'actions':
                        return {
                            result: Object.values(this.config.actions).map(action => action.name)
                        }
                    case 'models':
                        return {
                            result: this.config.models.list
                        }
                    default:
                        return {
                            result: 'Info type does not exist or no info type was specified.'
                        }
                }
            }
        )
        this.config.actions.setModel = new Action(
            'setModel',
            JSON.stringify({
                name: 'setModel',
                description: 'Set the model of the chat.',
                parameters: {
                    model: {
                        type: 'string',
                        description: 'The model to set the chat to. Use getInfo to request the models you may switch to before using this.'
                    },
                    required: ['model']
                }
            }),
            (params) => {
                const previousModel = this.config.models.current;
                this.config.models.current = params.model;
                return {
                    previous: previousModel,
                    result: params.model
                }
            }
        )

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
        const possibleActions = Object.values(this.config.actions).map(action => action.format).join('\n');
        this.chatData.active.basePrompt = this.config.prompts.base + this.config.prompts.actions + ' The following will contain raw JSON information which shall be used by you to format action requests and read reponses. requestFormat lists data needed to be added to your ' + possibleActions;
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

        const response = await fetch(this.API.text, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // You may be wondering; Where's the API key? Well, you dont need one for pollinations.
            // TODO: make this work with an API key if you want officai chatGPT servers or some other official OpenAI-compliant server
            body: JSON.stringify({
                messages: this.chatData.active.messages,
                seed: this.config.seed,
                model: this.config.models.current,
                jsonMode: false
            })
        });

        const data = await response.json();
        console.log(data)
        const message = JSON.parse(data.choices[0].message.content);

        if (message.content) this.sendMessage('assistant', message.content);
        if (message.actions) {
            if (message.actions.length > 0) {
                if (this.callbacks.action) this.callbacks.action();
                message.actions.forEach(action => {
                    if (this.config.actions[action.name]) {
                        if (this.callbacks.action) this.callbacks.action(action.name, action.parameters);
                        const result = this.config.actions[action.name].runAction(action.parameters);
                        this.sendMessage('system', JSON.stringify({
                            name: action.name,
                            messageType: "ActionResponse",
                            result: result
                        }));
                    }
                });
            }
        }

        if (message.tags) {
            message.tags.forEach(tag => {
                switch (tag) {
                    case 'sendNextMessage':
                        this.getAIResponse();
                        break;
                    default:
                        break;
                }
            });
        }

        if (this.callbacks.postResponse) this.callbacks.postResponse();
    }
}