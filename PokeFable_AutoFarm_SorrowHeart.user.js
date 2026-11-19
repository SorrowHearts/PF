// ==UserScript==
// @name         PokeFable AutoFarm, by: SorrowHeart
// @downloadURL  https://raw.githubusercontent.com/SorrowHearts/PF/main/PokeFable_AutoFarm_SorrowHeart.user.js
// @updateURL    https://raw.githubusercontent.com/SorrowHearts/PF/main/PokeFable_AutoFarm_SorrowHeart.user.js
// @homepageURL  https://github.com/SorrowHearts/PF
// @version      1.6.1
// @description  PokéFable AutoFarm.
// @match        *://pokefableonline.com/*
// @match        *://*.pokefableonline.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const IN_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';

  const HOOK_ANCHOR = 'jogo.raidArena=Raid.arenaNoBoot(NOME);';

  const SHINY_TAP_ANCHOR = 'function avisoShinyPerto(m){';
  const SHINY_TAP_SOURCE = 'try{window.__pfShinyServer&&window.__pfShinyServer(m)}catch(e){}';

  const HOOK_SOURCE =
    'window.__pfHook={' +
    'get jogo(){return jogo},' +
    'usarGolpe:a=>usarGolpe(a),' +
    'atalho:i=>usarAtalho(i),' +
    'slot:i=>{const b=jogo.atalhos&&jogo.atalhos[i];if(!b||b.tipo!=="item"||b.bola)return null;return{id:b.id,nome:b.nome,n:(itensDeUso()[b.id]||0)}},' +
    'golpeDaBarra:i=>golpeDaBarra(i),' +
    'golpe:id=>GOLPES[id]||null,' +
    'temPP:(p,id)=>Ind.temPP(p,id),' +
    'semPP:p=>Ind.semPP(p),' +
    'reserva:id=>(id==null?null:(Mundo.reservaDe?Mundo.reservaDe(id):null)||null),' +
    'nearDoor:(x,z,r)=>portasCena.some(q=>distPorta(q,x,z)<r),' +
    'capturar:s=>{if(!s||!jogo.ash||s.estado!=="desmaiado"||s.raid||s.chefe||s.emVoo)return{started:false,reason:"not-ready"};const pref=String(jogo.bolaSel||"1001"),ids=["1001","1002","1003",pref,...Object.keys(jogo.bolas||{})],b=ids.find(id=>id&&id!=="1004"&&(jogo.bolas[id]||0)>0);if(!b)return{started:false,reason:"no-balls"};const old=jogo.bolaSel;try{jogo.alvo=s;jogo.bolaSel=String(b);jogarBola();return{started:!!(s.emVoo||s.estado==="capturando"),ball:String(b)}}finally{jogo.bolaSel=old}},' +
    'time:()=>jogo.time||[],' +
    'ativo:()=>membroAtivo(),' +
    'ko:t=>koRegistro(t),' +
    'inscrito:t=>inscritoNoTorneio(t),' +
    'teto:()=>tetoNivel(),' +
    'trocaCd:()=>jogo.trocaCd||0,' +
    'trocarPara:i=>trocarPara(i),' +
    'saltos:()=>{try{return saltos||null}catch(e){return null}},' +
    'libre:(x,z)=>{const e=jogo.ash;return livre(x,z)&&!posteNoCaminho(e,x,z)&&!barreiraNoCorpo(e,x,z)},' +
    'passo:(ax,az,bx,bz,st=0.25)=>{const e=jogo.ash,dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);if(!L)return true;let S=null;try{S=saltos&&saltos.size?saltos:null}catch(err){}const n=Math.max(1,Math.ceil(L/st));let px=ax,pz=az;for(let i=1;i<=n;i++){const x=ax+dx*i/n,z=az+dz*i/n;if(S){const k=S.get(Math.floor(x)+","+Math.floor(z))||S.get(Math.floor(px)+","+Math.floor(pz));if(k&&!k.dupla&&(dx*k.ux+dz*k.uz)/L<0.6)return false}if(!livre(x,z)||posteNoCaminho(e,x,z)||barreiraNoCorpo(e,x,z))return false;px=x;pz=z}return true},' +
    "podeIr:(e,x,z)=>podeIr(e,x,z)," +
    'sala:()=>SALA,' +
    'sceneGen:()=>{try{return jogo.portaViva&&jogo.portaViva.ger||0}catch(e){return 0}},' +
    'destino:()=>destinoPreso(),' +
    'irCentro:()=>{const d=destinoPreso();return irParaCena({mapa:d.mapa,chegada:d.chegada,texto:"Centro Pokémon…"})},' +
    'irCena:o=>irParaCena(o),' +
    'enfermeira:()=>(jogo.npcs||[]).find(n=>n&&n.papel==="cura"&&!ehMae(n))||null,' +
    'irFalar:n=>irFalarCom(n),' +
    'falando:()=>!!falando,' +
    'pular:()=>{if(falando&&pularFala)pularFala()},' +
    'fecharMenus:()=>{try{Menus.fechar()}catch(e){}},' +
    'busy:()=>{try{' +
    'if(jogo.turno)return"in a turn-based battle";' +
    'if(interagindo||falando)return"talking / interacting";' +
    'if(Menus.aberto()||Troca.aberta())return"a menu is open";' +
    'if((Duelo.lutando&&Duelo.lutando())||(TorneioJogo.lutando&&TorneioJogo.lutando()))return"in a duel / tournament";' +
    'if(jogo.raidArena||(Raid.preparando&&Raid.preparando()))return"in a raid";' +
    'if(jogo.evoluindo||jogo.trocandoSeguidor||jogo.trocaPendente||jogo.trocandoJogador)return"switching Pokémon";' +
    'if(jogo.descarregando||jogo.navegando||portaOcupado)return"changing area";' +
    'if(jogo.montaria)return"mounted (dismount first)";' +
    'if(jogo.semParceiro)return"no partner Pokémon";' +
    'if(parceiroGuardado())return"partner is in its ball";' +
    'if(parceiroInscrito())return"partner is in a tournament";' +
    'return null}catch(e){return"game still loading"}}' +
    '};';

  function patchModule(src) {
    const i = src.indexOf(HOOK_ANCHOR);
    if (i < 0) throw new Error('hook anchor not found – the game was probably updated');
    if (src.indexOf(HOOK_ANCHOR, i + 1) >= 0) throw new Error('hook anchor is not unique');
    let out = src.slice(0, i) + HOOK_SOURCE + src.slice(i);
    const j = out.indexOf(SHINY_TAP_ANCHOR);
    if (j >= 0 && out.indexOf(SHINY_TAP_ANCHOR, j + 1) < 0) {
      out = out.slice(0, j + SHINY_TAP_ANCHOR.length) + SHINY_TAP_SOURCE + out.slice(j + SHINY_TAP_ANCHOR.length);
    }
    return out;
  }

  function installPatch() {
    const proto = Element.prototype;
    const original = proto.replaceWith;
    proto.replaceWith = function (...nodes) {
      try {
        if (this && this.id === 'modulo-jogo') {
          for (const n of nodes) {
            if (n && n.tagName === 'SCRIPT' && n.type === 'module' && typeof n.textContent === 'string') {
              n.textContent = patchModule(n.textContent);
              window.__pfPatch = { ok: true };
            }
          }
        }
      } catch (e) {
        window.__pfPatch = { ok: false, error: String((e && e.message) || e) };
      }
      return original.apply(this, nodes);
    };
  }

  const TUNE = {
    tick: 100,
    stand: 0.25,
    engage: 2.2,
    rangedMax: 11,
    stuckMs: 3500,
    blacklistMs: 20000,
    fireGap: 140,
    doorClear: 2.4,
    doorPath: 1.9,
    retargetGain: 6,
    swapWait: 8000,
    faintWait: 2500,
    swapMinHp: 50,
    hopWait: 20000,
    tripMax: 240000,
    healWait: 40000,
    healCooldown: 90000,
    pinnedMs: 1200,
    pinMove: 0.25,
    nudgeLen: 1.6,
    nudgeLen2: 3.0,
    nudgeMs: 1500,
    pinGiveUpMs: 12000,
    planMs: 20,
    planMax: 6000,
    pathMax: 45000,
    replanDist: 4,
    directMax: 8,
    lineEvery: 500,
    goalR: 1.2,
    look: 5,
    maxReplans: 6,
    potionGap: 2500,
    captureRange: 9,
    captureGap: 1800,
    potionPp: 0.25,
    cacheMs: 30000,
  };

  const ALIVE = new Set(['vagando', 'fugindo', 'atacando']);

  const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function makePlannerOnce(env, sx, sz, gx, gz, opt) {
    opt = opt || {};
    const R = opt.res || 0.5, goalR = opt.goalR || 1.2, maxCells = opt.maxCells || 90000, maxExpand = opt.maxExpand || 120000;
    const clock = opt.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    let margin = opt.margin || 18, ix0, iz0, W, H;
    for (;;) {
      ix0 = Math.floor((Math.min(sx, gx) - margin) / R); iz0 = Math.floor((Math.min(sz, gz) - margin) / R);
      W = Math.floor((Math.max(sx, gx) + margin) / R) - ix0 + 1; H = Math.floor((Math.max(sz, gz) + margin) / R) - iz0 + 1;
      if (W * H <= maxCells || margin <= 4) break;
      margin *= 0.8;
    }
    const N = W * H, out = { path: null, expanded: 0, status: 'running', exhausted: false, edge: false };
    if (N > maxCells * 2) { out.step = () => (out.status = 'fail'); return out; }
    const g = new Float32Array(N).fill(Infinity), par = new Int32Array(N).fill(-1), st = new Uint8Array(N), fr = new Uint8Array(N);
    const px = (i) => (ix0 + (i % W) + 0.5) * R, pz = (i) => (iz0 + ((i / W) | 0) + 0.5) * R;
    const free = (i) => { let f = fr[i]; if (!f) { f = env.free(px(i), pz(i)) ? 1 : 2; fr[i] = f; } return f === 1; };
    const sIdx = (Math.floor(sx / R) - ix0) + (Math.floor(sz / R) - iz0) * W;

    const heap = [], hf = [];
    const push = (i, f) => { let k = heap.length; heap.push(i); hf.push(f); while (k > 0) { const q = (k - 1) >> 1; if (hf[q] <= f) break; heap[k] = heap[q]; hf[k] = hf[q]; k = q; } heap[k] = i; hf[k] = f; };
    const pop = () => {
      const top = heap[0], li = heap.pop(), lf = hf.pop();
      if (heap.length) { let k = 0; for (;;) { let c = 2 * k + 1; if (c >= heap.length) break; if (c + 1 < heap.length && hf[c + 1] < hf[c]) c++; if (hf[c] >= lf) break; heap[k] = heap[c]; hf[k] = hf[c]; k = c; } heap[k] = li; hf[k] = lf; }
      return top;
    };
    const h = (i) => Math.hypot(px(i) - gx, pz(i) - gz);

    function ledgeOk(ax, az, bx, bz, diag) {
      if (!env.salto) return true;
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      const probe = [[ax, az], [bx, bz], [(ax + bx) / 2, (az + bz) / 2]];
      if (diag) probe.push([bx, az], [ax, bz]);
      for (const q of probe) {
        const s = env.salto(q[0], q[1]);
        if (s && !s.dupla && (dx * s.ux + dz * s.uz) / L < 0.6) return false;
      }
      return true;
    }

    g[sIdx] = 0; push(sIdx, h(sIdx));
    const started = clock();
    out.step = function step(ms) {
      if (out.status !== 'running') return out.status;
      const t0 = clock();
      while (heap.length) {
        if ((out.expanded & 31) === 31 && clock() - t0 > ms) return 'running';
        if (out.expanded > maxExpand || clock() - started > (opt.maxMs || 60000)) return (out.status = 'fail');
        const i = pop();
        if (st[i] === 2) continue;
        st[i] = 2; out.expanded++;
        if (Math.hypot(px(i) - gx, pz(i) - gz) <= goalR) {
          const pts = [];
          for (let k = i; k !== -1; k = par[k]) pts.push({ x: px(k), z: pz(k) });
          pts.reverse(); pts[0] = { x: sx, z: sz };
          const slim = [pts[0]];
          for (let k = 1; k < pts.length - 1; k++) {
            const a = slim[slim.length - 1], b = pts[k], c = pts[k + 1];
            if (Math.abs((b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x)) > 1e-6 || ((b.x - a.x) * (c.x - b.x) + (b.z - a.z) * (c.z - b.z)) < 0) slim.push(b);
          }
          if (pts.length > 1) slim.push(pts[pts.length - 1]);
          out.path = slim;
          return (out.status = 'found');
        }
        const cx = i % W, cz = (i / W) | 0;
        if (cx === 0 || cz === 0 || cx === W - 1 || cz === H - 1) out.edge = true;
        for (const d of DIRS8) {
          const nx = cx + d[0], nz = cz + d[1];
          if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue;
          const j = nx + nz * W;
          if (st[j] === 2 || !free(j)) continue;
          const diag = d[0] !== 0 && d[1] !== 0;
          if (diag && (!free(cx + d[0] + cz * W) || !free(cx + (cz + d[1]) * W))) continue;
          if (!ledgeOk(px(i), pz(i), px(j), pz(j), diag)) continue;
          const ng = g[i] + (diag ? R * 1.4142 : R);
          if (ng < g[j]) { g[j] = ng; par[j] = i; push(j, ng + h(j)); }
        }
      }
      out.exhausted = true;
      return (out.status = 'fail');
    };
    return out;
  }

  function makePlanner(env, sx, sz, gx, gz, opt) {
    opt = opt || {};
    const d = Math.hypot(gx - sx, gz - sz), margins = [Math.max(opt.margin || 18, d * 0.5), Math.max(60, d * 1.5)];
    const mk = (m, cells) => makePlannerOnce(env, sx, sz, gx, gz, Object.assign({}, opt, { margin: m, maxCells: cells }));
    let k = 0, spent = 0, cur = mk(margins[0], opt.maxCells || 90000);
    const out = { path: null, expanded: 0, status: 'running' };
    out.step = (ms) => {
      if (out.status !== 'running') return out.status;
      const r = cur.step(ms);
      out.expanded = spent + cur.expanded;
      if (r === 'found') { out.path = cur.path; return (out.status = 'found'); }
      if (r === 'fail') {
        if (cur.edge && cur.exhausted && k + 1 < margins.length) { spent += cur.expanded; cur = mk(margins[++k], 360000); return 'running'; }
        return (out.status = 'fail');
      }
      return 'running';
    };
    return out;
  }

  function createHunter(getHook, cfg, clock) {
    clock = clock || (() => performance.now());
    const S = {
      enabled: false, status: 'Off', tone: 'idle', notice: null,
      cur: null, fired: new WeakSet(), prog: null, ranged: false, walking: false, stationaryMode: false,
      nextSlot: 0, lastFire: 0, lastSlot: -1, kills: 0, shots: 0, swaps: 0, heals: 0, sw: null, faintAt: null,
      trip: null, lastSkip: 0, lastTalk: 0, walkProg: null, menuSince: 0,
      pin: null, pinSince: 0, nudge: null, nudgeTried: new Set(), nudgePass: 0,
      plan: null, path: null, plans: 0, replans: 0, fc: null, lineT: 0, lineOk: true, lineTarget: null,
      list: [], black: new Map(), hooked: false, onChange: null,
      captureTried: new WeakMap(), captureInFlight: null, captureRetryAt: 0, lastNoBallsNotice: 0,
      potT: [-1e9, -1e9], potion: ['', ''], potUsed: [0, 0],
    };

    const TRIP_KEY = 'pfAutoHunt.trip.v1', HEAL_KEY = 'pfAutoHunt.lastHeal.v1';
    const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } };
    function persistTrip() {
      const ls = store(); if (!ls || !S.trip) return;
      try { ls.setItem(TRIP_KEY, JSON.stringify(Object.assign({}, S.trip, { stats: { kills: S.kills, shots: S.shots, swaps: S.swaps, heals: S.heals } }))); } catch (e) {  }
    }
    function clearTrip() { S.trip = null; S.walkProg = null; const ls = store(); try { if (ls) ls.removeItem(TRIP_KEY); } catch (e) {  } }
    function lastHealAt() { const ls = store(); try { return ls ? +ls.getItem(HEAL_KEY) || 0 : 0; } catch (e) { return 0; } }
    function markHealed() { const ls = store(); try { if (ls) ls.setItem(HEAL_KEY, String(Date.now())); } catch (e) {  } }
    (function resumeTrip() {
      const ls = store(); if (!ls) return;
      let t = null;
      try { t = JSON.parse(ls.getItem(TRIP_KEY) || 'null'); } catch (e) { t = null; }
      if (!t || typeof t !== 'object' || !t.phase || Date.now() - (+t.t || 0) > TUNE.tripMax) { try { ls.removeItem(TRIP_KEY); } catch (e) {  } return; }
      const st = t.stats || {}; delete t.stats;
      S.kills = +st.kills || 0; S.shots = +st.shots || 0; S.swaps = +st.swaps || 0; S.heals = +st.heals || 0;
      S.trip = t; S.enabled = true; S.status = 'Resuming the heal trip…'; S.tone = 'warn';
    })();

    function scan(J, hook, now) {
      const a = J.ash, out = [];
      for (const [o, until] of S.black) if (until <= now) S.black.delete(o);
      for (const s of J.selvagens || []) {
        if (!s || typeof s.x !== 'number' || typeof s.z !== 'number') continue;
        if (!ALIVE.has(s.estado) || !(s.hp > 0)) continue;
        if (s.naBola || s.emTurno || s.torneio || s.safari || s.perfil === 'treinado') continue;
        const dist = Math.hypot(s.x - a.x, s.z - a.z);
        let skip = null;
        if ((s.raid || s.chefe)) skip = 'boss';
        else if (s.aquatico && !s.shiny) skip = 'in water';
        else if (dist > cfg.maxDist) skip = 'too far';
        else if (!s.shiny && s.rede && hook.reserva(s.id)) skip = 'reserved';
        else if (S.black.has(s)) skip = 'unreachable';
        out.push({
          s, dist, skip,
          name: s.nome || (s.especie && s.especie.nome) || '?',
          lv: s.lv, shiny: !!s.shiny, hp: s.hp, maxHp: s.maxHp, perfil: s.perfil, estado: s.estado,
        });
      }
      out.sort((x, y) => x.dist - y.dist);
      return out;
    }

    function doorOnPath(hook, a, s) {
      try {
        if (hook.nearDoor(s.x, s.z, TUNE.doorClear)) return true;
        const d = Math.hypot(s.x - a.x, s.z - a.z), n = Math.ceil(d);
        for (let i = 1; i < n; i++) {
          const k = i / n;
          if (hook.nearDoor(a.x + (s.x - a.x) * k, a.z + (s.z - a.z) * k, TUNE.doorPath)) return true;
        }
      } catch (e) {  }
      return false;
    }

    function chooseTarget(cands, hook, a, now) {
      for (const c of cands) {
        if (!c.shiny) continue;
        let atDoor = false;
        try { atDoor = hook.nearDoor(c.s.x, c.s.z, TUNE.doorClear); } catch (e) {  }
        if (atDoor) { S.black.set(c.s, now + TUNE.blacklistMs); continue; }
        return c;
      }
      if (S.cur) {
        const c = cands.find((x) => x.s === S.cur);
        if (c) {
          const best = cands[0];
          const keep = best.s === S.cur || !(best.dist + TUNE.retargetGain < c.dist && c.dist > TUNE.engage);
          if (keep) return c;
        }
      }
      for (const c of cands) {
        let atDoor = false;
        try { atDoor = hook.nearDoor(c.s.x, c.s.z, TUNE.doorClear); } catch (e) {  }
        if (atDoor) { S.black.set(c.s, now + TUNE.blacklistMs); continue; }
        return c;
      }
      return null;
    }

    function pickMove(hook, p) {
      for (let k = 0; k < 4; k++) {
        const i = (S.nextSlot + k) % 4;
        const id = hook.golpeDaBarra(i);
        if (!id) continue;
        if (((p.recargas && p.recargas[id]) || 0) > 0) continue;
        if (!hook.temPP(p, id)) continue;
        const g = hook.golpe(id);
        if (!g || (g.cat === 'status' && !(g.poder > 0))) continue;
        return { slot: i, id, g };
      }
      return null;
    }

    const canRoute = (hook) => !!(hook.passo && hook.libre && hook.saltos && hook.sala);
    const gkey = (x, z) => (Math.floor(x * 2) + 40000) * 100000 + (Math.floor(z * 2) + 40000);

    function makeEnv(hook, now) {
      const sala = hook.sala();
      if (!S.fc || S.fc.sala !== sala || now - S.fc.t > TUNE.cacheMs) S.fc = { sala, t: now, m: new Map(), bad: new Set() };
      const fc = S.fc, sal = hook.saltos();
      return {
        free(x, z) {
          const k = gkey(x, z);
          let v = fc.m.get(k);
          if (v === undefined) {
            v = !fc.bad.has(k) && !!hook.libre(x, z) && !hook.nearDoor(x, z, TUNE.doorPath + 0.2); fc.m.set(k, v);
          }
          return v;
        },
        salto: sal && sal.size ? (x, z) => sal.get(Math.floor(x) + ',' + Math.floor(z)) : null,
      };
    }

    function lineClear(hook, a, s) {
      const d = Math.hypot(s.x - a.x, s.z - a.z);
      if (d <= TUNE.goalR) return true;
      const k = (d - TUNE.goalR) / d, ex = a.x + (s.x - a.x) * k, ez = a.z + (s.z - a.z) * k;
      try { return !doorOnPath(hook, a, { x: ex, z: ez }) && !!hook.passo(a.x, a.z, ex, ez, 0.5); } catch (e) { return true; }
    }

    function doorCrossed(hook, a, b) {
      try {
        const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / 0.5));
        for (let i = 1; i <= n; i++) { const k = i / n; if (hook.nearDoor(a.x + (b.x - a.x) * k, a.z + (b.z - a.z) * k, TUNE.doorPath - 0.15)) return true; }
      } catch (e) {  }
      return false;
    }

    function startPlan(hook, a, t, now) {
      S.plan = makePlanner(makeEnv(hook, now), a.x, a.z, t.s.x, t.s.z, { goalR: TUNE.goalR });
      S.plan.t0 = now; S.plan.goal = { x: t.s.x, z: t.s.z }; S.plans++;
    }

    function routeStep(hook, a, t, now) {
      if (S.plan) {
        const r = S.plan.step(TUNE.planMs);
        if (r === 'running') { if (now - S.plan.t0 > TUNE.planMax) { S.plan = null; return 'fail'; } return 'planning'; }
        const pl = S.plan; S.plan = null;
        if (r !== 'found') return 'fail';
        S.path = { pts: pl.path, i: 0, goal: pl.goal, born: now }; S.pin = null;
      }
      if (S.path) {
        const P = S.path;
        if (now - P.born > TUNE.pathMax) { S.path = null; return 'fail'; }
        if (Math.hypot(t.s.x - P.goal.x, t.s.z - P.goal.z) > TUNE.replanDist) { S.path = null; startPlan(hook, a, t, now); return 'planning'; }
        if (t.dist <= TUNE.directMax && lineClear(hook, a, t.s)) { S.path = null; S.lineT = 0; return 'direct'; }
        const n = P.pts.length;
        let best = -1;
        for (let j = Math.min(n - 1, P.i + TUNE.look); j >= P.i; j--) {
          const w = P.pts[j];
          let line = false;
          try { line = !!hook.passo(a.x, a.z, w.x, w.z, 0.25) && !doorCrossed(hook, a, w); } catch (e) { line = false; }
          if (line) { best = j; break; }
        }
        P.i = best < 0 ? P.i : best;
        if (Math.hypot(a.x - P.pts[P.i].x, a.z - P.pts[P.i].z) < 0.5) {
          if (P.i >= n - 1) { S.path = null; S.lineT = 0; return 'direct'; }
          P.i++;
        }
        a.alvoX = P.pts[P.i].x; a.alvoZ = P.pts[P.i].z; S.walking = true;
        return 'path';
      }
      if (S.lineTarget !== t.s || now - S.lineT >= TUNE.lineEvery) { S.lineTarget = t.s; S.lineT = now; S.lineOk = lineClear(hook, a, t.s); }
      if (S.lineOk) return 'direct';
      startPlan(hook, a, t, now);
      return 'planning';
    }

    function resetNudge() { S.nudge = null; S.nudgeTried.clear(); S.nudgePass = 0; S.pin = null; S.pinSince = 0; S.plan = null; S.path = null; S.replans = 0; S.lineT = 0; S.lineOk = true; S.lineTarget = null; }

    function pickNudge(hook, a, t) {
      const want = Math.atan2(t.s.z - a.z, t.s.x - a.x), len = S.nudgePass ? TUNE.nudgeLen2 : TUNE.nudgeLen;
      let best = null;
      for (let i = 0; i < 16; i++) {
        if (S.nudgeTried.has(i)) continue;
        const ang = (i * Math.PI) / 8, c = Math.cos(ang), n = Math.sin(ang);
        let ok = true;
        try {
          ok = hook.passo ? !!hook.passo(a.x, a.z, a.x + c * len, a.z + n * len, 0.2)
                          : !!(hook.podeIr(a, a.x + c * 0.6, a.z + n * 0.6) && hook.podeIr(a, a.x + c * len, a.z + n * len));
        } catch (e) { ok = true; }
        if (!ok) continue;
        const score = Math.cos(ang - want);
        if (!best || score > best.score) best = { i, score, x: a.x + c * len, z: a.z + n * len };
      }
      return best;
    }

    const isDamaging = (g) => !!g && !(g.cat === 'status' && !(g.poder > 0));

    function hasDamagingPP(hook, p) {
      let seen = false;
      for (let i = 0; i < 4; i++) {
        const id = hook.golpeDaBarra(i);
        if (!id) continue;
        seen = true;
        if (isDamaging(hook.golpe(id)) && hook.temPP(p, id)) return true;
      }
      return !seen;
    }

    function memberHasDamagingPP(hook, t) {
      for (const m of t.movs || []) {
        if (!m || !m.id || !isDamaging(hook.golpe(m.id))) continue;
        let ok;
        try { ok = hook.temPP(t, m.id); } catch (e) { ok = m.pp == null || m.pp > 0; }
        if (ok) return true;
      }
      return false;
    }

    function pickReplacement(hook) {
      const team = hook.time(), cur = hook.ativo();
      if (!Array.isArray(team) || team.length < 2) return { fail: 'no other Pokémon in the team', spent: true };
      const need = Math.min(100, Math.max(TUNE.swapMinHp, (cfg.minHp || 0) + 20));
      const cap = hook.teto();
      let best = null;
      team.forEach((t, i) => {
        if (!t || i === cur) return;
        try {
          if (!(t.hp > 0) || hook.ko(t) || hook.inscrito(t)) return;
          if (cap && t.lv > cap) return;
          const pct = t.maxHp > 0 ? (t.hp / t.maxHp) * 100 : 100;
          if (pct < need) return;
          if (!memberHasDamagingPP(hook, t)) return;
          if (!best || pct > best.pct || (pct === best.pct && t.lv > best.t.lv)) best = { i, t, pct };
        } catch (e) {  }
      });
      return best || { fail: 'no teammate with ≥ ' + need + '% HP and PP left', spent: true };
    }

    function trySwitch(J, hook, p, now, why) {
      releaseWalk(J.ash); S.cur = null;
      if (S.sw) {
        if (now - S.sw.t < TUNE.swapWait) return { pending: 'Switching to ' + S.sw.name + '…' };
        S.sw = null;
        return { fail: 'the game did not finish the switch' };
      }
      const cd = hook.trocaCd();
      if (cd > 0) return { pending: 'Partner ' + why + ' — switch cooldown ' + Math.ceil(cd) + ' s' };
      const r = pickReplacement(hook);
      if (r.fail) return r;
      try {
        const res = hook.trocarPara(r.i);
        if (res && typeof res.catch === 'function') res.catch(() => {});
      } catch (e) { return { fail: 'the switch call failed' }; }
      S.sw = { from: p, t: now, name: r.t.nome || '?' };
      return { pending: 'Partner ' + why + ' — switching to ' + S.sw.name + '…' };
    }

    const teamHealed = (hook) => {
      const team = hook.time();
      return Array.isArray(team) && team.length > 0 && team.every((t) => !t || !(t.maxHp > 0) || t.hp >= t.maxHp * 0.999);
    };

    const OVERWORLD = new Set(['kanto', 'pallet_rota1']);
    const sameSala = (x, y) => x === y || (OVERWORLD.has(x) && OVERWORLD.has(y));
    function setPhase(ph) { S.trip.phase = ph; S.trip.tp = Date.now(); S.trip.tries = 0; S.trip.sentAt = 0; S.walkProg = null; persistTrip(); }

    function endTrip(a, errMsg, okMsg) {
      releaseWalk(a);
      if (errMsg) { stop(a, errMsg); return; }
      clearTrip(); S.cur = null; S.prog = null;
      S.status = okMsg || 'Back on the hunt'; S.tone = 'ok'; emit();
    }

    function hop(hook, a, call, failMsg) {
      const tr = S.trip, nowMs = Date.now();
      if (tr.sentAt && nowMs - tr.sentAt <= TUNE.hopWait) return;
      if ((tr.tries || 0) >= 3) { endTrip(a, failMsg); return; }
      const b = hook.busy();
      if (b) { S.status = 'Heal trip paused — ' + b; return; }
      tr.tries = (tr.tries || 0) + 1; tr.sentAt = nowMs; persistTrip();
      releaseWalk(a);
      try {
        Promise.resolve(call()).then((ok) => { if (ok === false && S.trip === tr) { tr.sentAt = 0; tr.tries--; } }, () => {});
      } catch (e) {}
    }

    function startHealTrip(J, hook, a, why) {
      if (Date.now() - lastHealAt() < TUNE.healCooldown) return stop(a, 'partner ' + why + ' again right after a heal — not trying again');
      releaseWalk(a); S.cur = null;
      if (hook.enfermeira()) {
        S.trip = { phase: 'center', from: null, t: Date.now(), tp: Date.now(), tries: 0, sentAt: 0 };
      } else {
        const d = hook.destino();
        if (!d || !d.centro) return stop(a, 'partner ' + why + ' — you have not visited a Pokécenter yet');
        S.trip = { phase: 'out', from: { sala: hook.sala() }, t: Date.now(), tp: Date.now(), tries: 0, sentAt: 0 };
      }
      persistTrip();
      S.status = 'Whole team is spent — going to the Pokécenter…'; S.tone = 'warn'; emit();
    }

    function runTrip(J, hook, a, now) {
      const tr = S.trip, nowMs = Date.now(), here = hook.sala();
      S.tone = 'warn';
      if (nowMs - (+tr.t || 0) > TUNE.tripMax) return endTrip(a, 'the heal trip took too long');

      if (tr.phase === 'out') {
        if (!sameSala(here, tr.from.sala)) { setPhase('center'); S.status = 'At the Pokécenter…'; return; }
        S.status = 'Teleporting to the Pokécenter…';
        return hop(hook, a, () => hook.irCentro(), 'could not reach the Pokécenter');
      }

      if (tr.phase === 'center') {
        if (teamHealed(hook)) {
          markHealed(); S.heals++;
          if (!tr.from) return endTrip(a, null, 'Healed — back on the hunt');
          setPhase('back'); S.status = 'Team healed — heading back…'; return;
        }
        if (nowMs - tr.tp > TUNE.healWait) return endTrip(a, 'the nurse did not heal the team');
        if (hook.falando()) {
          if (now - S.lastSkip > 350) { hook.pular(); S.lastSkip = now; }
          S.status = 'Talking to the nurse…'; return;
        }
        const b = hook.busy();
        if (b === 'a menu is open') {
          if (!S.menuSince) S.menuSince = now;
          if (now - S.menuSince > 1500) { hook.fecharMenus(); S.menuSince = 0; }
        } else S.menuSince = 0;
        if (b && b !== 'talking / interacting') { S.status = 'At the Pokécenter — waiting (' + b + ')'; return; }
        const nurse = hook.enfermeira();
        if (!nurse) { S.status = 'Looking for the nurse…'; return; }
        const d = Math.hypot(nurse.x - a.x, nurse.z - a.z);
        if (d > 10) { a.alvoX = nurse.x; a.alvoZ = nurse.z; S.walking = true; }
        else if (now - S.lastTalk > 1500) { hook.irFalar(nurse); S.lastTalk = now; }
        S.status = 'Getting the nurse to heal the team…'; return;
      }

      if (tr.phase === 'back') {
        if (sameSala(here, tr.from.sala)) return endTrip(a, null, 'Healed — teleported back to the hunting area');
        S.status = 'Teleporting back to the hunting area…';
        return hop(hook, a, () => hook.irCena({ mapa: tr.from.sala, texto: 'Back to the hunt…' }), 'could not teleport back to the hunting map');
      }

      if (tr.phase === 'walk') return endTrip(a, null, 'Healed — back on the hunt');
    }

    function releaseWalk(a) {
      if (S.walking) { a.alvoX = null; S.walking = false; }
    }

    function emit() { if (S.onChange) S.onChange(); }

    function stop(a, msg) {
      S.enabled = false; S.notice = msg; S.cur = null;
      clearTrip();
      releaseWalk(a);
      S.status = 'Stopped — ' + msg; S.tone = 'err';
      emit();
    }

    function setEnabled(v) {
      v = !!v;
      if (v === S.enabled) return;
      S.enabled = v;
      if (v) { S.notice = null; S.black.clear(); S.cur = null; S.prog = null; S.sw = null; S.faintAt = null; resetNudge(); S.status = 'Starting…'; S.tone = 'ok'; }
      else {
        const hook = getHook(), a = hook && hook.jogo && hook.jogo.ash;
        if (a) releaseWalk(a);
        S.cur = null; S.status = 'Off'; S.tone = 'idle'; clearTrip();
      }
      emit();
    }

    function tick() {
      const hook = getHook();
      S.hooked = !!hook;
      if (!hook) {
        S.list = [];
        S.status = IN_BROWSER && window.__pfPatch && window.__pfPatch.ok === false
          ? 'Hook failed — game updated?' : 'Waiting for the game…';
        S.tone = 'warn';
        return;
      }
      const J = hook.jogo;
      if (!J || !J.ativo || !J.ash || !J.pika) { S.list = []; S.status = 'Waiting for the game…'; S.tone = 'warn'; return; }

      const now = clock(), a = J.ash, p = J.pika;
      S.list = scan(J, hook, now);
      if (!S.enabled) { S.status = 'Off'; S.tone = 'idle'; return; }

      if (S.trip) { runTrip(J, hook, a, now); return; }

      const busy = hook.busy();
      if (busy) { releaseWalk(a); S.cur = null; S.status = 'Paused — ' + busy; S.tone = 'warn'; return; }
      try { potionStep(hook, p, now); } catch (e) {}

      if (S.sw && S.sw.from !== p) { S.sw = null; S.swaps++; S.cur = null; S.prog = null; S.faintAt = null; }

      const hpPct = p.maxHp > 0 ? (p.hp / p.maxHp) * 100 : 100;
      const fainted = !(p.hp > 0) || p.desmaiado > 0;
      const lowHp = cfg.minHp > 0 && hpPct < cfg.minHp;
      const noPP = hook.semPP(p) || !hasDamagingPP(hook, p);
      if (fainted || lowHp || noPP) {
        const why = fainted ? 'fainted' : lowHp ? 'HP ' + Math.round(hpPct) + '% (limit ' + cfg.minHp + '%)' : 'out of PP';
        if (!cfg.autoSwitch && !cfg.autoHeal) return stop(a, 'partner ' + why);
        if (fainted) {
          if (S.faintAt == null) S.faintAt = now;
          if (now - S.faintAt < TUNE.faintWait) { releaseWalk(a); S.cur = null; S.status = 'Partner fainted — waiting for the next one'; S.tone = 'warn'; return; }
        }
        let r;
        if (cfg.autoSwitch) {
          r = trySwitch(J, hook, p, now, why);
          if (r.pending) { S.status = r.pending; S.tone = 'warn'; return; }
        } else {
          r = pickReplacement(hook);
          if (!r.fail) r = { fail: 'a healthy teammate is available (auto-swap is off)' };
        }
        if (cfg.autoHeal && r.spent) return startHealTrip(J, hook, a, why);
        return stop(a, 'partner ' + why + ' — ' + r.fail);
      }
      S.faintAt = null;

      if (S.cur && !S.list.some((c) => c.s === S.cur && !c.skip)) {
        const s = S.cur;
        if (S.fired.has(s) && (s.estado === 'desmaiado' || s.estado === 'morto' || !(s.hp > 0))) S.kills++;
        S.cur = null;
      }

      if (captureStep(J, hook, a, now)) return;

      const cands = S.list.filter((c) => !c.skip);
      const t = chooseTarget(cands, hook, a, now);
      if (!t) { releaseWalk(a); S.cur = null; S.status = cands.length ? 'Everything nearby is blocked' : 'No wild Pokémon in range'; S.tone = 'idle'; return; }

      if (t.s !== S.cur) {
        S.cur = t.s; S.ranged = false; S.prog = { best: t.dist, t: now }; resetNudge();
        J.alvo = t.s; J.alvoVisto = t.s; J.alvoDesde = now;
      } else if (J.alvo !== t.s) {
        J.alvo = t.s;
      }

      const pr = S.prog;
      if (t.dist <= TUNE.engage) { pr.best = t.dist; pr.t = now; S.ranged = false; }
      else if (t.dist < pr.best - 0.25) { pr.best = t.dist; pr.t = now; S.pinSince = 0; }

      let mode = 'direct';
      if (cfg.walkToTargets) {
        if (S.stationaryMode) { S.ranged = false; S.stationaryMode = false; }
        if (!S.ranged && t.dist > TUNE.engage && canRoute(hook)) {
        mode = routeStep(hook, a, t, now);
        if (mode === 'fail') {
          resetNudge(); S.black.set(t.s, now + TUNE.blacklistMs); S.cur = null; releaseWalk(a);
          S.status = 'No way to reach ' + t.name + ' — skipping'; S.tone = 'warn'; return;
        }
        if (mode === 'planning') { releaseWalk(a); pr.t = now; S.status = 'Finding a way to ' + t.name + '…'; S.tone = 'warn'; return; }
        if (mode === 'path') pr.t = now;
      } else if (S.plan || S.path) { S.plan = null; S.path = null; }
      if (S.nudge) {
        const n = S.nudge, moved = Math.hypot(a.x - n.from.x, a.z - n.from.z);
        if (Math.hypot(n.x - a.x, n.z - a.z) <= 0.5 || now >= n.until) {
          S.nudge = null; releaseWalk(a);
          if (moved >= 0.8) { S.nudgeTried.clear(); S.nudgePass = 0; S.pin = { x: a.x, z: a.z, t: now }; }
          else S.pin = { x: a.x, z: a.z, t: now - TUNE.pinnedMs };
        } else {
          a.alvoX = n.x; a.alvoZ = n.z; S.walking = true; pr.t = now;
          S.status = 'Stuck — stepping out…'; S.tone = 'warn'; return;
        }
      }
      if (!S.nudge && !S.ranged && t.dist > TUNE.engage && S.walking) {
        if (!S.pin || Math.hypot(a.x - S.pin.x, a.z - S.pin.z) > TUNE.pinMove) S.pin = { x: a.x, z: a.z, t: now };
        else if (now - S.pin.t > TUNE.pinnedMs) {
          if (S.path) {
            const wx = a.alvoX, wz = a.alvoZ;
            if (typeof wx === 'number' && S.fc) {
              const d = Math.hypot(wx - a.x, wz - a.z) || 1, k = gkey(a.x + ((wx - a.x) / d) * 0.6, a.z + ((wz - a.z) / d) * 0.6);
              S.fc.bad.add(k); S.fc.m.set(k, false);
            }
            S.path = null; S.pin = null; releaseWalk(a);
            if (++S.replans > TUNE.maxReplans) {
              resetNudge(); S.black.set(t.s, now + TUNE.blacklistMs); S.cur = null;
              S.status = 'Pinned — skipping ' + t.name; S.tone = 'warn'; return;
            }
            startPlan(hook, a, t, now); pr.t = now;
            S.status = 'Re-planning the route…'; S.tone = 'warn'; return;
          }
          if (!S.pinSince) S.pinSince = now;
          const patient = now - S.pinSince <= TUNE.pinGiveUpMs;
          let n = patient ? pickNudge(hook, a, t) : null;
          if (!n && patient && S.nudgePass === 0) { S.nudgePass = 1; S.nudgeTried.clear(); n = pickNudge(hook, a, t); }
          if (n) {
            S.nudgeTried.add(n.i);
            S.nudge = { x: n.x, z: n.z, until: now + TUNE.nudgeMs, from: { x: a.x, z: a.z } };
            a.alvoX = n.x; a.alvoZ = n.z; S.walking = true; pr.t = now;
            S.status = 'Stuck — stepping out…'; S.tone = 'warn'; return;
          }
          resetNudge();
          S.black.set(t.s, now + TUNE.blacklistMs); S.cur = null; releaseWalk(a);
          S.status = 'Pinned — skipping ' + t.name; S.tone = 'warn'; return;
        }
      } else if (!S.nudge) S.pin = null;

      if (mode === 'direct' && now - pr.t > TUNE.stuckMs && t.dist > TUNE.engage && !S.ranged) {
        if (t.dist <= TUNE.rangedMax) { S.ranged = true; releaseWalk(a); }
        else { S.black.set(t.s, now + TUNE.blacklistMs); S.cur = null; releaseWalk(a); S.status = 'Can’t reach ' + t.name + ' — skipping'; S.tone = 'warn'; return; }
      }

      if (mode !== 'path' && !S.ranged && t.dist > TUNE.stand) { a.alvoX = t.s.x; a.alvoZ = t.s.z; S.walking = true; }

      } else {
        S.plan = null;
        S.path = null;
        S.nudge = null;
        S.pin = null;
        S.pinSince = 0;
        S.replans = 0;
        releaseWalk(a);
        S.ranged = t.dist <= TUNE.rangedMax;
        S.stationaryMode = true;
      }

      const engaged = t.dist <= TUNE.engage || S.ranged;
      let waiting = false;
      if (engaged) {
        if (!J.ordem && now - S.lastFire >= TUNE.fireGap) {
          const mv = pickMove(hook, p);
          if (mv) {
            hook.usarGolpe(mv.id);
            S.lastFire = now;
            if (J.ordem && J.ordem.alvo === t.s) { S.fired.add(t.s); S.nextSlot = (mv.slot + 1) % 4; S.lastSlot = mv.slot; S.shots++; }
          } else waiting = true;
        }
      }
      S.tone = 'ok';
      const where = t.dist.toFixed(1) + ' m';
      S.status = engaged
        ? (waiting ? 'Attacking ' + t.name + ' — moves cooling down' : 'Attacking ' + t.name + (S.ranged ? ' (from range)' : ''))
        : (!cfg.walkToTargets ? 'Standing still — waiting for ' + t.name + ' · ' + where : (mode === 'path' ? 'Going around to ' : 'Walking to ') + t.name + ' · ' + where);
    }

    function catchMatches(s) {
      if (s.shiny) return true;
      if (!S.fired.has(s)) return false;
      if (cfg.catchAll) return true;
      if (!cfg.catchSpecific) return false;
      const wanted = String(cfg.catchNames || '').split(/[,;\n]+/).map((x) => x.trim().toLocaleLowerCase()).filter(Boolean);
      if (!wanted.length) return false;
      const name = String(s.nome || (s.especie && s.especie.nome) || '').trim().toLocaleLowerCase();
      return wanted.includes(name);
    }

    function captureIdentity(s) { return [s.id ?? '', s.dex ?? '', s.lv ?? '', s.shiny ? 1 : 0, Math.round(s.x * 10), Math.round(s.z * 10)].join('|'); }

    function captureStep(J, hook, a, now) {
      if (S.captureInFlight) {
        if (S.captureInFlight.emVoo || S.captureInFlight.estado === 'capturando') return true;
        S.captureInFlight = null;
      }
      if (now < S.captureRetryAt) return false;
      const ready = (J.selvagens || []).filter((s) => {
        if (!s || s.estado !== 'desmaiado' || !(s.hp <= 0) || s.naBola || s.emVoo || s.emTurno || s.torneio || s.safari || s.perfil === 'treinado') return false;
        if (s.raid || s.chefe || S.captureTried.get(s) === captureIdentity(s) || !catchMatches(s)) return false;
        return Math.hypot(s.x - a.x, s.z - a.z) <= TUNE.captureRange;
      }).sort((x, y) => Number(!!y.shiny) - Number(!!x.shiny) || Math.hypot(x.x - a.x, x.z - a.z) - Math.hypot(y.x - a.x, y.z - a.z));

      for (const s of ready) {
        const result = hook.capturar ? hook.capturar(s) : null;
        S.captureRetryAt = now + TUNE.captureGap;
        if (result && result.started) {
          S.captureTried.set(s, captureIdentity(s));
          S.captureInFlight = s;
          S.status = 'Throwing a Poké Ball at ' + (s.nome || 'the Pokémon') + (s.shiny ? ' ✨' : '') + '…';
          S.tone = 'ok';
          return true;
        }
        if (result && result.reason === 'no-balls' && now - S.lastNoBallsNotice > 8000) {
          S.lastNoBallsNotice = now;
          S.status = 'No regular Poké Balls available — shiny/catch attempts are waiting for balls';
          S.tone = 'warn';
        }
        return false;
      }
      return false;
    }

    function lowPP(hook, p) {
      for (let i = 0; i < 4; i++) {
        const id = hook.golpeDaBarra(i);
        if (!id || !isDamaging(hook.golpe(id))) continue;
        const m = (p.movs || []).find((x) => x && x.id === id);
        if (m && m.ppMax > 0 && m.pp != null && m.pp <= Math.max(1, Math.floor(m.ppMax * TUNE.potionPp))) return true;
      }
      return false;
    }
    function useSlot(hook, idx, now) {
      if (now - S.potT[idx] < TUNE.potionGap) return;
      const key = 5 + idx, it = hook.slot(idx);
      if (!it) { S.potion[idx] = 'Hotbar slot ' + (idx + 1) + ' (key ' + key + ') has no potion in it'; return; }
      if (!(it.n > 0)) { S.potion[idx] = 'Out of ' + it.nome; S.potT[idx] = now + 5000; return; }
      S.potT[idx] = now; S.potUsed[idx]++;
      S.potion[idx] = 'Used ' + it.nome + ' (' + (it.n - 1) + ' left)';
      hook.atalho(idx);
    }
    function potionStep(hook, p, now) {
      if (!hook.slot || !hook.atalho || !(p.hp > 0) || !(p.maxHp > 0)) return;
      const hpPct = (p.hp / p.maxHp) * 100;
      if (cfg.potionHP && cfg.potionHp > 0 && hpPct < cfg.potionHp) useSlot(hook, 0, now);
      if (cfg.potionPP && lowPP(hook, p)) useSlot(hook, 1, now);
    }

    function snapshot() {
      const hook = getHook();
      const J = hook && hook.jogo;
      let moves = [], partner = null;
      try {
        const p = J && J.pika;
        if (p) {
          partner = { name: p.nome, lv: p.lv, hp: p.hp, maxHp: p.maxHp };
          for (let i = 0; i < 4; i++) {
            const id = hook.golpeDaBarra(i);
            if (!id) { moves.push(null); continue; }
            const g = hook.golpe(id) || {};
            const m = (p.movs || []).find((x) => x && x.id === id) || {};
            moves.push({ slot: i, id, name: g.nome || id, cd: (p.recargas && p.recargas[id]) || 0, cdMax: g.recarga || 0, pp: m.pp, ppMax: m.ppMax, status: g.cat === 'status' && !(g.poder > 0) });
          }
        }
      } catch (e) { moves = []; }
      const target = S.cur ? S.list.find((c) => c.s === S.cur) || null : null;
      return {
        hooked: S.hooked, enabled: S.enabled, status: S.status, tone: S.tone, notice: S.notice,
        target, list: S.list, moves, partner, kills: S.kills, shots: S.shots, swaps: S.swaps, heals: S.heals, trip: S.trip ? S.trip.phase : null, lastSlot: S.lastSlot, ranged: S.ranged, potion: S.potion, potUsed: S.potUsed,
      };
    }

    return { S, tick, setEnabled, snapshot };
  }

  const LS_KEY = 'pfAutoHunt.v1';
  const DEFAULTS = { maxDist: 60, walkToTargets: false, catchAll: false, catchSpecific: false, catchNames: '', minHp: 30, potionHp: 75, autoSwitch: true, autoHeal: false, potionHP: false, potionPP: false, shinySiren: false, collapsed: false, settings: false, x: null, y: null };

  function loadCfg() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function saveCfg(cfg) { try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) {  } }

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const CSS = `
:host{all:initial}
*{box-sizing:border-box}
.p{position:fixed;z-index:2147483000;width:min(900px,calc(100vw - 32px));max-height:calc(100dvh - 24px);font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#dfe8ff;
  background:rgba(11,17,31,.95);border:1px solid #2b3855;border-radius:14px;box-shadow:0 14px 36px rgba(0,0,0,.55);user-select:none;overflow:auto;overscroll-behavior:contain}
.hd{display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(#1a2540,#121b31);cursor:grab;border-bottom:1px solid #26324e}
.hd:active{cursor:grabbing}
.hd b{font-size:15px;letter-spacing:.02em}
.grow{flex:1}
.dot{width:9px;height:9px;border-radius:50%;background:#e45670;box-shadow:0 0 0 2px rgba(228,86,112,.2)}
.dot.on{background:#5fd18a;box-shadow:0 0 0 2px rgba(95,209,138,.2)}
.ib{all:unset;cursor:pointer;width:28px;height:28px;display:grid;place-items:center;border-radius:6px;color:#9fb0d6;font-size:16px}
.ib:hover{background:#26345a;color:#fff}
.bd{padding:14px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px;align-items:start}
.c1,.c2{display:flex;flex-direction:column;gap:9px;min-width:0}
.c1{border-right:1px solid #1d2842;padding-right:12px}
.cfg,.ft{grid-column:1/-1}
.fold .bd,.fold .ib[data-a=cfg]{display:none}
.tg{display:flex;align-items:center;gap:10px}
.sw{all:unset;cursor:pointer;position:relative;flex:none;width:50px;height:28px;border-radius:13px;background:#2a3452;transition:background .15s}
.sw i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#aab6d6;transition:transform .15s,background .15s}
.sw[aria-checked=true]{background:#2f8f5b}
.sw[aria-checked=true] i{transform:translateX(22px);background:#fff}
.sw:focus-visible{outline:2px solid #f4aa35;outline-offset:2px}
.sw.sm{width:42px;height:24px;border-radius:12px}
.sw.sm i{top:3px;left:3px;width:18px;height:18px}
.sw.sm[aria-checked=true] i{transform:translateX(18px)}
.sub{font-size:11.5px;color:#8795b8;line-height:1.3}
.tt{font-weight:600;font-size:14px}
.st{font-size:12.5px;color:#8795b8;min-height:16px}
.st.ok{color:#7fe0a8}.st.warn{color:#f4c46a}.st.err{color:#ff8a8a}
.sec{display:flex;flex-direction:column;gap:5px}
.lb{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#6f7fa6;display:flex;justify-content:space-between;gap:8px}
.lb .pn{text-transform:none;letter-spacing:0;color:#9fb0d6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgt{background:#101828;border:1px solid #232f4a;border-radius:9px;padding:9px 10px;min-height:48px}
.tgt .r{display:flex;justify-content:space-between;gap:8px}
.tgt .n{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgt .d{color:#9fb0d6;white-space:nowrap}
.tgt .none{color:#6f7fa6}
.bar{height:6px;border-radius:3px;background:#1d2740;margin-top:6px;overflow:hidden}
.bar b{display:block;height:100%;background:#5fd18a;transition:width .2s}
.mv{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.m{position:relative;overflow:hidden;background:#101828;border:1px solid #232f4a;border-radius:8px;padding:7px 9px;min-height:44px}
.m.empty{opacity:.35}
.m.last{border-color:#f4aa35}
.m .f{position:absolute;inset:0 auto 0 0;background:rgba(244,170,53,.22);transition:width .1s linear}
.m .t{position:relative;display:flex;gap:6px;align-items:baseline}
.m .k{color:#f4aa35;font-weight:700;font-size:11px}
.m .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.m .pp{position:relative;color:#8795b8;font-size:10.5px;margin-top:1px}
.m.nopp .pp{color:#ff8a8a}
.ls{max-height:210px;overflow:auto;border:1px solid #232f4a;border-radius:8px;background:#0e1524}
.row{display:grid;grid-template-columns:1fr auto auto;gap:9px;align-items:center;padding:6px 10px;border-bottom:1px solid #18233b}
.row:last-child{border-bottom:0}
.row.cur{background:rgba(244,170,53,.12)}
.row.dim{opacity:.45}
.row .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .lv{color:#9fb0d6;font-size:11px}
.row .ds{color:#9fb0d6;font-size:11px;min-width:42px;text-align:right}
.row .why{grid-column:1/-1;color:#8795b8;font-size:10px;margin-top:-2px}
.ls .e{padding:10px;color:#6f7fa6;text-align:center}
.cfg{display:none;flex-direction:column;gap:8px;border-top:1px dashed #26324e;padding-top:8px}
.show-cfg .cfg{display:flex}
.cfg label{display:flex;flex-direction:column;gap:3px;color:#aab6d6}
.cfg label span{display:flex;justify-content:space-between}
.cfg input[type=range]{width:100%;accent-color:#f4aa35}
.cfg .ck{flex-direction:row;align-items:center;gap:8px}
.cfg .ck input{accent-color:#f4aa35}
.catchnames{width:100%;min-width:0;padding:6px 8px;border:1px solid #2b3855;border-radius:6px;background:#0e1524;color:#dfe8ff;font:11px system-ui,sans-serif;outline:none}
.catchnames:focus{border-color:#f4aa35}
.ft{display:flex;justify-content:space-between;color:#6f7fa6;font-size:11.5px}
@media (min-width:1200px){
  .p{width:min(940px,calc(100vw - 40px));font-size:14.5px}
  .bd{grid-template-columns:250px minmax(0,1fr);padding:15px;gap:18px}
  .c1,.c2{gap:12px}
  .tt{font-size:14.5px}
  .m{min-height:46px}
}
@media (max-width:900px){
  .p{width:calc(100vw - 20px);font-size:13px}
  .bd{grid-template-columns:220px minmax(0,1fr);padding:10px;gap:11px}
  .c1{padding-right:10px}
}
@media (max-width:700px){
  .p{width:calc(100vw - 12px);max-height:calc(100dvh - 12px);font-size:12px;border-radius:10px;}
  .hd{position:sticky;top:0;z-index:5;padding:7px 9px;touch-action:none;}
  .hd b{font-size:clamp(9px,3vw,13px);letter-spacing:0;white-space:nowrap}
  .ib{width:28px;height:28px;font-size:15px}
  .bd{grid-template-columns:1fr;padding:8px;gap:9px}
  .c1{border-right:0;padding-right:0}
  .c1,.c2{gap:8px}
  .tt{font-size:12.5px}
  .st{font-size:11px}
  .sub{font-size:10.5px}
  .tgt{padding:7px 8px;min-height:42px}
  .m{padding:6px 7px;min-height:40px}
  .ls{max-height:min(26vh,176px)}
}
@media (max-width:380px){
  .p{width:calc(100vw - 8px);max-height:calc(100dvh - 8px);font-size:11.5px}
  .hd{gap:6px;padding:6px 8px}
  .bd{padding:7px;gap:7px}
  .tg{gap:7px}
  .sw{width:46px;height:26px}
  .sw i{width:20px;height:20px}
  .sw[aria-checked=true] i{transform:translateX(20px)}
  .sw.sm{width:38px;height:22px}
  .sw.sm i{width:16px;height:16px}
  .sw.sm[aria-checked=true] i{transform:translateX(16px)}
  .ls{max-height:min(23vh,145px)}
}
@media (max-width:900px) and (max-height:520px){
  .p{max-height:calc(100dvh - 8px)}
  .ls{max-height:110px}
}
`;

  function mountUI(hunter, cfg) {
    const host = document.createElement('div');
    host.id = 'pf-autohunt';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="p">' +
      '<div class="hd"><span class="dot"></span><b>PokeFable AutoFarm, by: SorrowHeart</b><span class="grow"></span>' +
      '<button class="ib" data-a="cfg" title="Settings">⚙</button><button class="ib" data-a="fold" title="Collapse">–</button></div>' +
      '<div class="bd">' +
      '<div class="c1">' +
      '<div class="tg"><button class="sw" role="switch" aria-checked="false"><i></i></button>' +
      '<div><div class="tt">Hunt nearest wild</div><div class="st">Off</div></div></div>' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-walk><i></i></button>' +
      '<div><div class="tt">Walk to targets</div><div class="sub walksub">Off</div></div></div>' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-catchall><i></i></button>' +
      '<div><div class="tt">Catch everything</div></div></div>' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-catchspecific><i></i></button>' +
      '<div><div class="tt">Catch specific</div></div></div>' +
      '<input class="catchnames" type="text" data-catchnames placeholder="Names separated by commas">' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-heal><i></i></button>' +
      '<div><div class="tt">Auto Heal</div></div></div>' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-phot><i></i></button>' +
      '<div><div class="tt">Use Healing Potion</div><div class="sub phs">Slot 1 (key 5) · threshold set in Settings</div></div></div>' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-ppot><i></i></button>' +
      '<div><div class="tt">Use PP Potion</div><div class="sub pps">Slot 2 (key 6) · move low on PP</div></div></div>' +
      '<div class="tg"><button class="sw sm" role="switch" aria-checked="false" data-siren><i></i></button>' +
      '<div><div class="tt">Shiny siren <button class="ib" data-test title="Test the alert" style="width:auto;padding:0 6px;font-size:11px;display:inline-grid">test</button></div></div></div>' +
      '</div>' +
      '<div class="c2">' +
      '<div class="sec"><div class="lb"><span>Target</span></div><div class="tgt"></div></div>' +
      '<div class="sec"><div class="lb"><span>Your moves</span><span class="pn"></span></div><div class="mv"></div></div>' +
      '<div class="sec"><div class="lb"><span>Wild nearby</span><span class="cnt"></span></div><div class="ls"></div></div>' +
      '</div>' +
      '<div class="cfg">' +
      '<label><span>Max distance <b class="v1"></b></span><input type="range" min="10" max="130" step="5" data-k="maxDist"></label>' +
      '<label class="ck"><input type="checkbox" data-k="autoSwitch"> Swap partner when HP is low or out of PP</label>' +
      '<label><span>Swap out / stop below <b class="v2"></b> HP</span><input type="range" min="0" max="90" step="5" data-k="minHp"></label>' +
      '<label><span>Use healing potion below <b class="v3"></b> HP</span><input type="range" min="0" max="100" step="5" data-k="potionHp"></label>' +
      '</div>' +
      '<div class="ft"><span class="kp"></span><span>Alt+H toggles</span></div>' +
      '</div></div>';

    const $ = (s) => root.querySelector(s);
    const panel = $('.p'), sw = $('.sw'), st = $('.st'), dot = $('.dot'), tgt = $('.tgt'), mv = $('.mv'), ls = $('.ls'), cnt = $('.cnt'), kp = $('.kp'), pn = $('.pn');

    for (const ev of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'touchstart', 'touchend', 'contextmenu']) {
      host.addEventListener(ev, (e) => e.stopPropagation());
    }

    function place() {
      const w = panel.offsetWidth || 680, h = panel.offsetHeight || 40;
      let x = cfg.x, y = cfg.y;
      if (x == null || y == null) { x = 12; y = Math.max(12, Math.round(innerHeight * 0.18)); }
      x = Math.min(Math.max(0, x), Math.max(0, innerWidth - w)); y = Math.min(Math.max(0, y), Math.max(0, innerHeight - h));
      panel.style.left = x + 'px'; panel.style.top = y + 'px';
    }
    const hd = $('.hd');
    hd.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.ib')) return;
      const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, id = e.pointerId;
      try { hd.setPointerCapture(id); } catch (err) {  }
      const move = (m) => {
        if (m.pointerId !== id) return;
        if (m.buttons === 0) return end(m);
        cfg.x = m.clientX - dx; cfg.y = m.clientY - dy; place();
      };
      function end(m) {
        if (m && m.pointerId !== id) return;
        hd.removeEventListener('pointermove', move);
        hd.removeEventListener('pointerup', end);
        hd.removeEventListener('pointercancel', end);
        hd.removeEventListener('lostpointercapture', end);
        try { hd.releasePointerCapture(id); } catch (err) {  }
        saveCfg(cfg);
      }
      hd.addEventListener('pointermove', move);
      hd.addEventListener('pointerup', end);
      hd.addEventListener('pointercancel', end);
      hd.addEventListener('lostpointercapture', end);
      e.preventDefault();
    });
    addEventListener('resize', place);

    function applyFlags() {
      panel.classList.toggle('fold', !!cfg.collapsed);
      panel.classList.toggle('show-cfg', !!cfg.settings && !cfg.collapsed);
      $('[data-a=fold]').textContent = cfg.collapsed ? '+' : '–';
      place();
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'fold') cfg.collapsed = !cfg.collapsed;
      if (b.dataset.a === 'cfg') cfg.settings = !cfg.settings;
      saveCfg(cfg); applyFlags();
    });

    const toggle = () => hunter.setEnabled(!hunter.S.enabled);
    sw.addEventListener('click', () => { toggle(); sw.blur(); render(); });
    const walkSw = $('[data-walk]'), walkSub = $('.walksub');
    walkSw.addEventListener('click', () => { cfg.walkToTargets = !cfg.walkToTargets; saveCfg(cfg); walkSw.blur(); render(); });
    const catchAllSw = $('[data-catchall]'), catchSpecificSw = $('[data-catchspecific]'), catchNamesInput = $('[data-catchnames]');
    catchAllSw.addEventListener('click', () => { cfg.catchAll = !cfg.catchAll; saveCfg(cfg); catchAllSw.blur(); render(); });
    catchSpecificSw.addEventListener('click', () => { cfg.catchSpecific = !cfg.catchSpecific; saveCfg(cfg); catchSpecificSw.blur(); render(); });
    catchNamesInput.value = cfg.catchNames || '';
    catchNamesInput.addEventListener('input', () => { cfg.catchNames = catchNamesInput.value; saveCfg(cfg); });
    catchNamesInput.addEventListener('change', () => catchNamesInput.blur());
    const healSw = $('[data-heal]');
    healSw.addEventListener('click', () => { cfg.autoHeal = !cfg.autoHeal; saveCfg(cfg); healSw.blur(); render(); });
    const photSw = $('[data-phot]'), ppotSw = $('[data-ppot]'), phs = $('.phs'), pps = $('.pps');
    photSw.addEventListener('click', () => { cfg.potionHP = !cfg.potionHP; saveCfg(cfg); photSw.blur(); render(); });
    ppotSw.addEventListener('click', () => { cfg.potionPP = !cfg.potionPP; saveCfg(cfg); ppotSw.blur(); render(); });
    const sirenSw = $('[data-siren]');
    sirenSw.addEventListener('click', () => { cfg.shinySiren = !cfg.shinySiren; saveCfg(cfg); if (cfg.shinySiren) sirenCtx(); else if (SH.stop) SH.stop(); sirenSw.blur(); render(); });
    $('[data-test]').addEventListener('click', (e) => { e.stopPropagation(); shinyAlert('Pidgey (test)', 'test'); e.target.blur(); });
    addEventListener('keydown', (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyH' && !e.repeat) { e.preventDefault(); toggle(); render(); }
    }, true);
    hunter.S.onChange = () => render();

    function syncSettings() {
      for (const el of root.querySelectorAll('[data-k]')) {
        const k = el.dataset.k;
        if (el.type === 'checkbox') el.checked = !!cfg[k]; else el.value = cfg[k];
      }
      $('.v1').textContent = cfg.maxDist + ' m';
      $('.v2').textContent = cfg.minHp ? cfg.minHp + '%' : 'never (0%)';
      $('.v3').textContent = cfg.potionHp ? cfg.potionHp + '%' : 'never (0%)';
    }
    for (const el of root.querySelectorAll('[data-k]')) {
      el.addEventListener('input', () => {
        cfg[el.dataset.k] = el.type === 'checkbox' ? el.checked : +el.value;
        saveCfg(cfg); syncSettings(); render();
      });
      el.addEventListener('change', () => el.blur());
      el.addEventListener('pointerup', () => setTimeout(() => el.blur(), 0));
    }

    const hpColor = (r) => (r > 0.5 ? '#5fd18a' : r > 0.2 ? '#f4aa35' : '#ff5f5f');
    const tag = (c) => (c.shiny ? '✨ ' : '') + (c.perfil === 'agressivo' ? '⚔ ' : c.perfil === 'arisco' ? '🏃 ' : '');

    function render() {
      const v = hunter.snapshot();
      dot.classList.toggle('on', v.hooked);
      dot.title = v.hooked ? 'Connected to the game' : 'Not connected to the game yet';
      sw.setAttribute('aria-checked', String(v.enabled));
      walkSw.setAttribute('aria-checked', String(!!cfg.walkToTargets));
      walkSub.textContent = cfg.walkToTargets ? 'On' : 'Off';
      catchAllSw.setAttribute('aria-checked', String(!!cfg.catchAll));
      catchSpecificSw.setAttribute('aria-checked', String(!!cfg.catchSpecific));
      healSw.setAttribute('aria-checked', String(!!cfg.autoHeal));
      sirenSw.setAttribute('aria-checked', String(!!cfg.shinySiren));
      photSw.setAttribute('aria-checked', String(!!cfg.potionHP));
      ppotSw.setAttribute('aria-checked', String(!!cfg.potionPP));
      phs.textContent = (v.potion && v.potion[0]) || (cfg.potionHp > 0 ? 'Slot 1 (key 5) · below ' + cfg.potionHp + '% HP' : 'Slot 1 (key 5) · threshold disabled');
      pps.textContent = (v.potion && v.potion[1]) || 'Slot 2 (key 6) · move low on PP';
      st.className = 'st ' + (v.tone || '');
      st.textContent = v.status;

      if (v.target) {
        const t = v.target, r = t.maxHp > 0 ? Math.max(0, Math.min(1, t.hp / t.maxHp)) : 0;
        tgt.innerHTML =
          '<div class="r"><span class="n">' + esc(tag(t) + t.name) + ' <span class="d">Lv ' + esc(t.lv) + '</span></span><span class="d">' + t.dist.toFixed(1) + ' m</span></div>' +
          '<div class="bar"><b style="width:' + (r * 100).toFixed(0) + '%;background:' + hpColor(r) + '"></b></div>';
      } else {
        tgt.innerHTML = '<div class="none">' + (v.enabled ? 'Looking for a wild Pokémon…' : 'Turn the switch on to start.') + '</div>';
      }

      const slots = v.moves.length ? v.moves : [null, null, null, null];
      mv.innerHTML = slots.map((m, i) => {
        if (!m) return '<div class="m empty"><div class="t"><span class="k">' + (i + 1) + '</span><span class="nm">—</span></div></div>';
        const f = m.cd > 0 && m.cdMax > 0 ? Math.min(100, (m.cd / m.cdMax) * 100) : 0;
        const nopp = m.pp != null && m.pp <= 0;
        const sub = m.status ? 'status (not used)' : (m.cd > 0 ? m.cd.toFixed(1) + ' s' : 'ready') + (m.pp != null ? ' · PP ' + m.pp + (m.ppMax != null ? '/' + m.ppMax : '') : '');
        return '<div class="m' + (i === v.lastSlot ? ' last' : '') + (nopp ? ' nopp' : '') + '"><div class="f" style="width:' + f + '%"></div>' +
          '<div class="t"><span class="k">' + (i + 1) + '</span><span class="nm">' + esc(m.name) + '</span></div><div class="pp">' + esc(sub) + '</div></div>';
      }).join('');

      const total = v.list.length, ok = v.list.filter((c) => !c.skip).length;
      cnt.textContent = total ? ok + ' huntable · ' + total + ' seen' : '';
      if (!total) ls.innerHTML = '<div class="e">' + (v.hooked ? 'No wild Pokémon around.' : 'Waiting for the game…') + '</div>';
      else ls.innerHTML = v.list.slice(0, 14).map((c) =>
        '<div class="row' + (v.target && c.s === v.target.s ? ' cur' : '') + (c.skip ? ' dim' : '') + '">' +
        '<span class="nm">' + esc(tag(c) + c.name) + '</span><span class="lv">Lv ' + esc(c.lv) + '</span><span class="ds">' + c.dist.toFixed(1) + ' m</span>' +
        (c.skip ? '<span class="why">skipped: ' + esc(c.skip) + '</span>' : '') + '</div>').join('');

      pn.textContent = v.partner ? v.partner.name + ' Lv ' + v.partner.lv + ' · ' + (v.partner.maxHp > 0 ? Math.round(Math.max(0, v.partner.hp) / v.partner.maxHp * 100) : 0) + '% HP' : '';
      kp.textContent = v.kills + ' down · ' + v.shots + ' moves used' + (v.swaps ? ' · ' + v.swaps + ' swap' + (v.swaps > 1 ? 's' : '') : '') + (v.heals ? ' · ' + v.heals + ' heal' + (v.heals > 1 ? 's' : '') : '');
    }

    document.documentElement.appendChild(host);
    syncSettings(); applyFlags(); render();
    setInterval(render, 250);
    return { render };
  }

  const SH = { sig: new WeakMap(), fromServer: new Map(), fromBody: new Map(), area: null, roster: null, generation: null, scanAfter: 0, cfg: null, ac: null, stop: null, banner: null, hideT: 0 };

  function sirenCtx() {
    try {
      if (!SH.ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) SH.ac = new AC(); }
      if (SH.ac && SH.ac.state === 'suspended') SH.ac.resume().catch(() => {});
    } catch (e) {  }
    return SH.ac;
  }

  function playSiren(seconds) {
    const ac = sirenCtx(); if (!ac) return;
    try { if (SH.stop) SH.stop(); } catch (e) {  }
    const dur = seconds || 12, t0 = ac.currentTime + 0.03, cyc = 4, lo = 380, hi = 760;
    const master = ac.createGain(); master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(0.5, t0 + 0.4);
    master.gain.setValueAtTime(0.5, t0 + dur - 0.8);
    master.gain.linearRampToValueAtTime(0, t0 + dur);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    const swell = ac.createGain(); swell.gain.value = 0.8;
    const lfo = ac.createOscillator(), lfoG = ac.createGain();
    lfo.frequency.value = 1 / cyc; lfoG.gain.value = 0.2; lfo.connect(lfoG); lfoG.connect(swell.gain);
    master.connect(lp); lp.connect(swell); swell.connect(ac.destination);
    const oscs = [];
    for (const [type, mult, vol] of [['sawtooth', 1, 0.55], ['square', 1.005, 0.25], ['sawtooth', 2, 0.18]]) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; g.gain.value = vol;
      o.frequency.setValueAtTime(lo * mult, t0);
      for (let c = 0; c * cyc < dur; c++) {
        o.frequency.linearRampToValueAtTime(hi * mult, t0 + c * cyc + cyc / 2);
        o.frequency.linearRampToValueAtTime(lo * mult, t0 + (c + 1) * cyc);
      }
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.1); oscs.push(o);
    }
    lfo.start(t0); lfo.stop(t0 + dur + 0.1);
    SH.stop = () => { try { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0, ac.currentTime, 0.05); oscs.forEach((o) => o.stop(ac.currentTime + 0.3)); lfo.stop(ac.currentTime + 0.3); } catch (e) {  } SH.stop = null; };
  }

  function showShinyBanner(name) {
    if (!IN_BROWSER) return;
    if (!SH.banner) {
      const host = document.createElement('div'); host.id = 'pf-shiny-banner';
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' +
        ':host{all:initial}' +
        '.b{position:fixed;z-index:2147483001;left:50%;top:14%;transform:translate(-50%,-20px) scale(.96);opacity:0;pointer-events:none;' +
        'padding:14px 28px;border-radius:14px;font:800 clamp(18px,3.4vw,30px)/1.15 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;' +
        'color:#2a1c00;background:linear-gradient(135deg,#fff3b0,#ffd23f 45%,#ffb300);border:3px solid #fff;box-shadow:0 0 0 3px #b77900,0 10px 40px rgba(255,190,0,.65);' +
        'text-shadow:0 1px 0 rgba(255,255,255,.6);transition:opacity .25s,transform .25s;max-width:92vw}' +
        '.b.on{opacity:1;transform:translate(-50%,0) scale(1);animation:pulse 1s ease-in-out infinite}' +
        '@keyframes pulse{50%{box-shadow:0 0 0 3px #b77900,0 10px 56px rgba(255,210,63,.95)}}' +
        '@media (prefers-reduced-motion:reduce){.b.on{animation:none}}' +
        '</style><div class="b" role="alert" aria-live="assertive"></div>';
      document.documentElement.appendChild(host);
      SH.banner = root.querySelector('.b');
    }
    SH.banner.textContent = '✨ Shiny ' + name + ' Appeared ✨';
    SH.banner.classList.add('on');
    clearTimeout(SH.hideT);
    SH.hideT = setTimeout(() => SH.banner && SH.banner.classList.remove('on'), 7000);
  }

  function shinyAlert(name, src) {
    name = String(name || 'Pokémon').slice(0, 40);
    const now = Date.now(), key = name.toLowerCase();
    if (src === 'body') {
      const q = SH.fromServer.get(key);
      if (q && now - q < 90000) { SH.fromServer.delete(key); SH.fromBody.set(key, now); return; }
      SH.fromBody.set(key, now);
    } else {
      const b = SH.fromBody.get(key);
      if (b && now - b < 15000) { SH.fromBody.delete(key); return; }
      SH.fromServer.set(key, now);
    }
    showShinyBanner(name);
    if (SH.cfg && SH.cfg.shinySiren) playSiren();
  }

  function syncShinyArea(hook, J) {
    let area = null, generation = 0;
    try { area = hook && hook.sala ? hook.sala() : null; } catch (e) {  }
    try { generation = hook && hook.sceneGen ? hook.sceneGen() : 0; } catch (e) {  }
    if (area == null) return;
    area = String(area);
    generation = String(generation == null ? 0 : generation);
    const roster = J && J.selvagens;
    const areaChanged = SH.area !== area || SH.generation !== generation;
    const rosterChanged = SH.roster !== roster;
    if (!areaChanged && !rosterChanged) return;
    SH.area = area;
    SH.roster = roster;
    SH.generation = generation;
    if (areaChanged) {
      SH.sig = new WeakMap();
      SH.fromServer.clear();
      SH.fromBody.clear();
      SH.scanAfter = Date.now() + 700;
    } else {
      SH.scanAfter = Math.max(SH.scanAfter, Date.now() + 250);
    }
  }

  function startShinyWatch(getHook) {
    window.__pfShinyServer = (m) => { const hook = getHook(), J = hook && hook.jogo; syncShinyArea(hook, J); shinyAlert(m && m.nome, 'server'); };
    setInterval(() => {
      try {
        const hook = getHook(), J = hook && hook.jogo;
        if (!J || !J.selvagens) return;
        syncShinyArea(hook, J);
        if (Date.now() < SH.scanAfter) return;
        for (const s of J.selvagens) {
          if (!s || !s.shiny) continue;
          const sig = [s.id ?? '', s.dex ?? '', s.lv ?? '', s.geracaoCorpo ?? '', Math.round((s.x || 0) * 10), Math.round((s.z || 0) * 10)].join('|');
          if (SH.sig.get(s) === sig) continue;
          SH.sig.set(s, sig);
          if (s.torneio || s.emTurno || s.naBola || s.safari || s.perfil === 'treinado' || s.estado === 'guardado' || s.estado === 'morto' || s.estado === 'capturando') continue;
          shinyAlert(s.nome || (s.especie && s.especie.nome), 'body');
        }
      } catch (e) {  }
    }, 300);
    const prime = () => { sirenCtx(); removeEventListener('pointerdown', prime, true); removeEventListener('keydown', prime, true); };
    addEventListener('pointerdown', prime, true); addEventListener('keydown', prime, true);
  }
  if (!IN_BROWSER) return;
  if (window.__pfAutoHuntLoaded) return;
  window.__pfAutoHuntLoaded = true;

  installPatch();
  const cfg = loadCfg();
  SH.cfg = cfg;
  startShinyWatch(() => window.__pfHook || null);
  const hunter = createHunter(() => window.__pfHook || null, cfg);
  setInterval(() => { try { hunter.tick(); } catch (e) {} }, TUNE.tick);

  const ready = () => mountUI(hunter, cfg);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
