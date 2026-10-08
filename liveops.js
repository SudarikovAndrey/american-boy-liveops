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
  // ---- Окно ивента = готовые окна прототипа «Прогресс · Пропуск · Топ» + кнопка «Играть» ----
  const booting=()=>{const b=document.getElementById('boot');return !!b&&b.isConnected&&!b.hidden&&getComputedStyle(b).display!=='none';};
  // Стартовый экран принимает «Играть» только когда поле загружено (start-screen.js: MobileHost.ready).
  const startGame=()=>{let n=0;const tick=()=>{if(!booting())return;
    if(window.MobileHost&&window.MobileHost.ready){const p=document.getElementById('startPlay');if(p){p.disabled=false;p.click();}}
    if(++n<300)setTimeout(tick,200);};tick();};
  // Партия уже есть — игра стартует сама за главным экраном кора. Пока её стартовый экран
  // не пройден, игра держит интерфейс инертным и ни одна кнопка не нажимается.
  if(typeof S!=='undefined'&&S&&S.player)setTimeout(startGame,0);
  let fromWidget=false,closedByX=false;
  const addPlay=()=>{
    if(!fromWidget||$('modal').hidden)return;
    const card=$('card');if(!card.querySelector('[data-tab]')||card.querySelector('#loPlay'))return;
    const b=document.createElement('button');b.id='loPlay';b.type='button';b.textContent='Играть';
    b.onclick=()=>closeModal();
    card.append(b);
  };
  if(card){new MutationObserver(addPlay).observe(card,{childList:true,subtree:true});
    card.addEventListener('click',e=>{if(fromWidget&&e.target.closest('#hNo,.xhead,.painted-close,.window-close'))closedByX=true;},true);}
  const openEvent=async()=>{
    if(typeof moving!=='undefined'&&moving)return;
    core.hidden=true;exit.hidden=false;
    if(booting()){startGame();return;}            // новый игрок — сначала онбординг ивента
    fromWidget=true;closedByX=false;
    try{await eventHub('ticket');}catch(e){}
    fromWidget=false;
    if(closedByX)show(true);                      // закрыл крестиком — обратно на главный экран; «Играть» и «К поставке» — остаёмся в игре
  };
  document.getElementById('loWidget').onclick=openEvent;
  exit.onclick=()=>{if(typeof moving!=='undefined'&&moving)return;show(true);};
  setInterval(()=>{if(!core.hidden)document.getElementById('loTime').textContent=timeLeft();},30000);
  show(true);
})();
