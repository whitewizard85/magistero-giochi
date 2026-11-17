/* Motore del tafl 7x7 usato nella Camera del Tumulo.
   Regole (variante semplificata, dichiarata nella pagina):
   - tutti i pezzi muovono in orizzontale o verticale di quante caselle vogliono, senza scavalcare;
   - solo il re può fermarsi sul trono centrale e sui quattro angoli (i rifugi);
   - un pezzo (non il re) è catturato se chiuso fra due nemici, o fra un nemico e un angolo
     o il trono vuoto, dalla mossa dell'avversario; il re bianco aiuta a catturare;
   - il re è catturato se è circondato sui quattro lati da attaccanti (il trono conta come attaccante);
   - il bianco vince quando il re raggiunge un angolo. */
const TAFL = (() => {
  const N = 7;
  const ANGOLI = new Set(['0,0', '6,0', '0,6', '6,6']);
  const TRONO = '3,3';
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const k = (x, y) => x + ',' + y;
  const dentro = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  function mosse(b, lato) {
    const out = [];
    for (const [c, p] of Object.entries(b)) {
      if (lato === 'W' ? (p !== 'W' && p !== 'K') : p !== 'B') continue;
      const [x, y] = c.split(',').map(Number);
      for (const [dx, dy] of D) {
        let a = x + dx, d = y + dy;
        while (dentro(a, d) && !(k(a, d) in b)) {
          if (ANGOLI.has(k(a, d)) && p !== 'K') break;
          if (!(k(a, d) === TRONO && p !== 'K')) out.push([c, k(a, d)]);
          a += dx; d += dy;
        }
      }
    }
    return out;
  }
  function ostile(b, x, y, vittima) {
    const c = k(x, y);
    if (ANGOLI.has(c)) return true;
    if (c === TRONO && !(c in b)) return true;
    const p = b[c]; if (p === undefined) return false;
    return vittima === 'B' ? (p === 'W' || p === 'K') : p === 'B';
  }
  function applica(b, m) {
    const n = Object.assign({}, b); const [s, t] = m; const p = n[s]; delete n[s]; n[t] = p;
    const [x, y] = t.split(',').map(Number); const catturati = [];
    for (const [dx, dy] of D) {
      const c = k(x + dx, y + dy), q = n[c];
      if (q === undefined || q === 'K') continue;
      const nemico = (p === 'W' || p === 'K') ? q === 'B' : q === 'W';
      if (nemico && ostile(n, x + 2 * dx, y + 2 * dy, q)) { delete n[c]; catturati.push(c); }
    }
    return { b: n, catturati };
  }
  const re = (b) => Object.keys(b).find(c => b[c] === 'K');
  function reCatturato(b) {
    const r = re(b); if (!r) return true;
    const [x, y] = r.split(',').map(Number);
    for (const [dx, dy] of D) {
      const a = x + dx, d = y + dy;
      if (!dentro(a, d)) return false;
      const c = k(a, d);
      if (b[c] === 'B' || c === TRONO) continue;
      return false;
    }
    return true;
  }
  const vinto = (b) => ANGOLI.has(re(b));
  const chiave = (b) => Object.keys(b).sort().map(c => c + b[c]).join(';');
  function vinceIn(b, n, memo) {
    const key = chiave(b) + '|' + n;
    if (memo.has(key)) return memo.get(key);
    let res = false;
    const wm = mosse(b, 'W');
    for (const m of wm) if (b[m[0]] === 'K' && ANGOLI.has(m[1])) { res = true; break; }
    if (!res && n > 1) {
      for (const m of wm) {
        const b2 = applica(b, m).b; let ok = true;
        for (const r of mosse(b2, 'B')) {
          const b3 = applica(b2, r).b;
          if (reCatturato(b3) || !vinceIn(b3, n - 1, memo)) { ok = false; break; }
        }
        if (ok) { res = true; break; }
      }
    }
    memo.set(key, res); return res;
  }
  /* risposta del nero: cattura il re se può, altrimenti cerca una mossa che
     impedisca al bianco di vincere con le mosse che gli restano. */
  function rispostaNero(b, restanti, libro) {
    if (libro && libro[chiave(b)]) return libro[chiave(b)];
    const bm = mosse(b, 'B'); if (!bm.length) return null;
    for (const r of bm) if (reCatturato(applica(b, r).b)) return r;
    const memo = new Map();
    let migliore = null, peggiore = Infinity;
    for (const r of bm) {
      const b3 = applica(b, r).b;
      if (!vinceIn(b3, restanti, memo)) return r;
      // se il bianco vince comunque, scegli la risposta che gli lascia meno vie
      const vie = mosse(b3, 'W').filter(m => (b3[m[0]] === 'K' && ANGOLI.has(m[1]))).length;
      if (vie < peggiore) { peggiore = vie; migliore = r; }
    }
    return migliore;
  }
  return { N, ANGOLI, TRONO, mosse, applica, reCatturato, vinto, rispostaNero, vinceIn, chiave, re };
})();
if (typeof module !== 'undefined') module.exports = TAFL;
