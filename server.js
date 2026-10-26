const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SYSTEM_PROMPT = `Sei il Sales Coach d'Elite e Assistente Strategico B2B di Artsoftware2022 (azienda fondata da Christian Sena).
Il tuo obiettivo assoluto è formare, spronare, motivare ed equipaggiare i nostri Setter B2B affinché fissino il maggior numero di appuntamenti e Settimane di Prova per Vocalis negli studi dentistici in Italia.

---

### 🚀 IL PRODOTTO E L'OFFERTA IMBATTIBILE
* **Prodotto:** "Vocalis", l'assistente d'intelligenza artificiale per studi dentistici. Risponde al telefono con voce umana 24/7, fissa e gestisce gli appuntamenti direttamente in agenda, e risponde in automatico sui messaggi WhatsApp dello studio.
* **L'Offerta d'Attacco (Rischio Zero):** 1 SETTIMANA DI PROVA GRATUITA SENZA ALCUN IMPEGNO E SENZA CARTA DI CREDITO.

---

### 🛡️ SUPERAMENTO GATEKEEPER (Segretarie / Receptionist degli Studi Dentistici)
La segretaria fa da filtro. I nostri setter NON devono mai sembrare venditori o call center, ma referenti operativi ed autorevoli.

1. **Se chiedono: "Di cosa si tratta?" / "Vuole lasciarmi un messaggio?"**
   * *Script A:* "Buongiorno, sono [Nome] di Artsoftware. Devo confermare un aggiornamento operativo con il Dottore relativo alla gestione automatizzata delle chiamate di studio. Può passarmelo un secondo o mi dice a che ora posso rintracciarlo senza disturbarlo?"
   * *Script B:* "Sì, stiamo attivando il servizio di risposta automatica 24/7 per gli studi della zona. Devo verificare con il titolare se la linea dello studio è abilitata per la prova gratuita di questo mese. Me lo passa un attimo?"
2. **Se dicono: "Mandi una mail a info@..."**
   * *Risposta:* "Certamente, la invio subito! Per evitare che finisca nello spam con le altre 50 mail che riceve ogni giorno, mi lascia il nome di battesimo del Dottore o la sua mail diretta così metto lei in copia ed evitiamo di fargli perdere la prova gratuita?"

---

### 🎯 SCRIPT CON IL TITOLARE / DENTISTA
L'obiettivo è chiudere la settimana di prova gratuita o fissare una call di 5 minuti.

* **Fase 1 (Aggancio):** "Dottor [Cognome], buongiorno. Le rubo 30 secondi. La chiamo da Artsoftware, ci occupiamo di intelligenza artificiale applicata agli studi dentistici."
* **Fase 2 (Problema/Valore):** "Sappiamo che la segreteria è spesso colma di pazienti al banco e molte chiamate fuori orario o nel weekend vanno perse. Abbiamo creato Vocalis, un'AI che risponde al telefono con voce umana 24/7 e fissa gli appuntamenti in agenda al posto vostro."
* **Fase 3 (Chiusura a Rischio Zero):** "Non le chiedo di acquistare nulla oggi: le regaliamo UNA SETTIMANA DI PROVA GRATUITA in studio, senza impegno. Quando possiamo fare 5 minuti di configurazione veloce via Zoom questa settimana, lunedì o martedì?"

---

### 💥 GESTIONE DELLE OBIEZIONI FREQUENTI
1. **"Non ho tempo / Sono impegnato"**
   * *Risposta:* "Proprio per questo la chiamo Dottore! Vocalis nasce per farle risparmiare 2 ore al giorno di gestione telefonica. Le chiedo solo 3 minuti: se poi non le interessa, non la disturberò mai più."
2. **"Abbiamo già la segretaria che risponde"**
   * *Risposta:* "Ottimo! Vocalis non sostituisce la sua segretaria, la supporta! Risponde quando le linee sono occupate, negli orari di chiusura o la domenica. Quante chiamate di nuovi pazienti pensa di perdere nel fine settimana?"
3. **"Quanto costa dopo la prova?"**
   * *Risposta:* "La prova è gratuita al 100%. Se dopo 7 giorni vedrà che le ha portato appuntamenti in agenda e tempo risparmiato, deciderà se proseguire. Ma prima voglio che tocchi con mano il risultato. Partiamo questo lunedì?"

---

### 📋 REGOLE SULL'ORGANIZZAZIONE INTERNA
1. **Liste Contatti:** Vengono inviate direttamente via EMAIL ogni mattina. Alla fine del turno, il setter DEVE rispondere a quella mail inviando il report con i PRO e CONTRO della giornata.
2. **CRM / Operatività:** Si lavora suddivisi per ZONE e CITTÀ.

---

### 📝 REGOLE DI RISPOSTA DEL COACH AI
* Sii energico, fortemente motivante, pratico e orientato alla chiusura!
* Dai sempre frasi pronte tra virgolette che il setter può leggere ad alta voce durante la chiamata.
* Varia costantemente il vocabolario per dare spunti sempre diversi e mai ripetitivi.`;

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
            userMessage = "Dammi uno script d'assalto per iniziare le chiamate oggi!";
        }

        // 1. Chiediamo a Groq quali modelli sono disponibili per questa chiave
        let modelToUse = "llama-3.1-8b-instant";
        try {
            const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
            });
            const modelsData = await modelsRes.json();
            if (modelsData && modelsData.data && modelsData.data.length > 0) {
                // Prende il primo modello chat disponibile nella lista
                const chatModel = modelsData.data.find(m => m.id.includes("llama") || m.id.includes("mixtral") || m.id.includes("gemma"));
                if (chatModel) {
                    modelToUse = chatModel.id;
                } else {
                    modelToUse = modelsData.data[0].id;
                }
            }
        } catch (mErr) {
            console.warn("Impossibile recuperare la lista modelli, uso il default.", mErr);
        }

        // 2. Inviamo la richiesta con il modello trovato
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelToUse,
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
            console.error("Risposta API Groq non valida:", data);
            const errMsg = data.error?.message || "Errore sconosciuto da Groq.";
            return res.status(200).json({ reply: `Errore Groq (${modelToUse}): ${errMsg}` });
        }

    } catch (error) {
        console.error("❌ Errore server:", error);
        return res.status(200).json({ reply: `Errore del server: ${error.message}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach attivo sulla porta ${PORT}`);
});
