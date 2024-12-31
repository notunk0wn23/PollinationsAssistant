import { HfInference } from "@huggingface/inference";

//import { Action } from "./actions.js";
import { systemPrompt } from "./prompts.js";
import { timedate, math } from "./function_calls.js";

class Chat {
    constructor(id, messages) {
        this.id = id;
        this.messages = messages;
        this.basePrompt = systemPrompt();
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
    constructor(key) {
        this.API = {
            key: key
        }

        // Chat Data
        this.chatData = {
            active: new Chat(null, []),
            history: []
        };
        this.config = {
            seed: 0,
            temperature: 0.6,
            maxTokens: 1024,
            topP: 0.9,
            models: {
                current: 'mistralai/Mistral-Nemo-Instruct-2407',
                list: {
                    'meta-llama/Llama-3.1-70B-Instruct': {
                        name: 'Llama 3.1 Instruct',
                        model: 'meta-llama/Llama-3.3-70B-Instruct',
                        description: 'The Meta Llama 3.3 multilingual large language model (LLM) is an instruction tuned generative model in 70B (text in/text out).'
                    },
                    'google/gemma-2-9b-it': {
                        name: 'Gemma 2',
                        model: 'google/gemma-2-9b-it',
                        description: 'Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.'
                    },
                    'mistralai/Mistral-Nemo-Instruct-2407': {
                        name: 'Mistral NeMo',
                        model: 'mistralai/Mistral-Nemo-Instruct-2407',
                        description: 'The Mistral-Nemo-Instruct-2407 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-Nemo-Base-2407. Trained jointly by Mistral AI and NVIDIA, it significantly outperforms existing models smaller or similar in size.'
                    },
                    'mistralai/Mistral-7B-Instruct-v0.3': {
                        name: 'Mistral',
                        model: 'mistralai/Mistral-7B-Instruct-v0.3',
                        description: 'The Mistral-7B-v0.3 Large Language Model (LLM) is a Mistral-7B-v0.2 with extended vocabulary.'
                    },
                    'Qwen/Qwen2.5-Coder-32B-Instruct': {
                        name: 'Qwen Coder',
                        model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
                        description: 'Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models (formerly known as CodeQwen).'
                    },
                    'Qwen/QwQ-32B-Preview': {
                        name: 'QwQ',
                        model: 'Qwen/QwQ-32B-Preview',
                        description: 'QwQ-32B-Preview is an experimental research model developed by the Qwen Team, focused on advancing AI reasoning capabilities.'
                    },
                    '01-ai/Yi-1.5-34B-Chat7': {
                        name: 'Yi 1.5',
                        model: '01-ai/Yi-1.5-34B-Chat7',
                        description: 'Yi-1.5 is an upgraded version of Yi. It is continuously pre-trained on Yi with a high-quality corpus of 500B tokens and fine-tuned on 3M diverse fine-tuning samples.'
                    },
                    'HuggingFaceH4/zephyr-7b-alpha': {
                        name: 'Zephyr',
                        model: 'HuggingFaceH4/zephyr-7b-alpha',
                        description: 'Zephyr is a series of language models that are trained to act as helpful assistants. Zephyr-7B-α is the first model in the series, and is a fine-tuned version of mistralai/Mistral-7B-v0.1 that was trained on on a mix of publicly available, synthetic datasets using Direct Preference Optimization (DPO). '
                    },
                    'NousResearch/Hermes-3-Llama-3.1-8B': {
                        name: 'Hermes',
                        model: 'NousResearch/Hermes-3-Llama-3.1-8B',
                        description: 'Hermes 3 is a generalist language model with many improvements over Hermes 2, including advanced agentic capabilities, much better roleplaying, reasoning, multi-turn conversation, long context coherence, and improvements across the board',
                    }
                }
            },
            functions: {
                timedate: timedate,
                math: math
            }
        }

        this.chatData.active.basePrompt = systemPrompt(this.config.functions);
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
        this.chatData.active.basePrompt = systemPrompt(this.config.functions);
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
        let out

        switch (this.API.type) {
            case 'openai':
                const data = await fetch('')
                
                break;
            case 'huggingface':
                const inf = new HfInference(this.API.key)
                const data = await inf.chatCompletion({
                    model: this.config.models.current,
                    messages: this.chatData.active.messages,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens,
                    stream: false,
                });

                out = data.choices[0].message?.content;
                break;
        }


        const out = data.choices[0].message?.content;
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