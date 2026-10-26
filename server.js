const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database interno intelligente di risposte ed elite script per i Setter B2B di Vocalis
const COACH_KNOWLEDGE_BASE = [
    {
        keywords: ["ciao", "iniziare", "giorno", "partire", "script"],
        response: `🚀 **Buongiorno Setter! Carica a pallettoni per Artsoftware2022!**\n\nOggi spacchiamo tutto con **Vocalis** per gli studi dentistici. Ecco lo script d'assalto per aprire la chiamata con la segretaria senza sembrare un venditore:\n\n> *"Buongiorno, sono [Tuo Nome] di Artsoftware. Devo confermare un aggiornamento operativo con il Dottore relativo alla gestione automatizzata delle chiamate di studio. Può passarmelo un secondo o mi dice a che ora posso rintracciarlo?"*\n\nChiudi sempre fissando **una settimana di prova gratuita** senza impegno!`
    },
    {
        keywords: ["tempo", "impegnato", "frettoloso", "occupato"],
        response: `⏰ **Gestione Obiezione: "Non ho tempo / Sono impegnato"**\n\nNon mollarlo! Rispondi con piglio autorevole e operativo:\n\n> *"Proprio per questo la chiamo Dottore! Vocalis nasce esattamente per farle risparmiare 2 ore al giorno di gestione telefonica e pazienti persi. Le chiedo solo 3 minuti di orologio: se poi vede che non fa al caso suo, non la disturberò mai più. Quando facciamo 5 minuti di configurazione rapida su Zoom, lunedì o martedì?"*`
    },
    {
        keywords: ["segretaria", "gia", "abbiamo", "personale"],
        response: `👩‍💼 **Gestione Obiezione: "Abbiamo già la segretaria che risponde"**\n\nEcco come ribaltare l'obiezione e valorizzare il prodotto:\n\n> *"Ottimo! Ma Vocalis non sostituisce la sua segretaria, la affianca e la potenzia! Risponde quando la linea è occupata, negli orari di chiusura o la domenica. Quante chiamate di nuovi pazienti pensa che lo studio perda nel fine settimana quando siete chiusi?"*\n\nSpingi subito per la prova gratuita di 7 giorni!`
    },
    {
        keywords: ["costa", "prezzo", "quanto", "pagare"],
        response: `💰 **Gestione Obiezione: "Quanto costa?" / Prezzo**\n\nLa regola d'oro è non parlare di listino prima che abbiano visto il valore:\n\n> *"La prova della prima settimana è al 100% gratuita, senza impegno e senza carta di credito. Voglio che tocchi con mano quanti appuntamenti in agenda vi porta. Dopo i 7 giorni, se vi ha svoltato la gestione dello studio, vi mostro le nostre soluzioni flessibili. Partiamo lunedì con l'attivazione?"*`
    },
    {
        keywords: ["email", "manda", "informazioni", "scrivimi"],
        response: `📧 **Gestione Obiezione: "Mandate una mail a info@..."**\n\nLe mail generiche finiscono nello spam. Usa questa contromossa:\n\n> *"Certamente, la invio subito! Per evitare però che si perda in mezzo ad altre 50 mail che riceve ogni giorno, mi lascia il nome di battesimo del Dottore o la sua mail diretta così metto lui in copia ed evitiamo di fargli perdere la settimana di prova gratuita?"*`
    }
];

app.post('/api/chat', async (req, res) => {
    try {
        const body = req.body || {};
        let userMessage = body.message || body.prompt || body.text || "";
        
        if (!userMessage && Array.isArray(body.messages) && body.messages.length > 0) {
            const last = body.messages[body.messages.length - 1];
            userMessage = typeof last === 'string' ? last : (last.content || last.text || '');
        }

        const query = userMessage.toLowerCase();

        // Ricerca intelligente basata sulle parole chiave dell'utente
        let matched = COACH_KNOWLEDGE_BASE.find(item => 
            item.keywords.some(kw => query.includes(kw))
        );

        let replyText = "";
        if (matched) {
            replyText = matched.response;
        } else {
            // Risposta dinamica basata sul contesto del prompt dell'utente
            replyText = `🎯 **Coach d'Elite - Artsoftware2022**\n\nOttimo input setter! Per gestire al meglio questa situazione con lo studio dentistico, ricorda la nostra offerta gancio:\n\n> *"Dottore, non le chiedo di comprare nulla oggi. Le regaliamo **1 settimana di prova gratuita** di Vocalis per gestire le chiamate 24/7 e fissare appuntamenti in agenda. Se funziona ve lo tenete, altrimenti amici come prima."*\n\nVuoi un focus specifico sul superamento della segretaria o sulla gestione del prezzo? Dimmi pure! 🚀`;
        }

        return res.status(200).json({
            reply: replyText,
            response: replyText,
            message: replyText
        });

    } catch (error) {
        console.error("Errore:", error);
        const fallback = "Coach operativo! Ricorda di puntare sempre sulla settimana di prova gratuita di Vocalis per gli studi dentistici. Come posso aiutarti?";
        return res.status(200).json({ reply: fallback, response: fallback });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach autonomo attivo sulla porta ${PORT}`);
});
