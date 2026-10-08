# regenera o motor da sala liquida a partir do e05 da sala principal.
# a sala antiga NAO e tocada: todas as diferencas da liquid vivem nestas transformacoes.
s=open('radio/e05-engine.html',encoding='utf-8').read()

# 1) corta o bloco da introducao da sala antiga (a liquid tem introducao propria no l06)
a=s.index("/* ---------------- intro: o disco de abertura ----------------")
b=s.index('$("skipIntro").addEventListener("click", finishIntro);')
b=s.index("\n", b)+1
stub="/* a introducao da sala liquida vive no modulo l06 */\nvar introAudio=null, introFading=false;\n"
s=s[:a]+stub+s[b:]

# 2) arranque: prepara tudo mas NAO arranca; o l06 chama HM.begin() quando a intro terminar
old="""(function autoStart(){
  FX.init();
  $("app").classList.add("on");
  $("app").classList.add("intro");
  buildQueue(); applyBlockTheme();
  pendingFirst = nextTrack();
  setNow(pendingFirst, false);
  loadApi();
  maybeStart();
  runIntro();
})();"""
new="""(function autoStart(){
  FX.init();
  /* o volume guardado e o portao da foley valem ja para o primeiro som (antes do init nao havia master) */
  FX.setVol(masterVol/100);
  setTimeout(function(){ try{ FX.warm(); }catch(e){} }, 1500);
  $("app").classList.add("on");
  buildQueue(); applyBlockTheme();
  pendingFirst = pullTrack();
  setNow(pendingFirst, false);
  loadApi();
  maybeStart();
})();
/* pontes para os modulos da sala liquida (intro, instalacao semanal) */
window.HM={
  begin: beginRadio,
  fxResume: function(){ try{ FX.resume(); }catch(e){} },
  animClock: animClock,
  isOn: function(){ return radioOn; },
  /* a foley da emissao soa? falso com a radio de lado (foco, arcada, tapes) ou em mute;
     o anuncio do amanhecer (HMDAWN no l06) pergunta aqui antes de tocar */
  fxAudible: function(){ try{ return radioFxOk(); }catch(e){ return true; } },
  /* abre a sessao de media no proprio gesto: o leitor roda mudo durante a
     introducao, para o unMute do fim ser aceite tambem nos telemoveis */
  prime: function(){
    (function g(){
      var p=P[activeKey];
      if(p && p.ready && started){ try{ p.yt.mute(); p.yt.playVideo(); }catch(e){} }
      else if(!radioOn){ setTimeout(g, 350); }
    })();
  }
};
window.HM.rampOnly=function(){
  /* arma a rampa do primeiro disco; sem foley nenhum, o sulco real ja soou.
     a bandeira fica para o rampInFirst, que a consome (antes era limpa aqui e a rampa nunca corria) */
  if(firstRampPending){ rampInFirst(); }
  else { try{ fadeVol(P[activeKey], 1); }catch(e){} }
};
/* modo de estaleiro (?dev na morada): espreitar a fila e saltar sem o quebra-cabecas */
window.HMDEV={
  on: /(^|[?&])dev(=|&|$)/.test(location.search),
  peek: function(n){ return devPeek(n||3); },
  skip: function(){ try{ hardNext("dev"); }catch(e){} }
};"""
assert old in s, "autoStart nao encontrado"
s=s.replace(old,new)

# 3) rampa do primeiro disco: 2 s (a musica ja esta a 100 por cento quando o sulco acaba)
assert "var firstRampPending=false, rampDur=4500;" in s
s=s.replace("var firstRampPending=false, rampDur=4500;",
            "var firstRampPending=false, rampDur=2000;")

# 4) telemovel: o volume por software do YouTube e terreno pantanoso em mobile
#    (no iOS e ignorado; noutros casos cria estados contraditorios). Em ecras
#    pequenos o volume fica fixo a 100 e manda o botao fisico; o slider sai do layout.
old_v="""try{ var sv = localStorage.getItem("hm_vol"); if(sv!==null){ masterVol = Math.max(0, Math.min(100, parseInt(sv,10)||80)); } }catch(e){}"""
new_v="""try{ var sv = localStorage.getItem("hm_vol"); if(sv!==null){ masterVol = Math.max(0, Math.min(100, parseInt(sv,10)||80)); } }catch(e){}
try{ if(window.matchMedia && matchMedia("(max-width:760px)").matches){ masterVol=100; } }catch(e){}"""
assert old_v in s
s=s.replace(old_v,new_v)

# 4b) fila com antecipacao: pullTrack consome primeiro o que o modo de estaleiro
#     ja espreitou, para a espreitadela nunca alterar a emissao
old_n="""  runLeft--;
  return t;
}"""
new_n="""  runLeft--;
  return t;
}
var devQ=[];
function pullTrack(){ return devQ.length ? devQ.shift() : nextTrack(); }
function devPeek(n){
  while(devQ.length<n){ var t=nextTrack(); if(!t) break; devQ.push(t); }
  return devQ.slice(0,n).map(function(t){
    var g=GENRES[t.g]||{};
    return { a:t.a, t:t.t, g:(g.name||t.g), bpm:(t.bpm||GBPM[t.g]||120), sure:!!t.bpm };
  });
}"""
assert old_n in s and s.count(old_n)==1
s=s.replace(old_n,new_n)

old_c="var t = nextTrack(); if(!t) return;"
assert s.count(old_c)==2
s=s.replace(old_c, "var t = pullTrack(); if(!t) return;")

# 5) cartao da faixa: credito de quem ofereceu a musica (t.rec) e o botao de
#    estender a descricao quando o clamp de 3 linhas a corta
old_b='''  $("tBlurb").textContent = t.b;'''
new_b='''  $("tBlurb").textContent = t.b;
  (function(){
    var r=$("tRec");
    if(r){ if(t.rec){ r.textContent="a present from "+t.rec; r.hidden=false; } else { r.hidden=true; } }
    var bl=$("tBlurb"), bm=$("blurbMore");
    if(bl && bm){
      bl.classList.remove("open"); bm.textContent="more";
      setTimeout(function(){ bm.hidden = !(bl.scrollHeight > bl.clientHeight + 2); }, 80);
    }
  })();'''
assert old_b in s
s=s.replace(old_b, new_b)


# 6) focus na sala: valvula real sobre a grelha, ducking da emissao, radio de lado para a arcada,
#    e um guarda de som que repara o silencio e, em ultimo caso, pede o toque
old_v1="var bg = BLOCKS[currentBlock].genres.filter(genreHasTracks);"
new_v1="var bg = BLOCKS[currentBlock].genres.filter(genreHasTracks).filter(function(gg){ return !window.HMFOCUS || !HMFOCUS.on || HMFOCUS.allow[gg]; });\n  if(window.HMFOCUS && HMFOCUS.on && HMFOCUS.extra){ HMFOCUS.extra.forEach(function(gg){ if(HMFOCUS.allow[gg] && genreHasTracks(gg) && bg.indexOf(gg)<0) bg.push(gg); }); }\n  if(!bg.length) bg = BLOCKS[currentBlock].genres.filter(genreHasTracks);"
assert old_v1 in s
s=s.replace(old_v1,new_v1)
old_v2="""  var bg = BLOCKS[currentBlock].genres;
  if(!currentGenre || bg.indexOf(currentGenre)<0 || !genreHasTracks(currentGenre) || runLeft<=0){"""
new_v2="""  var bg = BLOCKS[currentBlock].genres;
  var fOut = window.HMFOCUS && HMFOCUS.on && currentGenre && !HMFOCUS.allow[currentGenre];
  if(!currentGenre || fOut || bg.indexOf(currentGenre)<0 || !genreHasTracks(currentGenre) || runLeft<=0){"""
assert old_v2 in s
s=s.replace(old_v2,new_v2)
old_av="try{ p.yt.setVolume(Math.round(Math.max(0, Math.min(100, masterVol * f)))); }catch(e){}"
new_av="var fdk=(window.HMFOCUS && HMFOCUS.on && HMFOCUS.duck) || 1;\n  try{ p.yt.setVolume(Math.round(Math.max(0, Math.min(100, masterVol * f * fdk)))); }catch(e){}"
assert old_av in s
s=s.replace(old_av,new_av)
old_cg='setTimeout(checkAudible, 6000);'
new_cg='setTimeout(checkAudible, 6000);\n    audioGuard();'
assert s.count(old_cg)==1
s=s.replace(old_cg,new_cg)
# guarda de som + side, dentro da IIFE junto do export
old_hm="window.HM.rampOnly=function(){"
new_hm="""window.HMFOCUS={ on:false, duck:1, allow:{} };
window.HM.side=function(on){ try{ mx2SideRadio(on); }catch(e){} };
window.HM.flushPeek=function(){ try{ devQ.length=0; }catch(e){} };
window.HM.reVol=function(){ try{ applyVol("A"); applyVol("B"); }catch(e){} };
var guardOn=false;
function audioGuard(){
  if(guardOn) return; guardOn=true;
  var stable=0, tries=0;
  var iv=setInterval(function(){
    if(!radioOn) return;
    /* durante o rito da agulha o leitor armado roda mudo de proposito: nao lhe tocar */
    if(REC.on || (PRE.t && PRE.k===activeKey)) return;
    var p=P[activeKey];
    if(!p || !p.ready || !p.yt) return;
    var st=-9, mu=false, gv=100;
    try{ st=p.yt.getPlayerState(); mu=p.yt.isMuted(); gv=p.yt.getVolume(); }catch(e){ return; }
    if(st!==1){ return; }
    if(muted){ stable=0; return; }
    var f=(p.fade==null?1:p.fade);
    var nd=$("needle");
    var ok=!mu && gv>1 && f>0.03;
    if(ok){
      stable++;
      if(nd && nd.dataset.guard==="1"){ nd.classList.remove("on"); nd.style.display=""; nd.dataset.guard="0"; }
      if(stable>=4){ clearInterval(iv); guardOn=false; }
      return;
    }
    stable=0; tries++;
    try{
      p.yt.unMute();
      if(f<=0.03 && !firstRampPending && !transitioning){ fadeVol(p, 1); }
      applyVol(p.k);
    }catch(e){}
    if(tries>=3 && mu && nd){
      nd.textContent="tap for sound";
      nd.style.display="block"; nd.classList.add("on"); nd.dataset.guard="1";
      nd.onclick=function(){
        try{ p.yt.unMute(); p.yt.playVideo(); applyVol(p.k); }catch(e){}
        nd.classList.remove("on"); nd.style.display="none"; nd.dataset.guard="0";
      };
    }
  }, 3000);
}
window.HM.rampOnly=function(){"""
assert old_hm in s
s=s.replace(old_hm,new_hm)

# ephemera no painel do som (so na sala liquida)
old_ep="""      if(gx.note) h+='<p class="gx-note">'+gx.note+'</p>';"""
new_ep="""      if(gx.eph) h+='<figure class="gx-eph"><img loading="lazy" src="'+gx.eph.img+'" alt="'+gx.eph.cap+'"><figcaption>'+gx.eph.cap+' \u00b7 <a href="'+gx.eph.u+'" target="_blank" rel="noopener">Internet Archive \u2197</a></figcaption></figure>';
      if(gx.note) h+='<p class="gx-note">'+gx.note+'</p>';"""
assert old_ep in s
s=s.replace(old_ep,new_ep)


# 7) a radio poe-se de lado em FADE, nunca em corte: um fator lateral no volume,
#    por fonte (tapes, arcada, foco), animado em 700 ms
old_sf="""function mx2SideRadio(on){
  /* on=true: a radio poe-se de lado enquanto a tape toca */
  if(on){ if(!muted){ toggleMute(); mx2.mutedRadio=true; } }
  else { if(mx2.mutedRadio){ mx2.mutedRadio=false; if(muted) toggleMute(); } }
}"""
new_sf="""window.HMSIDE={ f:1, src:{}, h:null, fx:1 };
function sideFade(key, on, ms){
  HMSIDE.src[key]=!!on;
  /* o portao do FX (FX.live) reavalia-se a cada mudanca de lado: fecha no foco e na arcada; as
     tapes trazem a sua propria agulha pelo mesmo FX, e em mute abrem-no ja (10 ms), para essa
     agulha, que soa logo a seguir, nao se perder na rampa */
  var fxT=FX.live() ? 1 : 0;
  if(fxT!==HMSIDE.fx){ HMSIDE.fx=fxT; try{ FX.setVol(masterVol/100, fxT ? (key==="tapes" ? 0.01 : (ms||700)/1000) : 0.25); }catch(e){} }
  var target=Object.keys(HMSIDE.src).some(function(k){ return HMSIDE.src[k]; }) ? 0 : 1;
  var from=HMSIDE.f;
  if(Math.abs(from-target)<0.01){ HMSIDE.f=target; return; }
  if(HMSIDE.h) clearInterval(HMSIDE.h);
  HMSIDE.h=animClock(ms||700, function(x){
    HMSIDE.f=from+(target-from)*x;
    try{ applyVol("A"); applyVol("B"); }catch(e){}
  });
}
function mx2SideRadio(on){
  /* on=true: a radio desvanece de lado enquanto a tape toca */
  sideFade("tapes", on);
}"""
assert old_sf in s
s=s.replace(old_sf,new_sf)
old_av2="try{ p.yt.setVolume(Math.round(Math.max(0, Math.min(100, masterVol * f * fdk)))); }catch(e){}"
new_av2="var sdf=(window.HMSIDE && HMSIDE.f!=null)?HMSIDE.f:1;\n  try{ p.yt.setVolume(Math.round(Math.max(0, Math.min(100, masterVol * f * fdk * sdf)))); }catch(e){}"
assert old_av2 in s
s=s.replace(old_av2,new_av2)
old_side='window.HM.side=function(on){ try{ mx2SideRadio(on); }catch(e){} };'
new_side=('window.HM.side=function(on){ try{ sideFade("arcade", on); }catch(e){} };\n'
 +'window.HM.sideKey=function(k, on, ms){ try{ sideFade(k, on, ms); }catch(e){} };\n'
 +'window.HM.skipIfBlocked=function(){\n'
 +'  try{\n'
 +'    if(window.HMFOCUS && HMFOCUS.on && current && !HMFOCUS.allow[current.g]){ hardNext("focus"); return true; }\n'
 +'  }catch(e){}\n'
 +'  return false;\n'
 +'};')
assert old_side in s
s=s.replace(old_side,new_side)

# 8) grelha fina da sala liquida (7 sub-blocos) + motor de programacao novo:
#    ponte de BPM nas fronteiras, abridores de intro longa, permanencia proporcional
#    a caixa, rotacao persistente entre sessoes, dawn override as 06h, selo fresh
old_bk='function blockKeyFor(h){ if(h>=6 && h<13) return "morning"; if(h>=13 && h<20) return "afternoon"; return "night"; }'
new_bk=('/* a grelha fina da sala liquida: sete sub-blocos, decididos pelo fundador (10/2026) */\n'
 '(function(){\n'
 '  var NB={\n'
 '    dawn:      { label:"DAWN PROGRAMME",      range:"06:00 - 08:00", accent:"#8d90b0", genres:["ambient","ambient_techno"] },\n'
 '    kingston:  { label:"KINGSTON BREAKFAST",  range:"08:00 - 13:00", accent:"#ffb12b", genres:["reggae","dub","ska_rocksteady"] },\n'
 '    groove:    { label:"LUNCH GROOVE",        range:"13:00 - 15:00", accent:"#41d9c8", genres:["house","lofi_house"] },\n'
 '    flight:    { label:"AFTERNOON FLIGHT",    range:"15:00 - 18:00", accent:"#41d9c8", genres:["liquid","atmospheric_jungle","intelligent_dnb"] },\n'
 '    skank:     { label:"AFTER-WORK SKANK",    range:"18:00 - 20:00", accent:"#ffb12b", genres:["breakbeat","uk_garage"] },\n'
 '    pressure:  { label:"NIGHT PRESSURE",      range:"20:00 - 02:00", accent:"#e8392c", genres:["ragga_jungle","uk_garage","oldskool_hardcore","dubstep"] },\n'
 '    afterhours:{ label:"AFTER HOURS",         range:"02:00 - 06:00", accent:"#e8392c", genres:["hypnotic_techno","deep_house","dub_techno"] }\n'
 '  };\n'
 '  Object.keys(BLOCKS).forEach(function(k){ delete BLOCKS[k]; });\n'
 '  Object.keys(NB).forEach(function(k){ BLOCKS[k]=NB[k]; });\n'
 '})();\n'
 'function blockKeyFor(h){\n'
 '  if(h>=6&&h<8) return "dawn";\n'
 '  if(h>=8&&h<13) return "kingston";\n'
 '  if(h>=13&&h<15) return "groove";\n'
 '  if(h>=15&&h<18) return "flight";\n'
 '  if(h>=18&&h<20) return "skank";\n'
 '  if(h>=20||h<2) return "pressure";\n'
 '  return "afterhours";\n'
 '}')
assert old_bk in s, "blockKeyFor nao encontrado"
s=s.replace(old_bk,new_bk)

old_ov='var m = window.location.search.match(/[?&]block=(morning|afternoon|night)/);'
new_ov='var m = window.location.search.match(/[?&]block=(morning|afternoon|night|dawn|kingston|groove|flight|skank|pressure|afterhours)/);'
assert old_ov in s
s=s.replace(old_ov,new_ov)
old_cb='var currentBlock = OVERRIDE || blockKeyFor(new Date().getHours());'
new_cb=('var BALIAS={morning:"kingston",afternoon:"flight",night:"pressure"};\n'
 'var currentBlock = OVERRIDE ? (BALIAS[OVERRIDE]||OVERRIDE) : blockKeyFor(new Date().getHours());')
assert old_cb in s
s=s.replace(old_cb,new_cb)

# memoria de rotacao + permanencia proporcional + ponte
old_pools='var pools={}, currentGenre=null, runLeft=0;'
new_pools=('var pools={}, currentGenre=null, runLeft=0, bridgeG=null, forceGenre=null;\n'
 '/* rotacao persistente: o browser lembra-se do que ja tocou; estreias furam para a frente */\n'
 'var ROT={ map:{} };\n'
 'try{ ROT.map=JSON.parse(localStorage.getItem("hm_rot")||"{}")||{}; }catch(e){ ROT.map={}; }\n'
 'window.HMROT=ROT;\n'
 'function rotMark(v){\n'
 '  ROT.map[v]=Date.now();\n'
 '  try{\n'
 '    var ks=Object.keys(ROT.map);\n'
 '    if(ks.length>4000){ ks.sort(function(a,b){ return ROT.map[a]-ROT.map[b]; }).slice(0,800).forEach(function(k){ delete ROT.map[k]; }); }\n'
 '    localStorage.setItem("hm_rot", JSON.stringify(ROT.map));\n'
 '  }catch(e){}\n'
 '}\n'
 'function runFor(gn){\n'
 '  var n=TRACKS.filter(function(t){ return t.g===gn && !deadIds[t.v]; }).length;\n'
 '  var base=3+Math.floor(Math.random()*3);\n'
 '  return Math.max(1, Math.min(base, Math.ceil(n/2)));\n'
 '}')
assert old_pools in s
s=s.replace(old_pools,new_pools)

# baralho estratificado: nunca-tocadas primeiro, depois as mais antigas no ar
old_pf='''function poolFor(gn){
  if(!pools[gn] || !pools[gn].length){
    pools[gn] = shuffle(TRACKS.filter(function(t){ return t.g===gn && !deadIds[t.v]; }));
  }
  return pools[gn];
}'''
new_pf='''function poolFor(gn){
  if(!pools[gn] || !pools[gn].length){
    var all=TRACKS.filter(function(t){ return t.g===gn && !deadIds[t.v]; });
    var fresh=shuffle(all.filter(function(t){ return !ROT.map[t.v]; }));
    var rest=all.filter(function(t){ return ROT.map[t.v]; }).sort(function(a,b){ return (ROT.map[a.v]||0)-(ROT.map[b.v]||0); });
    pools[gn]=fresh.concat(rest);
  }
  return pools[gn];
}'''
assert old_pf in s
s=s.replace(old_pf,new_pf)

# sorteio-base de genero ponderado pelas faixas por estrear
old_rand='  return bg[Math.floor(Math.random()*bg.length)];'
new_rand=('  var w=[], tot=0;\n'
 '  bg.forEach(function(gn){\n'
 '    var c=1+TRACKS.filter(function(t){ return t.g===gn && !deadIds[t.v] && !ROT.map[t.v]; }).length;\n'
 '    w.push(c); tot+=c;\n'
 '  });\n'
 '  var r=Math.random()*tot;\n'
 '  for(var wi=0; wi<bg.length; wi++){ r-=w[wi]; if(r<=0) return bg[wi]; }\n'
 '  return bg[bg.length-1];')
assert old_rand in s and s.count(old_rand)==1
s=s.replace(old_rand,new_rand)

# nextTrack: dawn override, ponte de fronteira e abridores de intro longa
old_nt='''    var nx = pickGenre(currentGenre);
    if(!nx) return null;
    currentGenre = nx;
    runLeft = 3 + Math.floor(Math.random()*3);
  }
  var pool = poolFor(currentGenre);
  if(!pool.length) return null;'''
new_nt='''    var wasBridge=false;
    if(forceGenre && genreHasTracks(forceGenre)){
      currentGenre=forceGenre; forceGenre=null; wasBridge=true;
    } else {
      var nx = pickGenre(currentGenre||bridgeG);
      if(!nx) return null;
      wasBridge = !currentGenre && !!bridgeG;
      currentGenre = nx;
    }
    bridgeG=null;
    runLeft = runFor(currentGenre);
  }
  var pool = poolFor(currentGenre);
  if(!pool.length) return null;
  if(wasBridge){
    for(var oi=0; oi<pool.length; oi++){
      if(pool[oi].op){ var ob=pool.splice(oi,1)[0]; pool.unshift(ob); break; }
    }
  }'''
assert old_nt in s, "bloco nextTrack nao encontrado"
s=s.replace(old_nt,new_nt)

# mudanca de bloco: herdar o genero cessante como ponte; as 06h, dawn override
old_ch='''    currentBlock = bk;
    buildQueue();'''
new_ch='''    bridgeG = currentGenre;
    if(bk==="dawn"){
      bridgeG=null; forceGenre="ambient";
      /* o disco ja pre-carregado no prato livre volta a frente da caixa: o amanhecer abre logo
         no disco seguinte (se a agulha ja estiver no ar, o rito em curso acaba como estava) */
      if(PRE.t && !REC.on) dropPre(true);
      try{ if(window.HMDAWN) HMDAWN.play(); }catch(e){}
    }
    currentBlock = bk;
    buildQueue();'''
assert old_ch in s and s.count(old_ch)==1
s=s.replace(old_ch,new_ch)

# a faixa que entra no ar fica na memoria de rotacao
old_sn='''function setNow(t, push){
  current = t;'''
new_sn='''function setNow(t, push){
  current = t;
  try{ if(t && t.v) rotMark(t.v); }catch(e){}'''
assert old_sn in s
s=s.replace(old_sn,new_sn)

# selo fresh no cartao (so a sala liquida tem o span)
old_fz='''    var bl=$("tBlurb"), bm=$("blurbMore");'''
new_fz='''    var fz=$("tFresh");
    if(fz){
      var isF=false;
      try{ if(t.ad){ isF=(Date.now()-new Date(t.ad+"T00:00:00Z").getTime()) < 14*86400000; } }catch(e){}
      fz.hidden=!isF;
    }
    var bl=$("tBlurb"), bm=$("blurbMore");'''
assert old_fz in s and s.count(old_fz)==1
s=s.replace(old_fz,new_fz)

# 9) painel estendido do genero: sem ano no catalogo, sem parenteses (nada de «(undefined)»)
old_yr='''n:k.a+", "+k.t+" ("+k.y+")",'''
new_yr='''n:k.a+", "+k.t+(k.y?" ("+k.y+")":""),'''
assert s.count(old_yr)==2
s=s.replace(old_yr,new_yr)

# 10) o rito da agulha (pedido do Paulo, 10/2026): acabou o crossfade de 24 s que cortava o fim
#     de cada disco. Cada disco toca ate ao ENDED do YouTube; agulha fora; 2,0 s depois, no relogio
#     do AudioContext, agulha dentro; a musica entra 0,4 s depois (sulco de entrada). No computador
#     o disco seguinte espera no prato livre (carregado, mudo, parado no inicio); no telemovel, com
#     um so leitor, carrega depois do levantar e pousa quando os 2 s passaram e o leitor esta pronto.
#     Agulha nova (a seco, nunca pelo eco), crepitar mais baixo, kits do intervalo numa tabela
#     (GAPKIT) e o portao da foley quando a radio esta de lado ou em mute.
def rep(old, new, n=1, what=''):
    global s
    c=s.count(old)
    assert c==n, '10 %s: ancora encontrada %d vezes (esperadas %d)' % (what or old[:50], c, n)
    s=s.replace(old, new)

def cut(a, b, new, what=''):
    # substitui de a (inclusive) ate b (exclusive); as duas ancoras unicas, b depois de a
    global s
    assert s.count(a)==1, '10 %s: ancora inicial %d vezes' % (what, s.count(a))
    assert s.count(b)==1, '10 %s: ancora final %d vezes' % (what, s.count(b))
    i=s.index(a); j=s.index(b)
    assert j>i, '10 %s: ancoras fora de ordem' % what
    s=s[:i]+new+s[j:]

# 10a) constantes do rito no lugar da antecedencia do crossfade
rep("var XFADE_LEAD = 24;     /* o rito completo do vinil leva ~11s antes de a rampa poder comecar */\n",
r'''/* sala liquida: sem crossfade. cada disco toca ate ao fim; agulha fora, GAP_S de silencio
   contado no relogio do AudioContext, agulha dentro, e a musica entra depois do sulco */
var GAP_S = 2.0;           /* s, do levantar ao pousar da agulha */
var DROP_TO_MUSIC_S = 0.4; /* s, sulco de entrada antes da primeira nota */
var PRE_LEAD = 40;         /* s antes do fim: o disco seguinte espera no prato livre (computador) */
var REC_TIMEOUT = 25000;   /* ms sem o disco novo pronto: troca seca para outro */
var LIFT_LEAD = 0.025;     /* s: o relogio do audio anda aos saltos de ~10 ms; o levantar agenda-se
                              um pouco a frente para os 2,0 s contarem do seu inicio real */
var PRE_COOL = 15000;      /* ms de descanso da antecipacao depois de cinco erros seguidos no prato livre */
''', what='XFADE_LEAD')

# 10b) FX: cadeia do master e do eco reutilizavel (para o ensaio fora de linha), portao da foley
cut("  init: function(){\n    if(this.ctx) return;", "  resume: function(){",
r'''  init: function(){
    if(this.ctx) return;
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.chain(this.ctx);
    }catch(e){ this.ctx = null; }
  },
  /* master seco e eco dub partilhado (0,36 s, realimentacao 0,52, passa-baixo 1,7 kHz) */
  chain: function(c){
    this.master = c.createGain(); this.master.gain.value = 0.7;
    this.master.connect(c.destination);
    var delay = c.createDelay(1.5); delay.delayTime.value = 0.36;
    var fb = c.createGain(); fb.gain.value = 0.52;
    var lp = c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value = 1700;
    delay.connect(lp); lp.connect(fb); fb.connect(delay);
    var wet = c.createGain(); wet.gain.value = 0.9;
    delay.connect(wet); wet.connect(this.master);
    this.echoIn = delay; this.wet = wet; this.fb = fb;
  },
''', what='FX.init')
rep("  setVol: function(v){ if(this.master) this.master.gain.value = 0.7 * v; },",
r'''  /* o portao da foley: fechado com a radio de lado no foco ou na arcada, e em mute; em mute
     abre-se so para uma tape a tocar (o mute nao cala as tapes, que trazem a sua agulha). A foley
     da propria emissao pergunta ainda ao radioFxOk, que a cala em mute e durante as tapes */
  live: function(){
    var sd=window.HMSIDE && HMSIDE.src;
    if(sd && (sd.focus || sd.arcade)) return false;
    return !muted || !!(sd && sd.tapes);
  },
  setVol: function(v, ramp){
    if(!this.master) return;
    var on=this.live(), g=this.master.gain, to=0.7 * v * (on ? 1 : 0), t=this.ctx.currentTime;
    /* o estado do portao fica num so sitio, para o sideFade comparar com o que o master tem */
    if(this===FX && window.HMSIDE) HMSIDE.fx = on ? 1 : 0;
    g.cancelScheduledValues(t);
    if(ramp){ g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t+ramp); }
    else { g.value = to; }
  },''', what='FX.setVol')

# 10c) os sons antigos aceitam at (segundos a partir de agora) para se agendarem no relogio do audio
for old, new in [
  ("  stab: function(){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime, g=c.createGain();",
   "  stab: function(at){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime+(at||0), g=c.createGain();"),
  ("  phone: function(){", "  phone: function(at){"),
  ("      var t=c.currentTime + i*0.13, g=c.createGain();", "      var t=c.currentTime + (at||0) + i*0.13, g=c.createGain();"),
  ("  siren: function(dur){\n    if(!this.ctx) return;\n    dur = dur || 1.2;\n    var c=this.ctx, t=c.currentTime;",
   "  siren: function(dur, at){\n    if(!this.ctx) return;\n    dur = dur || 1.2;\n    var c=this.ctx, t=c.currentTime+(at||0);"),
  ("  sub: function(){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime;",
   "  sub: function(at){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime+(at||0);"),
  ("  skank: function(){", "  skank: function(at){"),
  ("      var t=c.currentTime+dt0, g2=c.createGain();", "      var t=c.currentTime+(at||0)+dt0, g2=c.createGain();"),
  ("  horn: function(){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime, g2=c.createGain();",
   "  horn: function(at){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime+(at||0), g2=c.createGain();"),
  ("  sweep: function(){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime;",
   "  sweep: function(at){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime+(at||0);"),
  ("  rewind: function(){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime;",
   "  rewind: function(at){\n    if(!this.ctx) return;\n    var c=this.ctx, t=c.currentTime+(at||0);"),
]:
  rep(old, new, what='at '+old.strip()[:20])

# 10d) a agulha a pousar, refeita: braco a serio e a seco
cut("  needleDrop: function(){", "  sub: function(at){",
r'''  /* pousar a agulha, como um braco a serio e sempre a seco (nunca pelo eco): o contacto do
     diamante (estalido curto de banda larga com um ressalto), o corpo surdo da capsula em
     graves e medios graves (ruido em modos amortecidos, nao um bip de sintetizador), e ~0,4 s
     de sulco de entrada (chiado brando, ronco leve do prato, po, um clique de rotacao) que
     se apaga por baixo da musica */
  needleDrop: function(at){ if(this.ctx) this.needleAt("drop", this.ctx.currentTime+(at||0)); },
  /* a agulha num instante absoluto do relogio do audio (o rito le o relogio uma so vez, para os
     2,0 s entre o levantar e o pousar nao dependerem de quando cada som e preparado) */
  needleAt: function(kind, when){
    if(!this.ctx || !this.live()) return;
    var b=this._fresh(kind);
    /* -3 dB no pousar: cai agora em silencio, ja nao por cima da musica */
    this._play(this.ctx, b, when, kind==="drop" ? 0.7 : 0.8);
  },
  _mkDrop: function(c){
    var self=this;
    return this._buf(c, 1.05, function(d, sr, n){
      self._burst(d, sr, 0, 0.45, 0.0011, 260);
      self._burst(d, sr, 0.011, 0.15, 0.0008, 260);
      self._thud(d, sr, 0.0004, [[96,0.30,0.032],[158,0.15,0.021],[251,0.07,0.013],[402,0.03,0.008]], 0.06);
      self._lpBurst(d, sr, 0, 0.55, 0.016, 380);
      self._groove(d, sr, Math.floor(0.004*sr), n, { hiss:0.15, rumble:0.016, tick:0.4, ticks:20,
        env:function(x){
          var e=Math.min(1, x/0.012);
          if(x>0.42) e*=Math.exp(-(x-0.42)/0.16);
          if(x>0.98) e*=Math.max(0, (1.046-x)/0.066);
          return e;
        } });
      self._click(d, sr, 0.27, 0.09, 58, 0.03);
    });
  },
''', what='needleDrop')

# 10e) crepitar, agulha fora, kits do intervalo, temporizador do audio, sintese ao sample
cut("  crackle: function(on){", "};\n\n/* tempo per genre",
r'''  /* crepitar: 7,2 s (quatro voltas a 33 1/3) de po irregular sobre um chiado baixo, com o
     clique de cada volta; mais baixo que o antigo e sem o laco de 2 s a denunciar-se */
  crackle: function(on){
    var c=this.ctx; if(!c) return;
    if(on){
      if(this._ck || !this.live()) return;
      var self=this;
      if(!this._ckBuf || this._ckBuf.sampleRate!==c.sampleRate){
        this._ckBuf=this._buf(c, 7.2, function(d, sr, n){
          self._groove(d, sr, 0, n, { hiss:0.025, rumble:0.006, tick:0.6, ticks:8, env:function(){ return 1; } });
          for(var r=0;r<4;r++){ self._click(d, sr, 0.4+r*1.8+(Math.random()-0.5)*0.01, 0.07+0.04*Math.random(), 60, 0.008); }
        });
      }
      var src=c.createBufferSource(); src.buffer=this._ckBuf; src.loop=true;
      var g=c.createGain(), t=c.currentTime;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t+0.08);
      src.connect(g); g.connect(this.master);
      src.start(t, Math.random()*7); this._ck={src:src,g:g};
    }else if(this._ck){
      var ck=this._ck, t2=c.currentTime; this._ck=null;
      ck.g.gain.cancelScheduledValues(t2); ck.g.gain.setValueAtTime(ck.g.gain.value, t2);
      ck.g.gain.linearRampToValueAtTime(0.0001, t2+0.6);
      try{ ck.src.stop(t2+0.65); }catch(e){}
    }
  },
  /* o crepitar como na realidade: uma janela curta que se apaga sozinha */
  crackleBurst: function(dur){
    if(!this.ctx || !this.live()) return;
    this.crackle(true);
    var self=this;
    clearTimeout(this._ckT);
    this._ckT=setTimeout(function(){ self.crackle(false); }, Math.max(300,(dur||2.2)*1000));
  },
  /* levantar a agulha: o sulco de saida ainda a correr (com o baque do sulco fechado), o raspar
     curto do diamante a sair, um estalo baixo e mole da capsula, e depois silencio (sem crepitar) */
  needleLift: function(at){ if(this.ctx) this.needleAt("lift", this.ctx.currentTime+(at||0)); },
  _mkLift: function(c){
    var self=this;
    return this._buf(c, 0.44, function(d, sr, n){
      self._groove(d, sr, 0, Math.floor(0.302*sr), { hiss:0.14, rumble:0.016, tick:0.35, ticks:16,
        env:function(x){ var e=Math.min(1, x/0.025); if(x>0.294) e*=Math.max(0, (0.302-x)/0.008); return e; } });
      self._click(d, sr, 0.07, 0.07, 55, 0.035);
      self._scrape(d, sr, 0.232, 0.068, 0.6, 2600, 900);
      self._thud(d, sr, 0.292, [[72,0.13,0.018],[141,0.045,0.010]], 0.04);
      self._lpBurst(d, sr, 0.292, 0.25, 0.006, 350);
    });
  },
  /* os buffers da agulha ficam feitos de vespera (gerar leva dezenas de ms, e o levantar tem de
     sair no instante do ENDED); cada uso deixa outro a fazer, para nunca soar duas vezes igual */
  _fresh: function(kind){
    var c=this.ctx, cache=this._bufs || (this._bufs={}), b=cache[kind], self=this;
    var mk=function(){ return kind==="drop" ? self._mkDrop(c) : self._mkLift(c); };
    if(!b || b.sampleRate!==c.sampleRate) b=mk();
    cache[kind]=null;
    setTimeout(function(){ if(!cache[kind]) cache[kind]=mk(); }, 60);
    return b;
  },
  warm: function(){
    var c=this.ctx; if(!c) return;
    var cache=this._bufs || (this._bufs={});
    if(!cache.drop) cache.drop=this._mkDrop(c);
    if(!cache.lift) cache.lift=this._mkLift(c);
  },
  /* o kit dub da troca antiga, para quem o chame: agora agendado no relogio do audio */
  transitionFx: function(at){ this.kit("dub", at||0); },
  /* kits do intervalo entre discos, todos com at (s a partir de agora). Ensaio: HMFX.kit(nome) */
  kits: {
    /* o kit dub de sempre (one drop, bolha de orgao, sub, telefone), encolhido para caber entre
       o levantar e o pousar; o eco desce antes do pousar (duckEcho no rito) */
    dub: function(fx, a){
      fx.kick(a); fx.rim(a+0.02, true);
      fx.bubble(a+0.24);
      fx.sub(a+0.55);
      fx.rim(a+0.78, true);
      if(Math.random()<0.4) fx.phone(a+0.62);
    },
    backspin: function(fx, a){ fx.rewind(a); },
    spinback: function(fx, a){ fx.spinback(a); },
    tapestop: function(fx, a){ fx.tapeStop(a); },
    riser: function(fx, a){ fx.sweep(a); },
    siren: function(fx, a){ fx.siren(1.1, a); },
    airhorn: function(fx, a){ fx.airhorn(a); },
    echothrow: function(fx, a){ fx.echoThrow(a); }
  },
  kit: function(name, at){
    var f=this.kits[name];
    if(!f || !this.ctx || !this.live()) return false;
    f(this, at||0);
    return true;
  },
  /* o eco abre caminho a agulha: desce entre at e at+0,3 s e volta depois de until */
  duckEcho: function(at, until){
    if(!this.ctx || !this.wet) return;
    var t=this.ctx.currentTime, a=t+(at||0), b=t+(until||((at||0)+1));
    [[this.wet.gain,0.9,0.06],[this.fb.gain,0.52,0.12]].forEach(function(x){
      var g=x[0];
      g.cancelScheduledValues(a);
      g.setValueAtTime(x[1], a); g.linearRampToValueAtTime(x[2], a+0.3);
      g.setValueAtTime(x[2], b); g.linearRampToValueAtTime(x[1], b+0.6);
    });
  },
  /* temporizador no relogio do audio: uma fonte muda que acaba daqui a d s (o onended nao e
     travado num separador em segundo plano, ao contrario do setTimeout) */
  after: function(d, fn){
    if(!this.ctx || this.ctx.state!=="running" || !this.live()) return false;
    try{
      var c=this.ctx, s=c.createConstantSource ? c.createConstantSource() : c.createOscillator(), g=c.createGain();
      g.gain.value=0; s.connect(g); g.connect(c.destination);
      s.onended=function(){ try{ s.disconnect(); g.disconnect(); }catch(e){} fn(); };
      var t=c.currentTime; s.start(t); s.stop(t+Math.max(0.005, d));
      return true;
    }catch(e){ return false; }
  },
  /* corneta de ar (vinda da sala de foco): tres sopros, serra e quadrada a cair um tom */
  airhorn: function(at){
    if(!this.ctx || !this.live()) return;
    var c=this.ctx, self=this, t0=c.currentTime+(at||0);
    for(var i=0;i<3;i++){
      var tt=t0+i*0.34;
      var o1=c.createOscillator(), o2=c.createOscillator(), g=c.createGain();
      o1.type="sawtooth"; o2.type="square";
      o1.frequency.setValueAtTime(452, tt); o1.frequency.exponentialRampToValueAtTime(392, tt+0.22);
      o2.frequency.setValueAtTime(226, tt); o2.frequency.exponentialRampToValueAtTime(196, tt+0.22);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.18, tt+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, tt+0.26);
      o1.connect(g); o2.connect(g); g.connect(self.master);
      var sd=c.createGain(); sd.gain.value=0.3; g.connect(sd); sd.connect(self.echoIn);
      o1.start(tt); o2.start(tt); o1.stop(tt+0.3); o2.stop(tt+0.3);
    }
  },
  /* spinback (vindo da sala de foco): serra de 420 a 28 Hz em 0,85 s, a seco */
  spinback: function(at){
    if(!this.ctx || !this.live()) return;
    var c=this.ctx, t=c.currentTime+(at||0);
    var o=c.createOscillator(), g=c.createGain();
    o.type="sawtooth";
    o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(28, t+0.85);
    g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.9);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+0.95);
  },
  /* tape stop (vindo da sala de foco): serra de 196 a 18 Hz com o filtro a fechar em 1,1 s */
  tapeStop: function(at){
    if(!this.ctx || !this.live()) return;
    var c=this.ctx, t=c.currentTime+(at||0);
    var o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
    o.type="sawtooth";
    o.frequency.setValueAtTime(196, t); o.frequency.exponentialRampToValueAtTime(18, t+1.1);
    f.type="lowpass"; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(140, t+1.1);
    g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t+1.15);
    o.connect(f); f.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+1.2);
  },
  /* atirar ao eco: um acorde curto quase so para o eco, com a realimentacao a subir e a voltar */
  echoThrow: function(at){
    if(!this.ctx || !this.live() || !this.fb) return;
    var c=this.ctx, t=c.currentTime+(at||0), g2=c.createGain();
    var bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1100; bp.Q.value=1.2;
    g2.connect(bp);
    var dry=c.createGain(); dry.gain.value=0.25; bp.connect(dry); dry.connect(this.master);
    var sd=c.createGain(); sd.gain.value=1.0; bp.connect(sd); sd.connect(this.echoIn);
    [174.6, 220, 261.6].forEach(function(f){
      var o=c.createOscillator(); o.type="sawtooth"; o.frequency.value=f;
      o.connect(g2); o.start(t); o.stop(t+0.16);
    });
    this.env(g2, t, 0.004, 0.16, 0.12);
    var fg=this.fb.gain;
    fg.setValueAtTime(0.52, t); fg.linearRampToValueAtTime(0.7, t+0.1);
    fg.setValueAtTime(0.7, t+1.0); fg.linearRampToValueAtTime(0.52, t+1.6);
  },
  /* ---- vinil ao sample: buffers mono gerados em JS (filtros de um polo) e tocados a seco ---- */
  _buf: function(c, secs, fill){
    var n=Math.max(1, Math.floor(c.sampleRate*secs)), b=c.createBuffer(1, n, c.sampleRate);
    fill(b.getChannelData(0), c.sampleRate, n);
    return b;
  },
  _play: function(c, buf, t, gain){
    var src=c.createBufferSource(); src.buffer=buf;
    var g=c.createGain(); g.gain.value=gain;
    src.connect(g); g.connect(this.master);
    src.start(t);
    return src;
  },
  /* sulco: chiado (passa-alto o.hp, dois polos de passa-baixo em o.lp: o chiado de um disco e
     escuro), ronco do prato (~30 Hz, com o balanco de uma volta a 33 1/3) e po (o.ticks por
     segundo, abafado acima de ~7 kHz); o.env(s) da a envolvente */
  _groove: function(d, sr, i0, i1, o){
    var aH=Math.exp(-2*Math.PI*(o.hp||1000)/sr), aL=Math.exp(-2*Math.PI*(o.lp||5500)/sr);
    var aR=Math.exp(-2*Math.PI*30/sr), aK=Math.exp(-2*Math.PI*700/sr), aT=Math.exp(-2*Math.PI*7000/sr);
    var hy=0, hx=0, l1=0, l2=0, r1=0, r2=0, kv=0, ka=0, kd=0, kx=0, ky=0, kl=0, pT=(o.ticks||0)/sr;
    for(var i=i0;i<i1;i++){
      var w=Math.random()*2-1, tt=(i-i0)/sr, e=o.env(tt);
      hy=aH*(hy+w-hx); hx=w; l1=(1-aL)*hy+aL*l1; l2=(1-aL)*l1+aL*l2;
      r1=(1-aR)*w+aR*r1; r2=(1-aR)*r1+aR*r2;
      if(Math.random()<pT){ ka=(Math.random()<0.15) ? 1 : 0.25+0.4*Math.random(); kv=1; kd=Math.exp(-1/(sr*(0.0002+0.0006*Math.random()))); }
      var kn=0;
      if(kv>0.002){ kn=(Math.random()*2-1)*kv*ka; kv*=kd; }
      ky=aK*(ky+kn-kx); kx=kn; kl=(1-aT)*ky+aT*kl;
      d[i]+=e*((o.hiss||0)*l2 + (o.rumble||0)*40*r2*(1+0.25*Math.sin(2*Math.PI*0.555*tt)) + (o.tick||0)*kl);
    }
  },
  /* estalido de banda larga: ruido com decaimento tau, sem graves abaixo de hpHz */
  _burst: function(d, sr, at, amp, tau, hpHz){
    var i0=Math.floor(at*sr), n=Math.floor(tau*9*sr), a=Math.exp(-2*Math.PI*(hpHz||300)/sr), y=0, xp=0;
    for(var j=0;j<n && i0+j<d.length;j++){
      var x=(Math.random()*2-1)*Math.exp(-j/sr/tau);
      y=a*(y+x-xp); xp=x;
      d[i0+j]+=amp*y;
    }
  },
  /* ruido surdo: o mesmo, por um passa-baixo (o peso da capsula) */
  _lpBurst: function(d, sr, at, amp, tau, lpHz){
    var i0=Math.floor(at*sr), n=Math.floor(tau*8*sr), a=Math.exp(-2*Math.PI*(lpHz||400)/sr), y=0;
    var k=1/Math.sqrt((1-a)/(1+a));
    for(var j=0;j<n && i0+j<d.length;j++){
      var x=(Math.random()*2-1)*Math.exp(-j/sr/tau);
      y=(1-a)*x+a*y;
      d[i0+j]+=amp*y*k*0.5;
    }
  },
  /* modos amortecidos [f, amplitude, tau], com um leve deslize de afinacao no ataque */
  _thud: function(d, sr, at, modes, glide){
    var i0=Math.floor(at*sr);
    modes.forEach(function(m){
      var f=m[0], A=m[1], tau=m[2], n=Math.floor(tau*7*sr), ph=Math.random()*0.6;
      for(var j=0;j<n && i0+j<d.length;j++){
        var tt=j/sr;
        ph+=2*Math.PI*f*(1+(glide||0)*Math.exp(-tt/0.012))/sr;
        d[i0+j]+=A*Math.exp(-tt/tau)*(1-Math.exp(-tt/0.0012))*Math.sin(ph);
      }
    });
  },
  /* clique de po ou de rotacao: ruido de 1 ms abafado, com um baque baixo opcional */
  _click: function(d, sr, at, amp, lowHz, lowAmp){
    var i0=Math.floor(at*sr), n=Math.floor(0.05*sr), y=0, a=Math.exp(-2*Math.PI*4000/sr);
    for(var j=0;j<n && i0+j<d.length;j++){
      var tt=j/sr, x=(Math.random()*2-1)*Math.exp(-tt/0.0009);
      y=(1-a)*x+a*y;
      d[i0+j]+=amp*y*3 + (lowAmp||0)*Math.exp(-tt/0.012)*(1-Math.exp(-tt/0.001))*Math.sin(2*Math.PI*(lowHz||60)*tt);
    }
  },
  /* raspar: ruido num passa-banda ressonante que desce de f0 a f1, com o grao das paredes do sulco */
  _scrape: function(d, sr, at, dur, amp, f0, f1){
    var i0=Math.floor(at*sr), n=Math.floor(dur*sr), x1=0, x2=0, y1=0, y2=0, Q=2.2;
    for(var j=0;j<n && i0+j<d.length;j++){
      var u=j/n, f=f0*Math.pow(f1/f0, u), w0=2*Math.PI*f/sr, al=Math.sin(w0)/(2*Q), cw=Math.cos(w0);
      var x=Math.random()*2-1;
      var y=(al*x - al*x2 + 2*cw*y1 - (1-al)*y2)/(1+al);
      x2=x1; x1=x; y2=y1; y1=y;
      var env=Math.min(1, u/0.35)*(u>0.88 ? (1-u)/0.12 : 1);
      d[i0+j]+=amp*env*(0.6+0.4*Math.sin(2*Math.PI*120*j/sr))*y;
    }
  }
''', what='FX crackle..transitionFx')

# 10f) o portao da foley em todos os sons antigos (os novos ja o trazem)
fa=s.index("var FX = {"); fb_=s.index("/* tempo per genre")
fxs=s[fa:fb_]
assert fxs.count("if(!this.ctx) return;")==11, 'FX: %d guardas antigas' % fxs.count("if(!this.ctx) return;")
s=s[:fa]+fxs.replace("if(!this.ctx) return;", "if(!this.ctx || !this.live()) return;")+s[fb_:]

# 10g) onState: o leitor armado avisa que esta pronto; o ENDED do disco no ar levanta a agulha
rep("  if(st === 0 && k === activeKey && !transitioning){ hardNext(\"ended\"); }",
r'''  if(st === 1 && PRE.t && k === PRE.k && !PRE.ready){ markReady(); }
  if(st === 0 && k === activeKey && !REC.on){ endOfRecord(); }''', what='onState ended')

# 10h) onYtError: erro no disco armado (prato livre, ou o unico prato durante o rito) arma outro;
#      o erro no disco no ar so corta fora do rito
cut("  if(code === 153 || code === 2){\n", "  var bad = p.pendingTrack",
r'''  if(code === 153 || code === 2){
    if(PRE.t && k === PRE.k && k !== activeKey){
      /* o prato livre esta bloqueado: os proximos discos armam-se no prato do ar */
      p.noPre = true; dropPre(true);
      if(REC.on){ var t2 = pullTrack(); if(t2){ armDeck(activeKey, t2, 0); } else { recFail(); } }
      return;
    }
    $("slot"+k).classList.add("live");
    $("standby").classList.add("off");
    $("needle").textContent = "player blocked by browser privacy settings";
    $("needle").classList.add("on");
    return;
  }
''', what='onYtError 153')
rep(r'''  if(transitioning && k !== activeKey){
    transitioning = false;
    if(retryCount++ < 4){ startTransition(); }
  } else if(k === activeKey){''',
r'''  if(PRE.t && k === PRE.k){
    var tries = (PRE.tries||0) + 1;
    var nt = (tries <= 4) ? pullTrack() : null;
    if(nt){ armDeck(k, nt, tries); }
    else {
      /* cinco erros seguidos no prato livre: a antecipacao descansa PRE_COOL ms, senao cada volta
         do vigia (600 ms) matava mais cinco discos e uma janela de 40 s esvaziava o bloco inteiro */
      if(tries > 4) preCool = Date.now() + PRE_COOL;
      dropPre(false); if(REC.on) recFail();
    }
  } else if(k === activeKey && !REC.on){''', what='onYtError armed')

# 10i) o rito, a troca seca e a antiga startTransition (agora: levantar ja)
cut("/* hard cut (errors, manual skip): the rig does a fast same-deck swap */", "/* watchdog */",
r'''/* ---------------- o rito da agulha (sala liquida) ----------------
   cada disco toca ate ao fim (ENDED do YouTube); agulha fora; GAP_S depois, no relogio do
   AudioContext (um separador em segundo plano nao o estica), agulha dentro; a musica entra
   DROP_TO_MUSIC_S depois. No computador o disco seguinte espera no prato livre, carregado,
   mudo e parado no inicio; no telemovel (um so leitor) carrega mudo depois do levantar e pousa
   quando os 2 s passaram e o leitor esta pronto. Nada disto passa pelo prepare nem pelo quick do RIG. */
/* kit do intervalo pelo genero do disco que acabou (uma linha por escolha do Paulo); os outros
   generos ficam so com a agulha. Kits: dub, backspin, spinback, tapestop, riser, siren, airhorn,
   echothrow (ensaio: HMFX.kit("airhorn"); render: HMFX.render("ritual-dub")) */
var GAPKIT={ reggae:"dub", dub:"dub", ska_rocksteady:"dub", ragga_jungle:"dub" };
var PRE={}, REC={ on:false }, recSeq=0, preCool=0;
/* a foley da emissao so com a radio audivel: nem em mute, nem de lado (foco, arcada, tapes).
   O mute verifica-se aqui a parte: o portao do FX abre-se em mute para a agulha de uma tape */
function radioFxOk(){
  if(muted || !FX.live()) return false;
  var sd=window.HMSIDE && HMSIDE.src;
  return !(sd && sd.tapes);
}
function acTime(){ return (FX.ctx && FX.ctx.state==="running") ? FX.ctx.currentTime : null; }
/* segundos desde o levantar: relogio do audio; o do sistema so se o audio parar (ac=false) */
function recClock(){
  var pe=(performance.now()-REC.p0)/1000;
  if(REC.a0!=null && FX.ctx && FX.ctx.state==="running"){
    var ae=FX.ctx.currentTime-REC.a0;
    if(pe-ae<=0.5) return { el:ae, ac:true };
  }
  return { el:pe, ac:false };
}
function recEl(){ return recClock().el; }
function recAt(el, fn){
  var id=REC.id, done=false, d=Math.max(0, el-recEl());
  function go(){ if(done || !REC.on || REC.id!==id) return; done=true; fn(); }
  FX.after(d, go);
  setTimeout(go, d*1000);
}
/* o disco seguinte no prato k: carregado, mudo e a volume zero */
function armDeck(k, t, tries){
  var p=P[k];
  PRE={ k:k, t:t, ready:false, tries:tries||0 };
  p.pendingTrack=t;
  fadeVol(p, 0);
  try{ p.yt.mute(); }catch(e){}
  p.loadedId=null;
  ensureLoaded(p, t.v);
}
/* larga o disco armado; back=true devolve-o a frente da caixa do seu genero */
function dropPre(back){
  if(!PRE.t) return;
  var p=P[PRE.k], t=PRE.t;
  if(PRE.k!==activeKey){ try{ p.yt.stopVideo(); }catch(e){} p.loadedId=null; }
  p.pendingTrack=null;
  if(back && pools[t.g] && pools[t.g].length) pools[t.g].unshift(t);
  PRE={};
}
function markReady(){
  if(!PRE.t || PRE.ready) return;
  PRE.ready=true;
  /* no prato livre espera parado no inicio; no prato do ar (telemovel) continua a rodar mudo,
     porque pausar no iOS e arriscado, e volta ao zero no pousar */
  if(PRE.k!==activeKey){ try{ P[PRE.k].yt.pauseVideo(); P[PRE.k].yt.seekTo(0, true); }catch(e){} }
  if(REC.on) recDrop(REC.gap);
}
function preloadNext(){
  if(SIMPLE || PRE.t || REC.on || !radioOn || Date.now() < preCool) return;
  var k=other(activeKey), p=P[k];
  if(!p.ready || p.noPre) return;
  var t=pullTrack(); if(!t) return;
  armDeck(k, t, 0);
}
/* o disco acabou: agulha fora ja, kit do intervalo se o genero o pedir, e o seguinte a caminho */
function endOfRecord(){
  if(REC.on || !radioOn) return;
  /* o seguinte resolve-se antes de qualquer som: sem disco vivo no bloco (todos mortos) fica
     parado e calado, como a troca antiga; o vigia volta aqui a cada 600 ms (o pullTrack e mudo
     e barato) e retoma logo que haja disco, no mais tardar na mudanca de bloco */
  var nt=PRE.t ? null : pullTrack();
  if(!PRE.t && !nt){ try{ fadeVol(P[activeKey], 0); }catch(e){} return; }
  var was=current, a=acTime();
  /* o relogio do rito comeca no inicio agendado do levantar */
  REC={ on:true, id:++recSeq, p0:performance.now()+LIFT_LEAD*1000, a0:(a==null ? null : a+LIFT_LEAD), dropEl:null, gap:GAP_S, kicked:0 };
  transitioning=true;
  try{ fadeVol(P[activeKey], 0); }catch(e){}
  if(radioFxOk()){
    if(REC.a0!=null) FX.needleAt("lift", REC.a0); else FX.needleLift(LIFT_LEAD);
    var kit=was && GAPKIT[was.g];
    if(kit && FX.kit(kit, LIFT_LEAD+0.42)) FX.duckEcho(LIFT_LEAD+1.5, LIFT_LEAD+2.6);
  }
  if(RIG.lift) RIG.lift(LIFT_LEAD*1000);
  if(nt){
    var ik=other(activeKey), idle=P[ik];
    armDeck((!SIMPLE && idle.ready && !idle.noPre) ? ik : activeKey, nt, 0);
  }
  if(PRE.ready) recDrop(GAP_S);
  recWatch();
}
/* salto, erro ou disco encravado com o seguinte ja pronto no prato livre: corta o que toca,
   a agulha pousa logo e a musica entra depois do sulco */
function quickDrop(){
  var out=P[activeKey];
  try{ fadeVol(out, 0); out.yt.pauseVideo(); }catch(e){}
  REC={ on:true, id:++recSeq, p0:performance.now(), a0:acTime(), dropEl:null, gap:0, kicked:0 };
  transitioning=true;
  recDrop(0);
  recWatch();
}
/* agenda o pousar em el (s desde o levantar), nunca antes de agora, e a musica logo a seguir */
function recDrop(want){
  if(!REC.on || REC.dropEl!=null) return;
  var ck=recClock(), now=ck.el, el=Math.max(want, now+0.03), d=el-now;
  REC.dropEl=el;
  if(radioFxOk()){
    /* no relogio do audio o pousar fica preso ao levantar: a0 + el, exatamente */
    if(ck.ac) FX.needleAt("drop", REC.a0+el); else FX.needleDrop(d);
  }
  if(RIG.drop) RIG.drop(Math.round(d*1000));
  recAt(el+DROP_TO_MUSIC_S, recMusic);
}
function recWatch(){
  var id=REC.id;
  var h=setInterval(function(){
    if(!REC.on || REC.id!==id){ clearInterval(h); return; }
    if(REC.dropEl!=null) return;
    var ms=performance.now()-REC.p0, p=PRE.t ? P[PRE.k] : null, st=-9;
    if(p){ try{ st=p.yt.getPlayerState(); }catch(e){} }
    if(p && !PRE.ready && st===1) markReady();
    if(PRE.ready){ recDrop(REC.gap); return; }
    /* um leitor parado sem razao leva um empurrao; sem disco em REC_TIMEOUT, troca seca */
    if(p && ms>5000 && !REC.kicked){ REC.kicked=1; try{ p.yt.playVideo(); }catch(e){} }
    if(ms>REC_TIMEOUT){ clearInterval(h); recFail(); }
  }, 100);
}
/* a musica entra: o disco armado volta ao zero, abre o som em 250 ms (sem estalido digital)
   e passa a ser o disco no ar. Com o separador escondido os temporizadores andam a 1 Hz e a
   rampa prenderia a musica muda um segundo: ai entra logo inteira */
function recMusic(){
  var k=PRE.k, t=PRE.t, outK=activeKey, soft=!document.hidden;
  if(!t){ recFail(); return; }
  var p=P[k];
  try{
    /* primeiro ao zero, so depois abre: no telemovel o disco rodou mudo durante o intervalo */
    p.yt.seekTo(0, true);
    fadeVol(p, soft ? 0 : 1);
    if(!muted) p.yt.unMute();
    p.yt.playVideo();
  }catch(e){}
  if(k!==outK){
    var out=P[outK];
    try{ out.yt.stopVideo(); }catch(e){}
    out.loadedId=null; out.pendingTrack=null;
    $("slot"+k).classList.add("live");
    $("slot"+outK).classList.remove("live");
    activeKey=k; rigDeck=k;
  }
  p.pendingTrack=null;
  PRE={};
  if(RIG.setNext) RIG.setNext(metaFor(t));
  setNow(t, true);
  REC={ on:false }; transitioning=false;
  lastT=0; lastStamp=Date.now();
  if(soft) animClock(250, function(x){ if(activeKey!==k || REC.on) return false; fadeVol(p, x); }, function(){ fadeVol(p, 1); });
}
function recFail(){
  /* o disco novo nao chegou a tempo: troca seca para outro, como num erro */
  dropPre(false);
  REC={ on:false }; transitioning=false;
  hardNext("timeout");
}

/* hard cut (errors, manual skip): the rig does a fast same-deck swap */
function hardNextAudio(t, quiet){
  var p = P[activeKey];
  p.pendingTrack = t;
  setNow(t, true);
  p.loadedId = null;
  ensureLoaded(p, t.v);
  try{ if(!muted) p.yt.unMute(); fadeVol(p, quiet?0:1); }catch(e){}
}
var swapPending=false;
function hardNext(reason){
  if(swapPending || REC.on) return;
  if(reason === "ended"){ endOfRecord(); return; }
  if(PRE.t && PRE.k !== activeKey){
    /* o seguinte ja esta no prato livre: pronto, pousa logo; ainda a carregar, vai para o prato do ar */
    if(PRE.ready){ quickDrop(); return; }
    var tp=PRE.t; dropPre(false); cutTo(tp); return;
  }
  var t = pullTrack(); if(!t) return;
  cutTo(t);
}
function cutTo(t){
  if(RIG.setNext) RIG.setNext(metaFor(t));
  hardNextAudio(t);
  RIG.quick(deckOfPlayer(activeKey));
}
/* sem crossfade na sala liquida: startTransition (HMENG) levanta ja a agulha, o mesmo rito do fim */
function startTransition(){
  if(transitioning || !radioOn) return;
  try{ var p=P[activeKey]; fadeVol(p, 0); p.yt.pauseVideo(); }catch(e){}
  endOfRecord();
}

''', what='rito')

# 10j) vigia: o fim e o ENDED; aqui prepara-se o seguinte, e um disco parado no ultimo segundo
#      (ou em ENDED sem aviso) conta como acabado
rep(r'''    if(cur !== lastT){ lastT=cur; lastStamp=Date.now(); }
    else if(Date.now() - lastStamp > 14000){ hardNext("stalled"); return; }
    if(dur > 0){ RIG.setProgress(deckOfPlayer(activeKey), cur/dur); }
    if(dur > 40 && (dur - cur) <= XFADE_LEAD){ startTransition(); }
  }
}, 600);''',
r'''    if(cur !== lastT){ lastT=cur; lastStamp=Date.now(); }
    else if(dur > 0 && (dur - cur) <= 1.5 && Date.now() - lastStamp > 2500){ endOfRecord(); return; }
    else if(Date.now() - lastStamp > 14000){ hardNext("stalled"); return; }
    if(dur > 0){ RIG.setProgress(deckOfPlayer(activeKey), cur/dur); }
    if(dur > 0 && (dur - cur) <= PRE_LEAD){ preloadNext(); }
  } else if(st === 0){ endOfRecord(); }
}, 600);''', what='vigia')

# 10k) mudanca de bloco: a corneta e foley da emissao, com o mesmo portao
rep("    FX.horn();\n  }\n}, 20000);", "    if(radioFxOk()) FX.horn();\n  }\n}, 20000);", what='corneta')

# 10l) mute: tambem a foley; o disco armado so abre no pousar
rep('''  ["A","B"].forEach(function(k){ var p=P[k]; if(p.ready){ try{ muted ? p.yt.mute() : p.yt.unMute(); }catch(e){} } });''',
r'''  /* o disco armado (a espera no prato, ou a rodar mudo durante o rito) so abre no pousar */
  ["A","B"].forEach(function(k){ var p=P[k]; if(p.ready){ try{ if(muted) p.yt.mute(); else if(!(PRE.t && PRE.k===k)) p.yt.unMute(); }catch(e){} } });
  try{ FX.setVol(masterVol/100, 0.08); }catch(e){}''', what='toggleMute')
# 10l2) os dois caminhos herdados que limpam o mute sem passar pelo toggleMute (o arranque e o
#       "tap for sound") reabrem tambem o portao da foley, senao o master ficava a 0 a sessao toda
rep("p.yt.unMute(); muted=false;", "p.yt.unMute(); muted=false; FX.setVol(masterVol/100);", n=2, what='mute limpo sem toggleMute')

# 10m) HMFX: a agulha das trocas secas com o portao, a agulha fora sem crepitar, kits e ensaio
cut("window.HMFX = {", "window.HMENG = {",
r'''/* ensaio fora de linha: HMFX.render("drop"|"lift"|"ritual"|"ritual-dub"|"crackle"|kit, s)
   devolve uma Promise com um WAV (Blob), para ouvir ou medir sem tocar na emissao */
function fxRender(name, secs){
  var OAC=window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if(!OAC) return Promise.reject(new Error("no OfflineAudioContext"));
  var sr=48000, oc=new OAC(1, Math.ceil((secs||4)*sr), sr);
  var R=Object.create(FX);
  R.ctx=oc; R._ck=null; R._ckT=null; R._bufs={}; R._ckBuf=null; R.live=function(){ return true; };
  R.chain(oc);
  var a=0.05;
  if(name==="lift") R.needleLift(a);
  else if(name==="drop") R.needleDrop(a);
  else if(name==="ritual" || name==="ritual-dub"){
    R.needleLift(a);
    if(name==="ritual-dub"){ R.kit("dub", a+0.42); R.duckEcho(a+1.5, a+2.6); }
    R.needleDrop(a+GAP_S);
  }
  else if(name==="crackle") R.crackle(true);
  else if(!R.kit(name, a)) return Promise.reject(new Error("unknown sound: "+name));
  return oc.startRendering().then(wavOf);
}
function wavOf(buf){
  var ch=buf.getChannelData(0), n=ch.length, sr=buf.sampleRate, ab=new ArrayBuffer(44+n*2), v=new DataView(ab);
  function w(o, str){ for(var i=0;i<str.length;i++) v.setUint8(o+i, str.charCodeAt(i)); }
  w(0,"RIFF"); v.setUint32(4, 36+n*2, true); w(8,"WAVE"); w(12,"fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr*2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36,"data"); v.setUint32(40, n*2, true);
  for(var i=0;i<n;i++){ var x=Math.max(-1, Math.min(1, ch[i])); v.setInt16(44+i*2, x<0 ? x*32768 : x*32767, true); }
  return new Blob([ab], {type:"audio/wav"});
}
window.HMFX = {
  /* agulha das trocas secas (salto, erro, disco encravado, via RIG.quick) e rede de seguranca da
     rampa do primeiro disco: o som so com a emissao audivel; a rampa corre sempre */
  needle: function(){
    if(FX.ctx && FX.ctx.state==="running" && radioFxOk()){ FX.needleDrop(0); }
    rampInFirst();
  },
  /* agulha fora (fim de uma tape): o sulco acaba, raspa, estala baixinho, e silencio */
  lift: function(){
    if(!FX.ctx || FX.ctx.state!=="running") return;
    FX.needleLift(0);
  },
  kits: Object.keys(FX.kits),
  gap: GAPKIT,
  kit: function(name){ FX.resume(); return FX.kit(name, 0.05); },
  render: fxRender,
  level: function(){ return FX.master ? FX.master.gain.value : null; }
};

''', what='HMFX')
rep('''  return { active:activeKey, rigDeck:rigDeck, transitioning:transitioning, radioOn:radioOn, simple:SIMPLE };''',
'''  return { active:activeKey, rigDeck:rigDeck, transitioning:transitioning, radioOn:radioOn, simple:SIMPLE,
    rec:!!REC.on, pre:(PRE.t ? PRE.t.v : null), preK:(PRE.k || null), preReady:!!PRE.ready };''', what='HMENG')
assert 'XFADE_LEAD' not in s and 'RIG.prepare' not in s, '10: restos do crossfade'

# 11) registo de emissao e painel de estaleiro (pedido do Paulo, 10/2026)
#     O motor avisa o window.HMPLOG (liquid/l03-plog.html, montado ANTES do l05) de cada disco:
#     escolhido (o porque fica num WeakMap por objeto de faixa), armado no prato, no ar, e como
#     saiu (lift no fim natural, skip, dev, error, stalled, timeout, block-override...), com a
#     posicao e a duracao. Eventos: blocos, radio de lado, mute, videos mortos ou bloqueados.
#     O HMDEV ganha leituras para os separadores do l09 (copias: nunca mexem na fila), e a fila
#     espreitada do ?dev desfaz-se na mudanca de bloco, para o programa novo nao atrasar tres discos.
#     Tudo defensivo: sem HMPLOG o motor corre igual (o plog engole qualquer erro do registo).
def r11(old, new, n=1, what=''):
    global s
    c=s.count(old)
    assert c==n, '11 %s: ancora encontrada %d vezes (esperadas %d)' % (what or old[:50], c, n)
    s=s.replace(old, new)

# 11a) o porque de cada escolha e o mensageiro do registo
r11('window.HMROT=ROT;\n',
r'''window.HMROT=ROT;
/* registo de emissao (l03): o porque de cada escolha fica no objeto da faixa, e o registo le-o
   quando o disco e armado ou entra no ar. PW: run (continua o genero), adj/adj2 (primo de ADJ, o
   mais proximo ou o segundo), bpm (sem primo no bloco: o BPM mais proximo), weighted (sorteio
   pelas faixas por estrear), force (dawn override) */
var WHY=(typeof WeakMap!=="undefined") ? new WeakMap() : null, PW="run", OPV=null, DDP=false;
function plog(fn){
  try{ var L=window.HMPLOG; if(L && L[fn]) L[fn].apply(L, Array.prototype.slice.call(arguments, 1)); }catch(e){}
}
function whyOf(t){ try{ return (WHY && t && WHY.get(t)) || null; }catch(e){ return null; } }
function plogCtx(t, k){
  return { b:currentBlock, ov:!!OVERRIDE, on:radioOn, dk:k, sm:SIMPLE, bpm:(t.bpm||GBPM[t.g]||120), bx:!!t.bpm };
}
/* fecha a linha do disco no ar com o motivo, a posicao e a duracao do leitor */
function plogEnd(why){
  var p=P[activeKey], cur=null, dur=null;
  try{ cur=p.yt.getCurrentTime(); dur=p.yt.getDuration(); }catch(e){}
  plog("end", current, why, cur, dur);
}
''', what='HMROT')
r11('function nextTrack(){\n', 'function nextTrack(){\n  PW="run"; OPV=null; DDP=false;\n', what='nextTrack')
r11('currentGenre=forceGenre; forceGenre=null; wasBridge=true;',
    'currentGenre=forceGenre; forceGenre=null; wasBridge=true; PW="force";', what='force')
r11('      return (near.length>1 && Math.random()<0.28) ? near[1] : near[0];',
    '      var alt=(near.length>1 && Math.random()<0.28); PW=alt ? "adj2" : "adj";\n'
    '      return alt ? near[1] : near[0];', what='adj')
r11('      return rest[0];', '      PW="bpm"; return rest[0];', what='bpm')
r11('  var r=Math.random()*tot;', '  PW="weighted";\n  var r=Math.random()*tot;', what='weighted')
r11('if(pool[oi].op){ var ob=pool.splice(oi,1)[0]; pool.unshift(ob); break; }',
    'if(pool[oi].op){ var ob=pool.splice(oi,1)[0]; pool.unshift(ob); OPV=ob; break; }', what='opener')
r11('if(current && t && t.v === current.v && pool.length){ pool.push(t); t = pool.shift(); }',
    'if(current && t && t.v === current.v && pool.length){ pool.push(t); t = pool.shift(); DDP=true; }', what='dup')
r11('  runLeft--;\n  return t;\n}\nvar devQ=[];',
r'''  runLeft--;
  try{ if(WHY && t) WHY.set(t, { gw:PW, br:!!wasBridge, op:(t===OPV), dd:DDP, fr:!ROT.map[t.v], lp:(ROT.map[t.v]||0),
    rl:runLeft, pl:pool.length, b:currentBlock, pk:Date.now() }); }catch(e){}
  return t;
}
var devQ=[];''', what='WHY.set')

# 11b) fila espreitada: marca o que veio dela; desfaz-se na mudanca de bloco
r11('function pullTrack(){ return devQ.length ? devQ.shift() : nextTrack(); }',
r'''function pullTrack(){
  if(devQ.length){ var q=devQ.shift(), w=whyOf(q); if(w) w.pq=1; return q; }
  return nextTrack();
}
/* mudanca de bloco no modo de estaleiro: as faixas espreitadas voltam a frente das suas caixas
   e a fila esvazia, para o programa novo entrar logo no disco seguinte, como sem ?dev (antes o
   painel mantinha tres discos do bloco velho na fila). A ponte volta a ser o genero do ultimo
   disco tirado de verdade (o armado no prato, ou o do ar) */
function devUnpeek(){
  for(var i=devQ.length-1; i>=0; i--){
    var t=devQ[i], pl=pools[t.g];
    if(pl && pl.length){ var j=pl.indexOf(t); if(j>=0) pl.splice(j, 1); pl.unshift(t); }
  }
  devQ.length=0;
  var last=PRE.t || current;
  if(last) currentGenre=last.g;
}''', what='pullTrack')
r11('    bridgeG = currentGenre;\n    if(bk==="dawn"){',
r'''    var unp=devQ.length;
    if(unp) devUnpeek();
    plog("event", "block", { from:currentBlock, to:bk, g:currentGenre, unpeeked:unp, pre:(PRE.t ? PRE.t.v : null), rec:!!REC.on });
    bridgeG = currentGenre;
    if(bk==="dawn"){''', what='mudanca de bloco')
r11('      if(PRE.t && !REC.on) dropPre(true);',
    '      if(PRE.t && !REC.on){ plog("end", PRE.t, "block-override"); dropPre(true); }', what='dawn dropPre')

# 11c) entradas: armado no prato, no cartao, no ar (o primeiro disco so no fim da abertura)
r11('function armDeck(k, t, tries){\n  var p=P[k];\n',
    'function armDeck(k, t, tries){\n  var p=P[k];\n  plog("arm", t, whyOf(t), plogCtx(t, k));\n', what='armDeck')
r11('function setNow(t, push){\n  current = t;\n  try{ if(t && t.v) rotMark(t.v); }catch(e){}',
    'function setNow(t, push){\n  current = t;\n  plog("start", t, whyOf(t), plogCtx(t, activeKey));\n  try{ if(t && t.v) rotMark(t.v); }catch(e){}',
    what='setNow')
r11('function beginRadio(){\n  radioOn = true;\n',
    'function beginRadio(){\n  radioOn = true;\n  plog("event", "begin", { b:currentBlock, ov:OVERRIDE, sm:SIMPLE, dev:!!(window.HMDEV && HMDEV.on) });\n',
    what='beginRadio')
r11('firstLogged = true; pushHistory(current);',
    'firstLogged = true; pushHistory(current); plog("air", current);', what='primeiro no ar')
r11('function onState(k, st){\n',
    'function onState(k, st){\n  plog("state", k, st, P[k].pendingTrack || (k===activeKey ? current : null), k===activeKey);\n',
    what='onState')
r11('    if(dur > 0){ RIG.setProgress(deckOfPlayer(activeKey), cur/dur); }\n',
    '    plog("tick", current, cur, dur, (window.HMSIDE ? HMSIDE.f : 1), muted);\n'
    '    if(dur > 0){ RIG.setProgress(deckOfPlayer(activeKey), cur/dur); }\n', what='vigia tick')

# 11d) saidas: o fim natural levanta a agulha (lift); os outros motivos vem do hardNext
r11('function endOfRecord(){\n  if(REC.on || !radioOn) return;\n',
    'function endOfRecord(why){\n  if(REC.on || !radioOn) return;\n  plogEnd(why || "lift");\n', what='endOfRecord')
r11('    else if(dur > 0 && (dur - cur) <= 1.5 && Date.now() - lastStamp > 2500){ endOfRecord(); return; }',
    '    else if(dur > 0 && (dur - cur) <= 1.5 && Date.now() - lastStamp > 2500){ endOfRecord("lift-frozen"); return; }',
    what='vigia parado no fim')
r11('  } else if(st === 0){ endOfRecord(); }', '  } else if(st === 0){ endOfRecord("lift-wd"); }', what='vigia ENDED')
r11('  try{ var p=P[activeKey]; fadeVol(p, 0); p.yt.pauseVideo(); }catch(e){}\n  endOfRecord();\n}',
    '  try{ var p=P[activeKey]; fadeVol(p, 0); p.yt.pauseVideo(); }catch(e){}\n  endOfRecord("lift-now");\n}',
    what='startTransition')
r11('function hardNext(reason){\n  if(swapPending || REC.on) return;\n  if(reason === "ended"){ endOfRecord(); return; }\n',
    'function hardNext(reason){\n  if(swapPending || REC.on) return;\n  if(reason === "ended"){ endOfRecord(); return; }\n'
    '  plogEnd(reason || "skip");\n', what='hardNext')
r11('setTimeout(hardNext, 350)', 'setTimeout(function(){ hardNext("skip"); }, 350)', what='salto ganho')
r11('  /* o disco novo nao chegou a tempo: troca seca para outro, como num erro */\n  dropPre(false);',
    '  /* o disco novo nao chegou a tempo: troca seca para outro, como num erro */\n'
    '  if(PRE.t) plog("end", PRE.t, "timeout");\n  dropPre(false);', what='recFail')

# 11e) erros: o video morto (no ar ou armado) e o leitor bloqueado
r11('  if(bad){ deadIds[bad.v] = true; }',
    '  if(bad){ deadIds[bad.v] = true; plog("dead", bad, code, k, (PRE.t && bad===PRE.t) ? "armed" : "air"); }', what='dead')
r11('  if(PRE.t && k === PRE.k){\n    var tries = (PRE.tries||0) + 1;',
    '  if(PRE.t && k === PRE.k){\n    plog("end", PRE.t, "error");\n    var tries = (PRE.tries||0) + 1;', what='erro armado')
r11('  if(code === 153 || code === 2){\n',
    '  if(code === 153 || code === 2){\n    plog("event", "blocked", { v:(p.loadedId || ""), code:code, deck:k, armed:!!(PRE.t && k === PRE.k) });\n',
    what='bloqueado')
r11('p.noPre = true; dropPre(true);', 'p.noPre = true; plog("end", PRE.t, "blocked"); dropPre(true);', what='prato bloqueado')

# 11f) radio de lado (foco, arcada, tapes) e mute
r11('function sideFade(key, on, ms){\n  HMSIDE.src[key]=!!on;',
    'function sideFade(key, on, ms){\n  if(!HMSIDE.src[key] !== !on) plog("event", "side", { k:key, on:!!on });\n  HMSIDE.src[key]=!!on;',
    what='sideFade')
r11('function toggleMute(){\n  muted = !muted;\n',
    'function toggleMute(){\n  muted = !muted;\n  plog("event", "mute", { on:muted });\n', what='toggleMute')

# 11f2) as teclas da emissao (m, f, v, seta) nao disparam a escrever no gift a tune (textarea)
r11('  if(e.target && (e.target.tagName==="INPUT")) return;',
    '  if(e.target && (e.target.tagName==="INPUT" || e.target.tagName==="TEXTAREA" || e.target.tagName==="SELECT" || e.target.isContentEditable)) return;',
    what='teclas a escrever')

# 11g) HMDEV: leituras para os separadores do painel (copias; so o Next espreita a fila)
assert s.count('var base=3+Math.floor(Math.random()*3);')==1 and s.count('  return Math.max(1, Math.min(base, Math.ceil(n/2)));')==1, \
    '11: o runFor mudou, rever o runCap do HMDEV'
r11('  skip: function(){ try{ hardNext("dev"); }catch(e){} }\n};',
r'''  skip: function(){ try{ hardNext("dev"); }catch(e){} },
  /* leituras para os separadores do painel (l09): copias, nunca mexem na fila nem na emissao */
  state: function(){
    return { block:currentBlock, override:OVERRIDE, genre:currentGenre, runLeft:runLeft, bridgeG:bridgeG, forceGenre:forceGenre,
      current:(current ? current.v : null), radioOn:radioOn, simple:SIMPLE, transitioning:transitioning, rec:!!REC.on,
      pre:(PRE.t ? { v:PRE.t.v, a:PRE.t.a, t:PRE.t.t, g:PRE.t.g, k:PRE.k, ready:!!PRE.ready } : null),
      active:activeKey, side:(window.HMSIDE ? HMSIDE.f : 1), muted:muted,
      dead:Object.keys(deadIds), peeked:devQ.map(function(t){ return t.v; }) };
  },
  pools: function(){
    var o={};
    Object.keys(pools).forEach(function(g){ o[g]=(pools[g] || []).map(function(t){ return t.v; }); });
    return o;
  },
  gbpm: JSON.parse(JSON.stringify(GBPM)),
  adj: JSON.parse(JSON.stringify(ADJ)),
  /* o runFor sorteia 3 a 5 discos por genero, no maximo metade da caixa (pelo menos 1) */
  runCap: function(g){
    var n=TRACKS.filter(function(t){ return t.g===g && !deadIds[t.v]; }).length, c=Math.ceil(n/2);
    return [Math.max(1, Math.min(3, c)), Math.max(1, Math.min(5, c))];
  },
  blockAt: function(h){ return blockKeyFor(h); }
};''', what='HMDEV')
assert s.count('plog("')==16, '11: ganchos do registo: %d' % s.count('plog("')

open('liquid/l05-engine.html','w',encoding='utf-8').write(s)
print('l05 regenerado:',len(s))
