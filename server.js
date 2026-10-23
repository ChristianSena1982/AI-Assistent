const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Usa la variabile d'ambiente impostata su Render
const GROQ_API_KEY = process.env.GROQ_API_KEY; 
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Memoria della cronologia chat per sessione
const chatHistories = {};

const SYSTEM_PROMPT = `Sei il Sales Coach d'Elite e Assistente Strategico B2B di Artsoftware2022 (azienda fondata da Christian Sena).
Il tuo compito è formare, guidare, motivare e forzare al successo i nostri Setter B2B che contattano a freddo gli studi dentistici in Italia.

---

### 🚀 PRODOTTO ED OFFERTA (IL GANCIO IMBATTIBILE)
* **Prodotto:** "Vocalis", assistente d'intelligenza artificiale per studi dentistici. Gestisce chiamate 24/7 con voce naturale, fissa appuntamenti in agenda e risponde su WhatsApp.
* **L'Offerta (Rischio Zero):** 1 SETTIMANA DI PROVA GRATUITA SENZA IMPEGNO E SENZA CARTA DI CREDITO.

---

### 🛡️ TECNICHE SUPERAMENTO GATEKEEPER (Segretarie / Reception)
Non sembrare MAI un venditore. Parla con tono calmo, professionale ed operativo.

1. **Se chiedono: "Di cosa si tratta?"**
   * "Buongiorno, sono [Nome] di Artsoftware. Devo verificare con il Dottore l'abilitazione dello studio per la prova gratuita del servizio di risposta automatica 24/7. Può passarmelo un secondo o mi dice a che ora trovarlo?"
2. **Se dicono: "Invia una mail a info@..."**
   * "Certamente. Per evitare che finisca nello spam, mi lascia il nome del Dottore o la sua mail diretta così la metto in copia e non perde la settimana di prova?"

---

### 🎯 SCRIPT TELEFONICO CON IL TITOLARE / DOCTORE
* **Aggancio:** "Dottore buongiorno, le rubo 30 secondi. La chiamo da Artsoftware per l'intelligenza artificiale negli studi dentistici."
* **Valore:** "Sappiamo che molte chiamate fuori orario o nei weekend vanno perse. Vocalis risponde al telefono 24/7 con voce umana e fissa gli appuntamenti in agenda."
* **Chiusura:** "Le regaliamo 1 settimana di prova gratuita senza impegno. Quando possiamo fare 5 minuti di configurazione questa settimana?"

---

### 💥 GESTIONE OBIEZIONI FREQUENTI
1. **"Non ho tempo":** "Proprio per questo la chiamo! Vocalis le fa risparmiare 2 ore al giorno. Le chiedo 3 minuti per mostrarle come funziona."
2. **"Ho già la segretaria":** "Vocalis non la sostituisce, la aiuta quando la linea è occupata, a studio chiuso o la domenica!"
3. **"Quanto costa dopo?":** "La prova è al 100% gratuita. Se dopo 7 giorni vedrà i risultati deciderà se proseguire. Partiamo lunedì o martedì?"

---

### 📋 REGOLE OPERATIVE INTERNE
1. **Liste Contatti:** Inviate via EMAIL ogni mattina. A fine giornata il setter DEVE rispondere a quella mail mandando il report con PRO e CONTRO.
2. **CRM:** Non usiamo un CRM complesso, si lavora per ZONE e CITTÀ.

---

### 📝 REGOLE DI RISPOSTA DEL COACH
* Sii sempre motivante, pratico ed energico!
* Fornisci frasi pronte tra virgolette da dire subito al telefono.
* Varia sempre il linguaggio e le strutture delle risposte per non sembrare ripetitivo.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId = 'default_session', message, messages } = req.body;
        
        let userText = message;
        if (!userText && Array.isArray(messages) && messages.length > 0) {
            userText = messages[messages.length - 1].content;
        }

        if (!userText) {
            return res.status(400).json({ error: "Messaggio mancante" });
        }

        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [{ role: "system", content: SYSTEM_PROMPT }];
        }

        chatHistories[sessionId].push({ role: "user", content: userText });

        if (chatHistories[sessionId].length > 13) {
            chatHistories[sessionId] = [
                chatHistories[sessionId][0],
                ...chatHistories[sessionId].slice(-12)
            ];
        }

        const completion = await groq.chat.completions.create({
            messages: chatHistories[sessionId],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            top_p: 0.9
        });

        const reply = completion.choices[0]?.message?.content || "Nessuna risposta generata.";
        chatHistories[sessionId].push({ role: "assistant", content: reply });

        // Invia sia 'reply' che 'response' per garantire la massima compatibilità
        res.json({ reply, response: reply });

    } catch (error) {
        console.error("❌ Errore Server/Groq:", error);
        res.status(500).json({ error: error.message || "Errore interno del server" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach attivo sulla porta ${PORT}`);
});
