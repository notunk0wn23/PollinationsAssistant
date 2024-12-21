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
                actions: "You may perform various actions by adding content to your JSON object. When you are requested to perform actions, you must structure your response by including a key called 'content,' which should contain a brief message or explanation of the action being performed for the user. Additionally, you must include a key called 'actions,' which will hold an array of action objects. Even if only one action is being performed, the 'actions' key should contain an array. Each action object will have two keys: 'name,' which specifies the type of action being performed (such as 'math,' 'fetchData,' or 'sortList'), and 'parameters,' which holds the necessary details or inputs for the action (such as an equation for 'math,' a URL for 'fetchData,' or a list for 'sortList'). If multiple actions are to be performed, additional action objects should be added to the 'actions' array. This approach allows for clear specification of the actions being taken and the associated parameters required for each action. If an action is not included in your avalible actions, it is not useable. Do not attempt to use it. Unless an action has a high chance of taking an extensive amount of time, you are to omit the 'content' key when you run an action. Once you have recived the output of the action, you may then reinclude the content key and say something."
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
                        requestParameters: {
                            name: 'The name of the chat.'
                        },
                        responseParameters: {
                            previous: 'The previous name of the chat.',
                            result: 'The newname of the chat.'
                        }
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
                        requestParameters: {},
                        responseParameters: {
                            result: 'The current time and date.'
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
                requestParameters: {
                    info: "The information you want to get. This can be: model - the model that you are running on, refer to models list for all possible models. chatHistory - list of previous chats and their names. seed - the random UUID value used to randomize your responses. actions - all possible actions you can perform. models - all possible models you can use.",
                },
                responseParameters: {
                    result: 'The information about the chat.'
                }
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
                requestParameters: {
                    model: `The model of the chat. Must be one of the following: ${JSON.stringify(this.config.models.list)}`
                },
                responseParameters: {
                    previous: 'The previous model of the chat.',
                    result: 'The new model of the chat.'
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
        this.chatData.active.basePrompt = this.config.prompts.base + this.config.prompts.actions + 'Here is the format for each currently availible action: ' + possibleActions;
        this.chatData.active.initialize();

        if (this.callbacks.chatLoad) this.callbacks.chatLoad();
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
                jsonMode: true
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
                this.getAIResponse();
            }
        }

        if (this.callbacks.postResponse) this.callbacks.postResponse();
    }
}