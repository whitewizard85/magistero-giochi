/* =========================================================
   I Quattro Venti di Yggdrasil — motore condiviso
   Salvataggi in localStorage con prefisso "yg_".
   Via I (Norðri): chiavi "yg_n_*" (pagine N_*.html).
   Via II (Austri): chiavi "yg_e_*" (pagine E_*.html).
   Via III (Suðri): chiavi "yg_s_*" (pagine S_*.html).

   TRAPPOLE: chi cade in una trappola NON perde nulla.
   Va nella Casa di Eir (infermeria) e, appena guarito,
   torna ESATTAMENTE nella stanza in cui si trovava.
   ========================================================= */

const Y = (() => {

  /* ---------- configurazione delle vie (da modificare ogni settimana) ---------- */
  const VIE = {
    nord:  { aperta: true,  nome: 'La Via di Norðri',  vento: 'Nord',  pagina: 'N_Cancello.html', avviso: '' },
    est:   { aperta: true,  nome: 'La Via di Austri',  vento: 'Est',   pagina: 'E_Fiume.html',    avviso: '' },
    sud:   { aperta: true,  nome: 'La Via di Suðri',   vento: 'Sud',   pagina: 'S_Cenere.html',   avviso: '' },
    ovest: { aperta: false, nome: 'La Via di Vestri',  vento: 'Ovest', pagina: '',                avviso: 'Il vento dell\'Ovest dorme ancora. Si sveglierà la prossima settimana.' }
  };
  const VERSIONE = '1';

  /* ---------- stato ---------- */
  const P = 'yg_';
  const S = {
    leggi:  (k) => { try { return localStorage.getItem(P + k); } catch (e) { return null; } },
    scrivi: (k, v) => { try { localStorage.setItem(P + k, String(v)); } catch (e) {} },
    togli:  (k) => { try { localStorage.removeItem(P + k); } catch (e) {} },
    chiavi: () => { try { return Object.keys(localStorage).filter(k => k.startsWith(P)); } catch (e) { return []; } },
    azzera: () => { S.chiavi().forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); }
  };

  /* ---------- hash (cyrb53) ---------- */
  function hash(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const normalizza = (s) => (s || '').toString().trim().toUpperCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '');
  const verifica = (risposta, h) => hash('yg|' + normalizza(risposta)) === h;

  /* ---------- giocatore, codici ---------- */
  const nome = () => (S.leggi('nome') || '').trim() || 'Viandante';
  const casa = () => (S.leggi('casa') || '').trim() || '—';
  const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function codice(gioco) {
    const base = hash('codice|' + normalizza(nome()) + '|' + gioco, 7);
    let n = parseInt(base.slice(-9), 36), out = '';
    for (let i = 0; i < 8; i++) { out += ALFA[n % 32]; n = Math.floor(n / 32) + i * 7 + 3; }
    return out.slice(0, 4) + '-' + out.slice(4);
  }

  /* ---------- dati delle vie ----------
     Ogni via ha le sue pagine (prefisso), i suoi giochi e il suo prefisso di salvataggio. */
  const DATI = {
    n: {
      nome: 'La Via di Norðri', prima: 'N_Cancello.html', infermeria: 'N_Infermeria.html',
      giochi: {
        canto:    { nome: 'Il canto dello scaldo',   stanza: 'Il Cancello di Brina',       runa: 'ᚾ', lettera: 'N' },
        lago:     { nome: 'Il lago che non perdona', stanza: 'Il Lago Ghiacciato',         runa: 'ᛖ', lettera: 'E' },
        norne:    { nome: 'La ruota delle Norne',    stanza: 'La Capanna della Völva',     runa: 'ᛒ', lettera: 'B' },
        telaio:   { nome: 'Il telaio della völva',   stanza: 'La Stanza del Telaio',       runa: 'ᛒ', lettera: 'B' },
        tafl:     { nome: 'La partita col draugr',   stanza: 'La Camera del Tumulo',       runa: 'ᛁ', lettera: 'I' },
        gleipnir: { nome: 'Il laccio impossibile',   stanza: 'La Fucina dei Nani',         runa: 'ᚨ', lettera: 'A' }
      },
      ordine: ['canto', 'lago', 'norne', 'telaio', 'tafl', 'gleipnir'],
      oggetti: {
        ago:      'l\'ago di ferro freddo',
        tizzone:  'un tizzone che non si spegne',
        mantello: 'il mantello di vaðmál',
        chiave:   'la chiave d\'osso del tumulo',
        gleipnir: 'Gleipnir, il laccio dei nani',
        lanterna: 'la lanterna dei nani'
      },
      ordineOgg: ['ago', 'tizzone', 'mantello', 'lanterna', 'chiave', 'gleipnir']
    },
    e: {
      nome: 'La Via di Austri', prima: 'E_Fiume.html', infermeria: 'E_Infermeria.html',
      giochi: {
        ponti:   { nome: 'I sassi dell\'Ífingr',      stanza: 'Il Fiume Ífingr',            runa: 'ᚨ', lettera: 'A' },
        logi:    { nome: 'Il banchetto di Logi',      stanza: 'La Sala del Banchetto',      runa: 'ᚢ', lettera: 'U' },
        hugi:    { nome: 'La corsa contro Hugi',      stanza: 'La Pista di Hugi',           runa: 'ᚱ', lettera: 'R' },
        corno:   { nome: 'Il corno senza fondo',      stanza: 'La Sala del Corno',          runa: 'ᛟ', lettera: 'O' },
        gatto:   { nome: 'Il gatto grigio',           stanza: 'La Stanza del Gatto',        runa: 'ᚱ', lettera: 'R' },
        inganno: { nome: 'L\'inganno del re',         stanza: 'Il Trono di Útgarða-Loki',   runa: 'ᚨ', lettera: 'A' }
      },
      ordine: ['ponti', 'logi', 'hugi', 'corno', 'gatto', 'inganno'],
      oggetti: {},
      ordineOgg: []
    },
    s: {
      nome: 'La Via di Suðri', prima: 'S_Cenere.html', infermeria: 'S_Infermeria.html',
      giochi: {
        cenere:   { nome: 'Il campo di braci',        stanza: 'La Piana di Cenere',         runa: 'ᚠ', lettera: 'F' },
        mantice:  { nome: 'Il mantice e la mosca',    stanza: 'La Fucina del Mantice',      runa: 'ᛁ', lettera: 'I' },
        draupnir: { nome: 'Le notti di Draupnir',     stanza: 'La Stanza dell\'Anello',      runa: 'ᚨ', lettera: 'A' },
        torce:    { nome: 'Le torce della miniera',   stanza: 'La Galleria Buia',           runa: 'ᛗ', lettera: 'M' },
        braci:    { nome: 'L\'ultima brace',           stanza: 'Il Braciere',                runa: 'ᛗ', lettera: 'M' },
        giudizio: { nome: 'Il giudizio degli dèi',    stanza: 'La Sala del Giudizio',       runa: 'ᚨ', lettera: 'A' }
      },
      ordine: ['cenere', 'mantice', 'draupnir', 'torce', 'braci', 'giudizio'],
      oggetti: {},
      ordineOgg: []
    }
  };
  const VIA_DI_GIOCO = {};
  Object.entries(DATI).forEach(([v, d]) => Object.keys(d.giochi).forEach(g => VIA_DI_GIOCO[g] = v));
  const via = () => /^E_/.test(pagina()) ? 'e' : /^S_/.test(pagina()) ? 's' : 'n';
  const D = () => DATI[via()];
  const giocoDi = (g) => DATI[VIA_DI_GIOCO[g]].giochi[g];

  const risolto = (g) => S.leggi(VIA_DI_GIOCO[g] + '_g_' + g) === '1';
  const ha = (o) => S.leggi(via() + '_o_' + o) === '1';
  const prendi = (o) => S.scrivi(via() + '_o_' + o, '1');
  const segna = (k) => S.scrivi(via() + '_' + k, '1');
  const fatto = (k) => S.leggi(via() + '_' + k) === '1';

  /* ---------- suoni (Web Audio, nessun file esterno) ---------- */
  let ctx = null;
  function suono(tipo) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const tono = (f, d, inizio = 0, forma = 'sine', vol = .12) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = forma; o.frequency.setValueAtTime(f, t + inizio);
        g.gain.setValueAtTime(0, t + inizio);
        g.gain.linearRampToValueAtTime(vol, t + inizio + .02);
        g.gain.exponentialRampToValueAtTime(.0001, t + inizio + d);
        o.connect(g).connect(ctx.destination); o.start(t + inizio); o.stop(t + inizio + d + .05);
      };
      if (tipo === 'ok')       { tono(523, .5); tono(659, .5, .12); tono(784, .9, .24); }
      if (tipo === 'premio')   { tono(392, .7, 0, 'triangle'); tono(587, 1.1, .18, 'triangle'); }
      if (tipo === 'clic')     { tono(880, .06, 0, 'square', .03); }
      if (tipo === 'no')       { tono(180, .25, 0, 'sawtooth', .06); }
      if (tipo === 'trappola') { tono(110, 1.2, 0, 'sawtooth', .14); tono(73, 1.5, .1, 'square', .08); }
    } catch (e) {}
  }

  /* ---------- navigazione ---------- */
  const pagina = () => (location.pathname.split('/').pop() || 'index.html');
  const vai = (p) => { location.href = p + '?v=' + VERSIONE + '.' + Date.now().toString(36); };

  /* ---------- popup ---------- */
  function popup(titolo, html, bottoni = [{ testo: 'Continua' }], tipo = '') {
    return new Promise((ok) => {
      const v = document.createElement('div'); v.className = 'velo';
      v.innerHTML = `<div class="finestra ${tipo}" role="dialog" aria-modal="true">
        ${titolo ? `<h3>${titolo}</h3>` : ''}<div>${html}</div><div class="scelte"></div></div>`;
      const sc = v.querySelector('.scelte');
      bottoni.forEach((b, i) => {
        const el = document.createElement('button'); el.textContent = b.testo;
        if (b.classe) el.className = b.classe;
        el.onclick = () => { v.remove(); ok(b.valore !== undefined ? b.valore : i); };
        sc.appendChild(el);
      });
      document.body.appendChild(v);
      sc.querySelector('button').focus();
    });
  }

  /* ---------- trappole e infermeria ---------- */
  function trappola(id, titolo, testo) {
    suono('trappola');
    document.body.classList.add('scossa');
    const v = via();
    S.scrivi(v + '_ritorno', pagina());
    S.scrivi(v + '_trappola', id);
    S.scrivi(v + '_infermeria', '1');
    S.scrivi(v + '_cadute', (parseInt(S.leggi(v + '_cadute') || '0', 10) || 0) + 1);
    const t = parseInt(S.leggi(v + '_t_' + id) || '0', 10) || 0; S.scrivi(v + '_t_' + id, t + 1);
    return popup(titolo, immagine('T_' + id) + testo, [{ testo: 'Tutto diventa buio…', classe: 'pericolo' }], 'trappola')
      .then(() => vai(D().infermeria));
  }

  /* ---------- immagini ----------
     Ogni stanza mostra images/<NomePagina>.jpg sotto il titolo; ogni trappola images/T_<id>.jpg.
     Se un file manca, lo spazio sparisce senza lasciare buchi. */
  const immagine = (nome, classe = 'scena') =>
    `<figure class="${classe}"><img src="images/${nome}.jpg?v=${VERSIONE}" alt="" loading="lazy" onerror="this.parentNode.remove()"></figure>`;
  function scena() {
    const h = document.querySelector('.iscrizione');
    if (!h || document.querySelector('figure.scena')) return;
    h.insertAdjacentHTML('afterend', immagine(pagina().replace('.html', '')));
  }

  /* ---------- trascrizione decorativa in rune (Fuþark antico) ---------- */
  const FUTHARK = { a:'ᚨ',b:'ᛒ',c:'ᚲ',d:'ᛞ',e:'ᛖ',f:'ᚠ',g:'ᚷ',h:'ᚺ',i:'ᛁ',j:'ᛃ',k:'ᚲ',l:'ᛚ',m:'ᛗ',n:'ᚾ',o:'ᛟ',p:'ᛈ',q:'ᚲ',r:'ᚱ',s:'ᛊ',t:'ᛏ',u:'ᚢ',v:'ᚹ',w:'ᚹ',x:'ᚲᛊ',y:'ᛁ',z:'ᛉ',' ':'᛫' };
  const inRune = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace('ð','d').replace('þ','th').split('').map(c => FUTHARK[c] || '').join('');

  /* ---------- bisaccia ---------- */
  function bisaccia() {
    const b = document.createElement('button');
    b.className = 'bisaccia-apri'; b.textContent = 'Bisaccia';
    b.onclick = () => {
      const d = D();
      const ogg = d.ordineOgg.length ? (d.ordineOgg.filter(ha).map(o => `<li>${d.oggetti[o]}</li>`).join('') || '<li class="nota">Vuota, per ora.</li>') : '';
      const rune = d.ordine.filter(risolto).map(g => d.giochi[g].runa).join(' ');
      const giochi = d.ordine.map(g => `<li>${risolto(g) ? '<span class="ok">✓</span>' : '<span class="nota">·</span>'} ${d.giochi[g].nome}</li>`).join('');
      popup('La tua bisaccia', `<div class="bisaccia">
        <p class="nota">${nome()} · ${casa()}</p>
        ${ogg ? `<ul>${ogg}</ul>` : ''}
        <p class="nota">Rune incise sulla tavoletta:</p>
        <p class="rune-raccolte">${rune || '<span class="nota" style="font-size:16px;letter-spacing:0">nessuna</span>'}</p>
        <p class="nota">Prove della ${d.nome}:</p><ul>${giochi}</ul></div>`, [{ testo: 'Chiudi' }]);
    };
    document.body.appendChild(b);
  }

  /* ---------- ingresso in una stanza ----------
     opzioni: { richiede: () => bool, tipo: 'via'|'neutra' } */
  function stanza(opz = {}) {
    if (!S.leggi('nome') && pagina() !== 'Benvenuto.html') { vai('Benvenuto.html'); return false; }
    if (opz.tipo !== 'neutra') {
      const v = via(), d = D();
      if (S.leggi(v + '_infermeria') === '1' && pagina() !== d.infermeria) { vai(d.infermeria); return false; }
      if (opz.richiede && !opz.richiede()) {
        const ultima = S.leggi(v + '_stanza');
        vai(ultima && ultima !== pagina() ? ultima : d.prima); return false;
      }
      if (pagina() !== d.infermeria) S.scrivi(v + '_stanza', pagina());
      document.body.classList.add('via-' + v);
    }
    document.querySelectorAll('.iscrizione').forEach(i => {
      const h = i.querySelector('h1'); const r = i.querySelector('.rune');
      if (h && r) r.textContent = inRune(h.textContent);
    });
    if (opz.immagine !== false) scena();
    if (opz.tipo !== 'neutra') bisaccia();
    return true;
  }

  /* ---------- sigillo di gioco risolto ---------- */
  function sigilla(g, contenitore, messaggio = '') {
    const prima = !risolto(g);
    S.scrivi(VIA_DI_GIOCO[g] + '_g_' + g, '1');
    if (contenitore) {
      contenitore.classList.add('risolto');
      let s = contenitore.querySelector('.sigillo');
      if (!s) { s = document.createElement('div'); s.className = 'sigillo'; contenitore.appendChild(s); }
      s.innerHTML = `<span class="runa">${giocoDi(g).runa}</span> Prova superata. ${messaggio}
        <br>Codice per la Voce del Magistero: <strong>${codice(g)}</strong>`;
    }
    if (prima) suono('ok');
    return prima;
  }

  return { VIE, S, hash, normalizza, verifica, nome, casa, codice, DATI, via, giocoDi,
           get GIOCHI() { return D().giochi; }, get ORDINE() { return D().ordine; }, get OGGETTI() { return D().oggetti; },
           risolto, ha, prendi, segna, fatto, suono, vai, popup, trappola, stanza, sigilla, inRune, pagina, immagine };
})();
