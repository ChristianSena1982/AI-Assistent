const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SYSTEM_PROMPT = `Sei il Sales Coach d'Elite e Assistente Strategico B2B di Artsoftware2022 (azienda fondata da Christian Sena).
Il tuo obiettivo assoluto è formare, spronare, motivare ed equipaggiare i nostri Setter B2B affinché fissino il maggior numero di appuntamenti e Settimane di Prova per Vocalis negli studi dentistici in Italia.`;

// Frasi dinamiche di riserva nel caso l'API di Groq risponda con errori di chiave o limiti
const FALLBACK_SCRIPTS = [
    `🔥 **Coach operativo (Modalità di riserva attiva)**:\n\nPer superare il filtro della segretaria con autorevolezza, usa questo script:\n\n> *"Buongiorno, sono [Nome] di Artsoftware. Devo confermare un aggiornamento operativo con il Dottore relativo alla gestione automatizzata delle chiamate di studio. Può passarmelo un secondo o mi dice a che ora posso rintracciarlo?"*\n\nSpingi sempre sulla **settimana di prova gratuita di Vocalis** senza impegno!`,
    `🚀 **Dritta del Coach per i tuoi Setter**:\n\nQuando il dentista dice *"Non ho tempo"* rispondi così:\n\n> *"Proprio per questo la chiamo Dottore! Vocalis nasce per farle risparmiare 2 ore al giorno di gestione telefonica. Le chiedo solo 3 minuti: se poi non le interessa, non la disturberò mai più."*\n\nForza e chiudi la prova gratuita!`,
    `💪 **Strategia B2B Studi Dentistici**:\n\nSe obiettano *"Abbiamo già la segretaria"*, ribatti subito:\n\n> *"Ottimo! Vocalis non sostituisce la sua segretaria, la supporta! Risponde quando le linee sono occupate, negli orari di chiusura o la domenica. Quante chiamate di nuovi pazienti perde nel fine settimana?"*\n\nFissa la configurazione su Zoom!`
];

app.post('/api/chat', async (req, res) => {
    try {
        if (!GROQ_API_KEY) {
            return res.status(200).json({ reply: "⚠️ ERRORE: Manca la GROQ_API_KEY nelle variabili d'ambiente di Render (Settings -> Environment)." });
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

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage.trim() }
                ],
                temperature: 0.85,
                max_tokens: 800
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
            console.error("❌ Errore restituito da Groq:", JSON.stringify(data));
            const errorReason = data.error?.message || "Errore sconosciuto";
            // Prende un fallback diverso in base al testo dell'utente per non sembrare ripetitivo
            const randomFallback = FALLBACK_SCRIPTS[Math.floor(Math.random() * FALLBACK_SCRIPTS.length)];
            return res.status(200).json({ 
                reply: `⚠️ **Nota sull'API di Groq**: ${errorReason}\n\nNel frattempo, ecco uno script pronto per i tuoi setter:\n\n${randomFallback}` 
            });
        }

    } catch (error) {
        console.error("❌ Errore critico server:", error);
        const randomFallback = FALLBACK_SCRIPTS[Math.floor(Math.random() * FALLBACK_SCRIPTS.length)];
        return res.status(200).json({ reply: randomFallback });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach attivo sulla porta ${PORT}`);
});
