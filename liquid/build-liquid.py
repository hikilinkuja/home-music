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
  /* arma a rampa do primeiro disco; sem foley nenhum, o sulco real ja soou */
  if(firstRampPending){ firstRampPending=false; rampInFirst(); }
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
new_sf="""window.HMSIDE={ f:1, src:{}, h:null };
function sideFade(key, on, ms){
  HMSIDE.src[key]=!!on;
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

open('liquid/l05-engine.html','w',encoding='utf-8').write(s)
print('l05 regenerado:',len(s))
