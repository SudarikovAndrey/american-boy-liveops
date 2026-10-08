// ===== Прототип LiveOps-ивента для Block Boss =====
// Слой поверх сборки игры (tools/build_liveops.py): только ивент — онбординг, обучение,
// Бруклин с улицами по дням и фура раз в день. Без мультиплеера, других карт,
// однорукого бандита и «21». День = календарные сутки; закончить день вручную
// может только ведущий показа — в скрытом «Меню тестирования»
// (5 быстрых тапов по заголовку «Настройки аккаунта»).
(function(){
  // Угловые клетки 10 и 30 — «Шанс». Партии, начатые до этого, переводим на лету.
  if(typeof S!=='undefined'&&S&&S.tiles){
    let moved=false;
    for(const i of [10,30]){const t=S.tiles[i];if(t&&t.type!=='chance'){t.type='chance';t.zone=-1;t.owner=null;moved=true;}}
    if(moved){try{save();render();}catch(e){}}
  }
  // День закрывает полночь, а не игрок.
  dayCard=async function(){
    const u=dayUnlocks(S.day,true), nx=CFG.MILESTONES.find(m=>S.pts<m.pts);
    const last=S.day>=CFG.DAYS;
    const v=await modal(`<h2>📅 День ${S.day} из ${CFG.DAYS}</h2>
      <div class="row"><span class="n">Ходы</span><span class="v">${S.rolls}</span></div>
      <div class="row"><span class="n">Поставка</span><span class="v">${S.parcelSent?'отправлена':'ещё нет'}</span></div>
      <div class="row"><span class="n">Очки${nx?' до «'+nx.name+'»':''}</span><span class="v">${S.pts}${nx?'/'+nx.pts:''}</span></div>
      ${u.length?`<div class="row"><span class="n">Сегодня открылось<small>${u.join(' · ')}</small></span></div>`:''}
      <p class="t">${last?'Последний день ивента. В полночь неделя закончится и Джонни подведёт итоги.':'Новый день начнётся в полночь: новые задания, а иногда и новая улица. Ходы восстанавливаются сами.'}</p>`,
      last&&S.parcelSent?[{t:'🏁 Подвести итоги недели',v:2,cls:'ok'},{t:'Играть дальше',v:0,cls:'sec'}]:[{t:'Играть дальше',v:0,cls:'ok'}]);
    if(v===2)return finish();
  };
  endDayOffer=async function(){
    await modal(`<h2>🎲 Ходы на сегодня всё</h2>
      <p>Ходы восстанавливаются сами: +1 каждые ${CFG.REGEN_MIN} мин, до ${CFG.ROLLS_PER_DAY}.</p>
      <p>${S.parcelSent?'Поставка сегодня уже ушла.':'Не забудь отправить поставку — в полночь фура уедет сама.'}</p>`,
      [{t:'Понял',v:0,cls:'ok'}]);
  };

  // Убрать отладку и выбор карты из меню: в прототипе всегда Бруклин.
  const clean=()=>{
    const card=document.getElementById('card');if(!card)return;
    card.querySelectorAll('.map-row,select[aria-label="Карта поля"]').forEach(n=>(n.closest('.row,.map-row')||n).remove());
    card.querySelectorAll('button').forEach(b=>{if(/коллайдер|карт[ау] ветров/i.test(b.textContent))b.remove();});
    card.querySelectorAll('.mbtns').forEach(r=>{if(!r.children.length&&!r.classList.contains('audio-toggles'))r.remove();});
    const day=card.querySelector('#cDay2');const note=day&&day.closest('.row')?.querySelector('small');
    if(note&&!note.dataset.lo){note.dataset.lo='1';note.textContent='только для показа: сразу переводит игру в следующий день';}
  };
  const card=document.getElementById('card');
  if(card)new MutationObserver(clean).observe(card,{childList:true,subtree:true});
  document.title='Америкэн бой — прототип ивента';

  // ---- Фейковый главный экран Block Boss ----
  // Старт — с главного экрана кора; тап по виджету ивента открывает ивент.
  // Кнопка «← Выход» в ивенте возвращает на главный экран, прогресс сохраняется.
  const core=document.createElement('div');core.id='loCore';
  core.innerHTML='<div class="lo-stage" role="img" aria-label="Главный экран Block Boss">'+
    '<button id="loWidget" type="button" aria-label="Открыть ивент «Америкэн бой»">'+
    '<img src="assets/icons/hud-johnny.webp" alt=""><span class="lo-time" id="loTime"></span><span class="lo-dot"></span>'+
    '<span class="lo-hint">Америкэн бой</span></button></div>';
  document.body.append(core);
  const exit=document.createElement('button');exit.id='loExit';exit.type='button';
  exit.setAttribute('aria-label','Выйти на главный экран Block Boss');exit.innerHTML='<b>←</b>Выход';
  document.body.append(exit);
  const timeLeft=()=>{
    const day=(typeof S!=='undefined'&&S&&S.day)||1,days=Math.max(0,CFG.DAYS-day);
    const now=new Date(),mid=new Date(now);mid.setHours(24,0,0,0);const h=Math.floor((mid-now)/36e5);
    return days>0?`${days}д : ${h}ч`:`${h}ч : ${Math.floor((mid-now)%36e5/6e4)}м`;
  };
  const show=on=>{core.hidden=!on;exit.hidden=on;if(on)document.getElementById('loTime').textContent=timeLeft();};
  // ---- Окно ивента по стандартной форме Block Boss ----
  const ev=document.createElement('div');ev.id='loEvent';ev.hidden=true;
  ev.innerHTML=`<div class="le-sheet" role="dialog" aria-label="Ивент «Америкэн бой»"><div class="le-bg"></div>
    <div class="le-head"><img class="le-hero" src="assets/start/johnny-v2.webp" alt="">
      <h1>Америкэн<br>бой</h1>
      <div class="le-info"><button class="le-i" id="leRules" type="button" aria-label="Правила ивента">i</button><span class="le-timer" id="leTimer"></span></div>
      <button class="le-close" id="leClose" type="button" aria-label="Закрыть">×</button></div>
    <div class="le-body">
      <div class="le-ms" id="leMs"></div>
      <div class="le-bar"><b id="leBar"></b><span id="leBarTxt"></span></div>
      <div class="le-prize"><div class="le-card"><img src="assets/icons/hud-johnny.webp" alt=""><small>Легендарный</small></div>
        <div><h2>Главный приз</h2><p>Джонни — легендарный пацан в твою банду</p></div></div>
      <div class="le-rows">
        <div class="le-row"><span class="le-ic" style="background:#c8452f">🎲</span><span><b>Бросай кубики, скупай точки</b><small>30 ходов в день, ходы копятся сами</small></span></div>
        <div class="le-row"><span class="le-ic" style="background:#7e70b1">🚚</span><span><b>Каждый день отправляй фуру</b><small>товар в фуре — это очки</small></span></div>
        <div class="le-row"><span class="le-ic" style="background:#f1e3c2">🎫</span><span><b>375 очков — Джонни в банде</b><small>800 и 1350 — прокачка до 60 и 80 ур.</small></span></div>
      </div>
      <nav class="le-tabs" aria-label="Разделы ивента"><button type="button" class="on" data-go="play">Играть</button><button type="button" data-go="ticket">Рубежи</button><button type="button" data-go="pass">Пропуск</button><button type="button" data-go="lb">Топ</button></nav>
    </div></div>`;
  document.body.append(ev);
  const booting=()=>{const b=document.getElementById('boot');return !!b&&b.isConnected&&!b.hidden&&getComputedStyle(b).display!=='none';};
  const fillEvent=()=>{
    const pts=(typeof S!=='undefined'&&S&&S.pts)||0,ms=CFG.MILESTONES,next=ms.find(m=>pts<m.pts)||ms[ms.length-1];
    document.getElementById('leTimer').textContent='◷ '+timeLeft();
    document.getElementById('leMs').innerHTML=ms.map(m=>`<span class="${pts>=m.pts?'done':''}"><i></i>${m.pts}</span>`).join('');
    document.getElementById('leBar').style.width=Math.min(100,pts/next.pts*100)+'%';
    document.getElementById('leBarTxt').textContent=`${pts} / ${next.pts}`;
  };
  const openEvent=()=>{fillEvent();ev.hidden=false;core.hidden=true;exit.hidden=true;};
  const enter=then=>{
    ev.hidden=true;core.hidden=true;exit.hidden=false;
    if(booting()){const p=document.getElementById('startPlay');if(p)p.click();return;} // первый вход — онбординг игры
    if(then&&!moving)then();
  };
  ev.querySelectorAll('.le-tabs button').forEach(b=>b.onclick=()=>{const g=b.dataset.go;enter(g==='play'?null:()=>eventHub(g));});
  document.getElementById('leClose').onclick=()=>{ev.hidden=true;show(true);};
  document.getElementById('leRules').onclick=()=>enter(()=>openHelp());
  document.getElementById('loWidget').onclick=openEvent;
  exit.onclick=()=>{if(typeof moving!=='undefined'&&moving)return;show(true);};
  setInterval(()=>{if(!core.hidden)document.getElementById('loTime').textContent=timeLeft();},30000);
  show(true);
})();
