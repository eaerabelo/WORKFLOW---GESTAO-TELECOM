import OpenAI from 'openai';

/**
 * Controlador de Inteligência Artificial
 * Isola 100% da regra de negócio de IA no Backend.
 */
export const consultarIA = async (req, res) => {
    const { prompt } = req.body;

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        // Validação se a chave foi configurada no arquivo .env do Backend
        if (!apiKey || apiKey === 'SUA_CHAVE_OPENAI_AQUI') {
            return res.status(400).json({ 
                error: "Chave da API da OpenAI não encontrada no servidor. Configure a variável OPENAI_API_KEY no arquivo .env do Backend." 
            });
        }

        // Inicializa o cliente oficial da OpenAI
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: "Você é um consultor especialista em telecomunicações e smartphones. Se os aparelhos solicitados forem muito recentes e você não tiver todos os dados no seu banco, utilize as especificações vazadas, estime com base na geração anterior e no seu conhecimento sobre a marca. NUNCA recuse a resposta ou diga que não encontrou. Entregue sempre o comparativo estruturado focado em ajudar na venda." 
                },
                { role: "user", content: prompt }
            ]
        });

        res.status(200).json({ resposta: response.choices[0].message.content });
    } catch (error) {
        console.error("Erro no Controlador de IA:", error);
        res.status(500).json({ error: error.message || "Falha de comunicação interna." });
    }
};