import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// Helper para convertir el historial de chat al formato de LangChain
const formatLangChainHistory = (history) => {
    return history.map(msg => {
        if (msg.senderType === 'AI') {
            return new AIMessage(msg.content);
        }
        return new HumanMessage(msg.content);
    });
};

// Helper para convertir el historial de chat al formato de Google Gemini
const formatGoogleHistory = (history) => {
    return history.map(msg => ({
        role: msg.senderType === 'AI' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));
};

export const getAiResponse = async (message, history, courseConfig) => {
    if (!courseConfig) {
        throw new Error("Course configuration is missing. Cannot get AI response.");
    }

    const {
        aiProvider,
        aiModelName,
        aiApiKey,
        ollamaBaseUrl,
        aiSystemPrompt
    } = courseConfig;

    try {
        let aiResponse;
        const systemMessage = aiSystemPrompt || "You are a helpful assistant.";
        
        const provider = aiProvider.toUpperCase().replace(/\s+/g, '_');

        if (provider === 'GOOGLE_GEMINI' || provider === 'GOOGLE') {
            if (!aiApiKey) {
                throw new Error("Google Gemini API Key is not configured for this course.");
            }
            
            // Usar el SDK oficial de Google
            const genAI = new GoogleGenerativeAI(aiApiKey);
            const model = genAI.getGenerativeModel({ model: aiModelName || "gemini-pro" });

            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemMessage }] },
                    { role: "model", parts: [{ text: "Ok, I understand my role. I will act as a helpful assistant." }] },
                    ...formatGoogleHistory(history)
                ],
                generationConfig: {
                    maxOutputTokens: 2048,
                },
            });

            const result = await chat.sendMessage(message);
            const response = result.response;
            aiResponse = response.text();

        } else {
            // Mantener la lógica existente para OpenAI y Ollama con LangChain
            let chatModel;
            const langchainHistory = formatLangChainHistory(history);
            const messages = [new HumanMessage(systemMessage), ...langchainHistory, new HumanMessage(message)];

            if (aiProvider === 'OPENAI') {
                if (!aiApiKey) {
                    throw new Error("OpenAI API Key is not configured for this course.");
                }
                chatModel = new ChatOpenAI({
                    apiKey: aiApiKey,
                    modelName: aiModelName || "gpt-3.5-turbo",
                });
            } else if (aiProvider === 'OLLAMA') {
                chatModel = new ChatOllama({
                    baseUrl: ollamaBaseUrl || "http://localhost:11434",
                    model: aiModelName || "llama2",
                });
            } else {
                throw new Error(`Unsupported AI provider: ${aiProvider}`);
            }

            const response = await chatModel.invoke(messages);
            aiResponse = response.content;
        }

        return aiResponse;

    } catch (error) {
        console.error(`Error getting AI response from ${aiProvider}:`, error);
        // Verificar si el error es del SDK de Google y tiene un mensaje específico
        if (error.message && error.message.includes('API key not valid')) {
             return "Error: La clave de API de Google proporcionada no es válida. Por favor, verifícala en la configuración del curso.";
        }
        // Devolver un mensaje de error genérico para el frontend
        return `Error al contactar al asistente de IA (${aiProvider}). Por favor, revisa la configuración del curso en el panel de administración. Detalles: ${error.message}`;
    }
};
