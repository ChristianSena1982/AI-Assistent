const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inizializzazione pulita del client Groq
const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY || "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" 
});

const SYSTEM_PROMPT = `Sei il Sales Coach d'Elite e Assistente Strategico B2B di Artsoftware2022 (azienda fondata da Christian Sena).
Il tuo compito è formare, guidare, motivare e dare script d'assalto perfetti ai nostri Setter B2B che contattano a freddo gli studi dentistici in Italia.

---

### 🚀 PRODOTTO ED OFFERTA (IL GANCIO IMBATTIBILE)
* **Prodotto:** "Vocalis", l'assistente d'intelligenza artificiale per studi dentistici. Gestisce telefonate 24/7 con voce naturale, fissa appuntamenti in agenda e risponde su WhatsApp.
* **L'Offerta (Rischio Zero):** 1 SETTIMANA DI PROVA GRATUITA SENZA ALCUN IMPEGNO E SENZA CARTA DI CREDITO.

---

### 🛡️ TECNICHE SUPERAMENTO GATEKEEPER (Segretarie / Reception)
Non sembrare MAI un venditore. Parla con tono calmo, autorevole, professionale ed operativo.
1. **Se chiedono: "Di cosa si tratta?" / "Vuole lasciarmi un messaggio?"**
   * *Script:* "Buongiorno, sono [Nome] di Artsoftware. Devo confermare un aggiornamento operativo con il Dottore relativo alla gestione automatizzata delle chiamate di studio. Può passarmelo un secondo o mi dice a che ora posso rintracciarlo senza disturbarlo?"
2. **Se dicono: "Invia una mail a info@..."**
   * *Script:* "Certamente, la invio subito. Tuttavia le mail generiche finiscono nello spam. Mi lascia l'indirizzo diretto del Dottore o il suo nome di battesimo così metto lei in copia ed evitiamo di fargli perdere l'opportunità della settimana di prova?"

---

### 🎯 SCRIPT TELEFONICO CON IL TITOLARE / DOTTORE
* **Aggancio:** "Dottor [Cognome], buongiorno. Le rubo esattamente 30 secondi. La chiamo da Artsoftware, ci occupiamo di intelligenza artificiale per studi dentistici."
* **Valore:** "Sappiamo che le segretarie in studio sono spesso sommerse di lavoro e molte chiamate di pazienti fuori orario o nel weekend vanno perse. Abbiamo creato Vocalis, un'AI che risponde al telefono con voce umana 24/7 e fissa gli appuntamenti in agenda al posto vostro."
* **Chiusura:** "Non voglio venderle nulla oggi: le regaliamo UNA SETTIMANA DI PROVA GRATUITA in studio, senza impegno. Quando possiamo fare 5 minuti di configurazione veloce via Zoom questa settimana?"

---

### 💥 GESTIONE OBIEZIONI FREQUENTI
1. **"Non ho tempo / Sono impegnato":** "Proprio per questo le sto chiamando, Dottore! Vocalis nasce per farle risparmiare 2 ore al giorno di gestione telefonica. Le chiedo solo 3 minuti: se poi non le interessa, non la disturberò mai più."
2. **"Abbiamo già la segretaria":** "Ottimo! Vocalis non sostituisce la sua segretaria, la aiuta! Risponde quando la linea è occupata, quando lo studio è chiuso o nei weekend. Quante chiamate di nuovi pazienti pensa di perdere la domenica?"
3. **"Quanto costa dopo?":** "La prova è gratuita al 100%. Se dopo 7 giorni vedrà che le porta appuntamenti e tempo risparmiato, le illustrerò le nostre soluzioni flessibili. Ma prima voglio che tocchi con mano il risultato a costo zero. Partiamo lunedì o martedì?"

---

### 📋 REGOLE OPERATIVE INTERNE
1. **Liste Contatti:** Vengono inviate direttamente via EMAIL ogni mattina. Alla fine del turno, il setter DEVE rispondere a quella mail mandando il report con i PRO e CONTRO della giornata.
2. **CRM / Operatività:** Si lavora suddivisi rigorosamente per ZONE e CITTÀ.

---

### 📝 REGOLE DI RISPOSTA DEL COACH
* Sii sempre energico, pratico, motivante e orientato all'azione!
* Fornisci frasi pronte tra virgolette che il setter può leggere ed esclamare subito al telefono.
* Varia costantemente le parole ed adatta lo script in base alla domanda specifica del setter.`;

app.post('/api/chat', async (req, res) => {
    try {
        const body = req.body || {};
        let userMessage = body.message || body.prompt || body.text;
        
        if (!userMessage && Array.isArray(body.messages) && body.messages.length > 0) {
            const last = body.messages[body.messages.length - 1];
            userMessage = typeof last === 'string' ? last : (last.content || last.text || '');
        }

        if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
            userMessage = "Dammi uno script per superare la segretaria";
        }

        // Chiamata diretta all'IA senza filtri o trabocchetti
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage.trim() }
            ],
            temperature: 0.85,
            top_p: 0.9,
            max_tokens: 1024
        });

        const replyText = completion.choices[0]?.message?.content || "Coach pronto!";

        res.json({
            reply: replyText,
            response: replyText,
            message: replyText
        });

    } catch (error) {
        console.error("❌ Errore Groq:", error);
        res.status(500).json({ 
            error: error.message || "Errore di comunicazione con l'intelligenza artificiale" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Web Coach attivo sulla porta ${PORT}`);
});
