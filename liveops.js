// ===== Прототип LiveOps-ивента для Block Boss =====
// Слой поверх сборки игры (tools/build_liveops.py): только ивент — онбординг, обучение,
// Бруклин с улицами по дням и фура раз в день. Без мультиплеера, других карт,
// однорукого бандита и «21». День = календарные сутки; закончить день вручную
// может только ведущий показа — в скрытом «Меню тестирования»
// (5 быстрых тапов по заголовку «Настройки аккаунта»).
(function(){
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
})();
