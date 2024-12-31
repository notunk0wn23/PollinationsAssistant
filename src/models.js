export const hf_models = {
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

export const fetch_models_openai = async (api_url, api_key) => {
    return await fetch(api_url + '/models', {
        headers: {
            'Authorization': `Bearer ${api_key}`
        }
    }).json();
}