# World Cup 2026 Scenario Engine

World Cup 2026 Scenario Engine e un simulatore interattivo della FIFA World Cup
2026.

Genera una possibile storia completa del torneo, dalla fase a gironi fino alla
finale mondiale, rispettando la struttura prevista per il formato a 48 squadre:

- 12 gruppi da quattro nazionali;
- qualificazione delle prime due classificate;
- qualificazione delle otto migliori terze;
- Round of 32;
- ottavi di finale;
- quarti di finale;
- semifinali;
- finale per il terzo posto;
- finale mondiale.

## Obiettivo

L'obiettivo del progetto e rappresentare in modo realistico i diversi scenari
che potrebbero verificarsi durante il Mondiale 2026.

Il simulatore non cerca di stabilire con certezza chi vincera il torneo. Ogni
simulazione rappresenta invece uno dei numerosi futuri possibili: le nazionali
piu forti hanno maggiori probabilita di avanzare, ma restano possibili pareggi,
sorprese, eliminazioni inattese e risultati con molti gol.

## Cosa permette di fare

La webapp consente di:

- consultare le probabilita pre-torneo di tutte le 48 nazionali;
- visualizzare le probabilita di concludere il girone al primo, secondo, terzo
  o quarto posto;
- conoscere le possibilita di raggiungere ogni fase del torneo;
- generare una nuova simulazione completa delle 104 partite;
- seguire le classifiche dei gironi e le migliori terze qualificate;
- esplorare il tabellone ufficiale fino alla finale;
- visualizzare risultati, probabilita ed expected goals di ogni partita;
- ripetere uno scenario attraverso una seed;
- utilizzare l'interfaccia in italiano o inglese.

## Da dove provengono le previsioni

Il simulatore nasce da una pipeline di analisi e previsione calcistica costruita
utilizzando dati storici e informazioni aggregate sulle nazionali.

Il sistema considera diversi aspetti della forza di una squadra, tra cui:

- risultati internazionali recenti;
- rendimento offensivo e difensivo;
- forma nelle ultime partite;
- ranking FIFA;
- rating Elo;
- forza e valore complessivo della rosa;
- esperienza internazionale dei giocatori;
- rendimento nelle principali competizioni;
- qualita dei reparti e della formazione disponibile;
- livello medio degli avversari affrontati;
- esperienza nelle partite a eliminazione diretta;
- rendimento ai calci di rigore;
- caratteristiche della partita, del calendario e del campo neutro.

Queste informazioni vengono elaborate da un insieme di modelli statistici e di
machine learning. Il risultato e una stima dei gol attesi e delle probabilita
di vittoria, pareggio e sconfitta per ogni possibile incontro del torneo.

Le distribuzioni dei risultati vengono successivamente calibrate per produrre
punteggi realistici, includendo sia risultati frequenti come 1-0, 1-1 e 2-0,
sia eventi meno comuni come 0-0, 3-1, 4-0 o partite con molti gol.

## Architettura del modello

La previsione non dipende da un singolo algoritmo. Viene utilizzato un ensemble
di tre famiglie di modelli, addestrate separatamente per stimare i gol attesi
delle due squadre:

| Modello | Ruolo | Peso corrente |
| --- | --- | ---: |
| Ridge con trasformazione logaritmica | Produce una stima regolarizzata e stabile dei gol | 37,50% |
| Regressione di Poisson | Modella direttamente eventi di conteggio come i gol | 31,25% |
| Histogram Gradient Boosting con loss Poisson | Cattura relazioni non lineari e interazioni tra le caratteristiche | 31,25% |

I pesi non indicano la probabilita che un modello sia corretto. Servono a
combinare le tre stime dei gol attesi. La configurazione viene selezionata
confrontando le alternative sui dati di validazione, considerando sia il
rendimento complessivo sia le partite tra nazionali di alto livello.

Il modello LightGBM e stato considerato tra i possibili candidati della
pipeline, ma non fa parte dell'ensemble attualmente utilizzato per le
probabilita pubblicate.

## Forma e forza delle nazionali

La forma recente usa una struttura a due livelli:

- le ultime 20 partite costituiscono la base piu stabile;
- le ultime 5 partite rappresentano la componente di momentum recente.

Questo evita che una singola vittoria o sconfitta modifichi eccessivamente la
valutazione, senza ignorare i cambiamenti piu recenti.

Le caratteristiche vengono inoltre sintetizzate in indicatori di forza
relativa. La previsione considera le differenze tra le due nazionali, non
soltanto i loro valori assoluti.

Per le partite in campo neutro la previsione viene calcolata anche invertendo
l'ordine delle squadre. Le due stime vengono poi rese simmetriche, riducendo
eventuali vantaggi artificiali causati dalla posizione di squadra A o squadra
B nei dati.

## Calibrazione dei risultati

Una volta ottenuti i gol attesi, il sistema costruisce una distribuzione completa
dei possibili punteggi da 0-0 fino a 10-10.

La configurazione corrente utilizza:

| Parametro | Valore | Significato |
| --- | ---: | --- |
| Distribuzione dei gol | Negative Binomial | Consente maggiore variabilita rispetto a una Poisson pura |
| Dispersione | 50 | Introduce una moderata volatilita aggiuntiva nei punteggi |
| Dixon-Coles `rho` | -0,10 | Corregge la frequenza dei risultati con pochi gol |
| Temperatura di calibrazione | 1,00 | Mantiene la distribuzione senza ulteriore compressione o amplificazione |

La Negative Binomial permette di conservare i risultati piu frequenti, ma
assegna anche probabilita credibili a 0-0, 3-1, 4-0 e ad altre partite meno
ordinarie.

La correzione Dixon-Coles interviene soprattutto su 0-0, 1-0, 0-1 e 1-1, che
nel calcio non sono sempre rappresentati correttamente assumendo che i gol
delle due squadre siano completamente indipendenti.

## Correzioni per partite particolari

Il modello applica controlli aggiuntivi in due situazioni:

- incontri tra nazionali considerate di livello elevato;
- incontri con un divario di forza particolarmente ampio.

Per entrambe le categorie viene usato un blend del 25% tra la stima prodotta
dai modelli e un indicatore indipendente di forza relativa. Nelle partite con
grande divario, la scala della correzione e pari a 1,25.

Questi aggiustamenti servono a ridurre due possibili distorsioni:

- una favorita troppo dominante soltanto per effetto di ranking o rating;
- una nazionale nettamente inferiore trattata come quasi equivalente alla
  favorita.

La correzione modifica soprattutto la ripartizione dei gol attesi tra le due
squadre, mantenendo sotto controllo il numero totale di gol previsto.

## Le 100.000 simulazioni Monte Carlo

Il torneo e stato simulato 100.000 volte per costruire le probabilita mostrate
nella webapp.

In ogni esecuzione vengono simulate:

1. tutte le partite della fase a gironi;
2. le classifiche finali dei 12 gruppi;
3. la selezione delle otto migliori terze;
4. la composizione del Round of 32;
5. tutte le partite a eliminazione diretta;
6. la finale per il terzo posto;
7. la finale mondiale.

I risultati delle 100.000 simulazioni permettono di calcolare, per ogni
nazionale:

- probabilita di terminare il girone in ciascuna posizione;
- probabilita di qualificarsi al Round of 32;
- probabilita di raggiungere ottavi, quarti e semifinali;
- probabilita di raggiungere la finale;
- probabilita di vincere il Mondiale.

Queste percentuali rappresentano la valutazione complessiva del torneo e
vengono mostrate prima di avviare una nuova simulazione.

Le emulazioni non utilizzano soltanto la probabilita di diventare campione.
Per costruire una misura piu stabile del percorso complessivo vengono
considerate diverse probabilita, con i seguenti pesi:

| Indicatore Monte Carlo | Peso nel prior |
| --- | ---: |
| Vittoria del Mondiale | 36% |
| Raggiungimento della finale | 22% |
| Raggiungimento della semifinale | 17% |
| Raggiungimento dei quarti | 13% |
| Raggiungimento degli ottavi | 8% |
| Qualificazione al Round of 32 | 4% |

Le probabilita vengono trasformate e standardizzate prima di essere combinate.
In questo modo il prior non dipende soltanto dalla probabilita finale di
vittoria, che per molte nazionali e necessariamente molto bassa.

## Come viene generata una singola simulazione

Quando viene premuto il pulsante di simulazione, non viene scelto un torneo gia
esistente tra i 100.000 precedenti.

Viene invece generata una nuova storia, partita dopo partita.

Per ogni incontro:

1. vengono recuperate le probabilita calibrate delle due nazionali;
2. il risultato viene estratto dalla distribuzione dei possibili punteggi;
3. vengono aggiornati punti, gol fatti e gol subiti;
4. le squadre vengono ordinate nella classifica del girone;
5. vengono determinate le qualificate e le migliori terze;
6. il tabellone viene composto secondo le regole previste;
7. le partite a eliminazione diretta vengono simulate fino alla finale;
8. in caso di pareggio viene simulato anche l'esito dei calci di rigore.

Le probabilita ottenute dalle 100.000 simulazioni vengono utilizzate come
indicazione moderata della forza complessiva delle nazionali, con un peso del
20% nella singola simulazione.

Il restante comportamento deriva dalla distribuzione calibrata del singolo
incontro. Il 20% non significa che il risultato sia deciso per un quinto in
anticipo: modifica in modo moderato la distribuzione dei possibili punteggi,
favorendo la direzione coerente con il percorso osservato nelle 100.000
emulazioni.

In questo modo ogni nuova simulazione rimane casuale, ma continua a riflettere
le differenze stimate tra le squadre. Una sorpresa resta possibile, mentre una
sequenza molto improbabile di sorprese diventa meno frequente.

Per il torneo vengono utilizzate 1.200 distribuzioni:

- 72 distribuzioni per le partite gia definite della fase a gironi;
- 1.128 distribuzioni per tutti i possibili accoppiamenti tra le 48 nazionali.

Ogni distribuzione contiene la probabilita di tutti i punteggi considerati,
non soltanto la probabilita 1X2 o il risultato piu probabile.

Inserendo una seed e possibile riprodurre nuovamente lo stesso scenario.

## Classifiche, migliori terze e rigori

Durante la fase a gironi vengono aggiornati punti, gol fatti, gol subiti e
differenza reti. Le classifiche vengono ordinate usando:

1. punti;
2. differenza reti;
3. gol segnati;
4. un tie-break casuale finale quando i valori disponibili sono identici.

Le terze classificate vengono confrontate con gli stessi indicatori e le prime
otto accedono al Round of 32. Successivamente vengono assegnate agli slot
compatibili del tabellone.

In una partita a eliminazione diretta, un pareggio nei tempi regolamentari porta
alla simulazione dei rigori. La probabilita non e sempre 50-50: considera
indicatori come rendimento storico nelle serie, qualita dei rigoristi, rating
del portiere, forza complessiva ed equilibrio previsto della partita.

## Come interpretare i risultati

Una probabilita elevata non garantisce che una squadra vincera, cosi come una
probabilita bassa non rende impossibile una sorpresa.

Ad esempio, una nazionale con il 15% di probabilita di vincere il torneo rimane
la favorita rispetto a molte avversarie, ma nella maggior parte delle
simulazioni non diventera campione.

La singola simulazione deve quindi essere letta come una possibile narrazione
del Mondiale, mentre le percentuali aggregate descrivono la tendenza generale
del modello.

## Aggiornamento delle previsioni

Le probabilita possono cambiare quando vengono aggiornati:

- risultati internazionali;
- ranking FIFA ed Elo;
- forma recente;
- convocazioni e rose;
- infortuni e squalifiche;
- calendario e composizione definitiva dei gruppi.

Il progetto ha finalita informative, sperimentali e di intrattenimento. Non e
destinato a scommesse o decisioni finanziarie.

---

## English Summary

World Cup 2026 Scenario Engine is an interactive simulator that generates a
complete possible story of the 2026 FIFA World Cup, from the group stage to the
final.

The underlying predictions are derived from historical international results,
FIFA and Elo ratings, recent form, squad strength, tournament experience and
other aggregated team indicators. Calibrated score distributions are then used
to simulate each match.

The current ensemble combines a log-transformed Ridge model (37.5%), a Poisson
regression model (31.25%) and a Poisson Histogram Gradient Boosting model
(31.25%). Expected goals are converted into score probabilities using a
Negative Binomial distribution with moderate dispersion and a Dixon-Coles
low-score correction.

The tournament was simulated 100,000 times to estimate every team's probability
of finishing in each group position, reaching each knockout round and winning
the World Cup.

Each simulation launched by the user is a newly generated scenario. Match
scores are sampled one by one, standings are updated, the best third-placed
teams are selected and the official knockout bracket is played through to the
final.

The aggregate Monte Carlo path is applied as a moderate 20% prior in each new
scenario. This keeps the simulation connected to the estimated strength of the
teams without eliminating upsets or unexpected tournament runs.

The results represent possible outcomes rather than certain predictions. The
project is intended for information, experimentation and entertainment.
