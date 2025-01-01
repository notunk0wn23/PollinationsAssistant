# Cypher
A powerful assistant capable of running various models with function calling.

## Running Locally
Setup an ENV Variable that contains Your API key for whatever platform you want to use. At the moment, the only platforms that are suppporte are OpenAI-Compatible APIs or the Hugging Face API.

```env
VITE_OPENAI_API_KEY=...
VITE_HUGGINGFACE_API_KEY=...
```


### Setting up the model
*You will need some coding for this part.* Pull up src/index.js. Here at the top you'll find various things. For OpenAI, the system is set to use an OpenAI compatable system known as groqcloud already. If you have a key, just set that as the key in the .env. Otherwise, set the UR: 