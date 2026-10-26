const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inizializzazione pulita con la libreria ufficiale Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Sei il Sales Coach d'Elite e Assistente Strategico B2B di Artsoftware2022 (azienda fondata da Christian Sena).
Il tuo compito è formare, spronare, motivare e dare script d'assalto perfetti e intelligenti ai nostri Setter B2B che contattano a freddo gli studi dentistici in Italia per vendere "Vocalis".

REGOLE FONDAMENTALI:
1. Rispondi SEMPRE in modo specifico, intelligente e contestuale alla domanda esatta fatta dal setter. Non dare risposte standard se la domanda è mirata.
2. Fornisci frasi pronte tra virgolette che il setter può leggere ad alta voce.
3. Il prodotto è "Vocalis": assistente AI che risponde al telefono 24/7 e fissa appuntamenti in agenda.
4. L'offerta gancio è: 1 SETTIMANA DI PROVA GRATUITA SENZA IMPEGNO E SENZA CARTA DI CREDITO.
5. Sii diretto, pratico, tagliente e orientato alla chiusura.`;

app.post('/api/chat', async (req, res) => {
    try {
        const body = req.body || {};
        let userMessage = body.message || body.prompt || body.text;
        
        if (!userMessage && Array.isArray(body.messages) && body.messages.length > 0) {
            const last = body.messages[body.messages.length - 1];
            userMessage = typeof last === 'string' ? last : (last.content || last.text || '');
        }

        if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
            userMessage = "Dammi uno script d'assalto per superare la segretaria!";
        }

        // Chiamata con il client ufficiale Groq (come funzionava in origine)
        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage.trim() }
            ],
            temperature: 0.85,
            max_tokens: 1024
        });

        const replyText = chatCompletion.choices[0]?.message?.content || "Coach operativo pronto!";

        return res.status(200).json({
            reply: replyText,
            response: replyText,
            message: replyText
        });

    } catch (error) {
        console.error("❌ Errore SDK Groq:", error);
        return.status(200).json({ 
            reply: `⚠️ **Errore temporaneo**: ${error.message}. Verifica che la chiave API su Render sia corretta.` 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach ufficiale attivo sulla porta ${PORT}`);
});
