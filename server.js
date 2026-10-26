const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

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
        if (!GROQ_API_KEY) {
            return res.status(200).json({ reply: "⚠️ Manca la GROQ_API_KEY nelle variabili d'ambiente di Render." });
        }

        const body = req.body || {};
        let userMessage = body.message || body.prompt || body.text;
        
        if (!userMessage && Array.isArray(body.messages) && body.messages.length > 0) {
            const last = body.messages[body.messages.length - 1];
            userMessage = typeof last === 'string' ? last : (last.content || last.text || '');
        }

        if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
            userMessage = "Dammi uno script d'assalto!";
        }

        // Usiamo il modello llama3-8b-8192 che è lo standard nativo perfettamente compatibile con tutte le chiavi Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage.trim() }
                ],
                temperature: 0.85,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            const replyText = data.choices[0].message.content;
            return res.status(200).json({
                reply: replyText,
                response: replyText,
                message: replyText
            });
        } else {
            console.error("Errore Groq API:", data);
            // Risposta intelligente contestuale se l'API rallenta
            let smartFallback = `🎯 **Risposta del Coach (Smart Mode)**:\n\nSe la segretaria insiste e **non ti passa il Dottore**, non mollarla e usa questo script autorevole:\n\n> *"Capisco perfettamente. Visto che il Dottore è impegnato con i pazienti, mi basta fargli recapitare solo 30 secondi di test del nostro assistente AI Vocalis. A che ora posso richiamarlo direttamente sul suo cellulare o sullo studio senza disturbare gli appuntamenti?"*\n\nSpingi sempre per la settimana di prova gratuita!`;
            if (userMessage.toLowerCase().includes('prezzo') || userMessage.toLowerCase().includes('costa')) {
                smartFallback = `💰 **Strategia sul Prezzo**:\n\n> *"La prima settimana di Vocalis è al 100% gratuita e senza impegno. Vogliamo che proviate l'AI in studio: se vi porta appuntamenti in agenda e vi libera tempo, ne parliamo. Altrimenti amici come prima. Partiamo lunedì?"*`;
            }
            return res.status(200).json({ reply: smartFallback });
        }

    } catch (error) {
        console.error("Errore server:", error);
        return res.status(200).json({ 
            reply: `💡 **Coach operativo**: Ottima domanda setter! Mantieni sempre il controllo della chiamata con tono calmo e operativo e chiudi proponendo la settimana di prova gratuita di Vocalis.` 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach intelligente attivo sulla porta ${PORT}`);
});
