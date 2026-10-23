const express = require('express');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = "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"; 
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Memoria volatile in RAM
const chatHistories = {};

const SYSTEM_PROMPT = `Sei il Coach Strategico e Assistente Virtuale dei Setter B2B di Artsoftware2022 (azienda fondata da Christian Sena).
Il tuo compito NON è fare recruiting, ma dare supporto costante, script, strategie e motivazione ai nostri Setter che contattano a freddo gli studi dentistici.

GESTIONE DELLE LISTE CONTATTI ED ORGANIZZAZIONE LAVORO:
1. Quando un setter chiede una lista di contatti (o chiede come riceverla/dove trovarla):
   - Rispondi chiaramente che la lista dei contatti verrà inviata direttamente via EMAIL.
   - Spiega che alla fine della giornata lavorativa è OBBLIGATORIO rispondere a quella stessa email inviando un report dettagliato con i PRO e CONTRO della giornata.
2. Gestione CRM / Zone:
   - Se ti chiedono quale CRM usiamo, chiarisci che NON usiamo un CRM strutturato, ma si lavora per ZONE e CITTÀ.

IL TUO RUOLO E OBIETTIVO PRINCIPALE:
Essere un punto di riferimento operativo per ogni setter. Aiutarli a superare obiezioni, affinare lo script delle chiamate a freddo, chiudere contratti di prova gratuita e mantenerli altamente motivati.

L'OFFERTA DI PROVA PER GLI STUDI DENTISTICI (IL NOSTRO GANCIO):
- Regaliamo UNA SETTIMANA DI PROVA GRATUITA SENZA IMPEGNO del nostro assistente AI "Vocalis" (gestione chiamate 24/7, appuntamenti in agenda, risposte WhatsApp automatiche).

LINEE GUIDA:
1. Motivazione: Sii sempre energico, positivo e incoraggiante.
2. Risposte sintetiche e pratiche: Punti elenco o frasi pronte da dire al telefono (massimo 3-5 frasi).
3. Tono: Professionale, motivante, pratico ed empatico.`;

app.post('/api/chat', async (req, res) => {
    const { sessionId = 'default_session', message } = req.body;
    if (!message) return res.status(400).json({ error: "Messaggio mancante" });

    if (!chatHistories[sessionId]) {
        chatHistories[sessionId] = [{ role: "system", content: SYSTEM_PROMPT }];
    }

    chatHistories[sessionId].push({ role: "user", content: message });

    if (chatHistories[sessionId].length > 13) {
        chatHistories[sessionId] = [
            chatHistories[sessionId][0],
            ...chatHistories[sessionId].slice(-12)
        ];
    }

    // Lista modelli di fallback (identica al tuo bot WhatsApp funzionante)
    let availableModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    try {
        const modelsList = await groq.models.list();
        if (modelsList?.data?.length > 0) {
            const activeIds = modelsList.data.map(m => m.id);
            if (activeIds.includes("llama-3.3-70b-versatile")) {
                availableModels = ["llama-3.3-70b-versatile", ...activeIds.filter(id => id !== "llama-3.3-70b-versatile")];
            } else {
                availableModels = activeIds;
            }
        }
    } catch (e) {
        // Fallback predefinito in caso di errore di connessione alla lista modelli
    }

    let reply = null;
    let lastError = null;

    for (const modelName of availableModels) {
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: chatHistories[sessionId],
                model: modelName,
                temperature: 0.6
            });
            reply = chatCompletion.choices[0]?.message?.content;
            if (reply) break;
        } catch (err) {
            lastError = err;
        }
    }

    if (!reply) {
        console.error("❌ Errore Groq API:", lastError?.message || lastError);
        return res.status(500).json({ error: lastError?.message || "Errore sconosciuto dai modelli Groq" });
    }

    chatHistories[sessionId].push({ role: "assistant", content: reply });
    res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach attivo su http://localhost:${PORT}`);
});
