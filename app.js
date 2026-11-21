'use strict';
const KEY='forma12_state_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localISO=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDate=s=>new Date(`${s}T12:00:00`);
const plusDays=(s,n)=>{let d=parseDate(s);d.setDate(d.getDate()+n);return localISO(d)};
const weekMonday=(s)=>plusDays(s,-((parseDate(s).getDay()+6)%7));
const diffDays=(a,b)=>Math.round((parseDate(a)-parseDate(b))/86400000);
const niceDate=(s,options={day:'numeric',month:'short'})=>parseDate(s).toLocaleDateString('ru-RU',options);
const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const activities=[{id:'strength',label:'Силовая тренировка',days:[0,2,4],time:'18:00',mins:35},{id:'cardio',label:'Бег + ходьба',days:[1,5],time:'10:00',mins:35},{id:'walk',label:'Вечерняя прогулка',days:[0,1,2,3,4,5,6],time:'19:15',mins:35}];
const defTimes={strength:'18:00',cardio:'10:00',walk:'19:15',review:'20:30'};
const nextMonday=()=>plusDays(weekMonday(localISO()),7);
const newCourse=(start=nextMonday(),number=1,params={})=>({id:Date.now()+'-'+number,number,start,created:localISO(),completed:{},reviews:{},adjustments:{},baseline:{pushups:15,feeling:'После долгого перерыва',photoNotes:'',...params}});
const defaultState=()=>({version:1,course:newCourse(),history:[],times:{...defTimes},tab:'home',selected:localISO(),seenWeek:0});
let state;
try{const stored=JSON.parse(localStorage.getItem(KEY));state=stored?.version===1&&stored.course?{...defaultState(),...stored,times:{...defTimes,...stored.times}}:defaultState()}catch{state=defaultState()}
let timer={duration:90,remaining:90,running:false,ends:0,interval:null};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{toast('Не удалось сохранить данные. Проверь хранилище браузера.')}};
const today=()=>localISO();
const courseWeek=(date=today())=>Math.floor(diffDays(date,state.course.start)/7);
const currentWeek=()=>Math.max(0,Math.min(11,courseWeek()));
const weekStart=w=>plusDays(state.course.start,7*w);
const weekEnd=w=>plusDays(weekStart(w),6);
const keyFor=(date,id)=>`${date}_${id}`;
const allActivities=date=>{const weekday=(parseDate(date).getDay()+6)%7;return activities.filter(a=>a.days.includes(weekday))};
const done=(date,id)=>!!state.course.completed[keyFor(date,id)];
const setDone=(date,id,val)=>{if(val)state.course.completed[keyFor(date,id)]=true;else delete state.course.completed[keyFor(date,id)];save();render()};
function toast(s){$('.snackbar')?.remove();const e=document.createElement('div');e.className='snackbar';e.textContent=s;document.body.append(e);setTimeout(()=>e.remove(),3500)}
function progressWeek(w){let total=0,completed=0;for(let i=0;i<7;i++){let date=plusDays(weekStart(w),i);for(const a of allActivities(date)){total++;if(done(date,a.id))completed++}}return {total,completed,pct:Math.round(completed/Math.max(1,total)*100)}}
function exercisePlan(w){const adj=state.course.adjustments[w]||{};const basePush=[8,10,8,10,10,11,12,10,11,12,12,12][w];const sets=w<2?2:3;const pushSets=w===7?2:sets;
 const baseline=Number(state.course.baseline.pushups)||15;const scaled=Math.round(basePush*baseline/15);const push=Math.max(1,Math.min(30,scaled+(adj.push||0),Math.max(1,baseline-2)));const squats=Math.max(6,Math.min(35,[10,12,12,14,14,15,16,12,16,17,18,18][w]+(adj.squat||0)));
 const row=Math.max(6,Math.min(30,[10,10,12,12,12,13,14,10,14,15,15,16][w]+(adj.row||0)));
 const bridge=Math.max(6,Math.min(35,[12,12,14,14,15,15,16,12,16,17,18,18][w]+(adj.bridge||0)));
 const plank=Math.max(10,Math.min(120,[20,25,25,30,30,35,40,25,40,45,45,50][w]+(adj.plank||0)));
 return [{key:'push',name:'Отжимания',desc:'Сохраняй запас 2–3 повтора',presc:`${pushSets} × ${push}`,count:push},{key:'squat',name:'Приседания',desc:'Плавно, пятки на полу',presc:`${sets} × ${squats}`,count:squats},{key:'row',name:'Тяга рюкзака',desc:'Стабильная спина, лёгкий вес',presc:`${sets} × ${row}`,count:row},{key:'bridge',name:'Ягодичный мостик',desc:'Без прогиба в пояснице',presc:`${sets} × ${bridge}`,count:bridge},{key:'plank',name:'Планка',desc:'Без провисания корпуса',presc:`2 × ${plank} сек`,count:plank}]}
function cardioPlan(w){const periods=[[1,3,5],[2,3,5],[3,2,5],[4,2,5],[4,2,5],[5,2,4],[6,2,4],[3,2,5],[7,2,4],[8,2,4],[10,2,3],[12,2,3]];const [run,walk,loops]=periods[w];return {run,walk,loops,total:(run+walk)*loops};}
const tabs = [
  ['home', 'Сегодня', 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'],
  ['plan', 'Курс', 'M4 6h16v14H4z M8 3v6m8-6v6M4 11h16m-12 4h2m4 0h2'],
  ['review', 'Итоги', 'M4 20h16M6 16v-4m6 4V8m6 8V4'],
  ['timer', 'Таймер', 'M9 2h6m-3 2v2m6 2 2-2m0 8a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4v4l2 2'],
  ['settings', 'Настройки', 'M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-6 2v4']
];
const pageTitles = {home: 'Тренировки', plan: 'План курса', review: 'Итоги недели', timer: 'Таймер', settings: 'Настройки'};
const dayTypes = {
  strength: {label: 'Силовая', icon: 'M3 9v6m3-8v10m0-5h12m0-5v10m3-8v6'},
  cardio: {label: 'Кардио', icon: 'M2 12h5l3-6 4 12 3-6h5'},
  rest: {label: 'Чилл', icon: 'M19 15a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z'}
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const icon = path => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;

function shell(content) {
  const w = currentWeek(), p = progressWeek(w), elapsed = courseWeek();
  const dates = `${niceDate(weekStart(w))} — ${niceDate(weekEnd(w))}`;
  const status = elapsed < 0 ? 'Курс начнётся ' + niceDate(state.course.start, {day: 'numeric', month: 'long'})
    : elapsed > 11 ? 'Курс завершён' : `Неделя ${w+1} из 12 · ${dates}`;
  const total = Object.values(state.course.completed).filter(Boolean).length;
  const stats = state.tab === 'home' ? `<div class="stats">
    <div class="stat"><strong>${elapsed < 0 ? '0' : Math.min(12, elapsed+1)}<small>/12</small></strong><span>Неделя курса</span></div>
    <div class="stat"><strong>${p.pct}%</strong><span>План недели</span></div>
    <div class="stat"><strong>${total}</strong><span>Отметок за курс</span></div>
  </div>` : '';
  $('#app').innerHTML = `<header class="top">
    <div class="topline"><div class="intro"><span class="logo" aria-hidden="true">12</span><span class="brand">ФОРМА 12</span></div><span class="course-status">Курс ${state.course.number}</span></div>
    <h1 class="hero">${pageTitles[state.tab] || pageTitles.home}</h1>
    <div class="sub">${status}</div>${stats}
  </header><main class="content">${content}<p class="footer">Прогресс хранится на этом устройстве. Резервная копия доступна в настройках.<br>Боль и необычная одышка — повод остановить нагрузку.</p></main>
  <nav class="bottomnav" aria-label="Разделы приложения"><div class="navinner">
    ${tabs.map(([id, label, path]) => `<button class="navbutton ${state.tab === id ? 'active' : ''}" data-tab="${id}" ${state.tab === id ? 'aria-current="page"' : ''}>${icon(path)}<span>${label}</span></button>`).join('')}
  </div></nav>`;
  document.querySelectorAll('[data-tab]').forEach(button => button.onclick = event => {
    if (state.tab === button.dataset.tab) {
      window.scrollTo(0, 0);
      return;
    }
    state.tab = button.dataset.tab;
    if (['plan', 'review'].includes(state.tab)) state.seenWeek = currentWeek();
    render();
    window.scrollTo(0, 0);
    if (event.detail === 0) $(`[data-tab="${state.tab}"]`).focus({preventScroll: true});
  });
}

function dayBadge(type) {
  return `<span class="day-badge ${type}">${icon(dayTypes[type].icon)}</span>`;
}

function dayButton(date, selected, i) {
  const items = allActivities(date);
  const type = items.find(activity => activity.id !== 'walk')?.id || 'rest';
  const completed = items.every(activity => done(date, activity.id));
  const isToday = date === today();
  const dateLabel = niceDate(date, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
  return `<button class="day ${isToday ? 'today' : ''} ${date === selected ? 'selected' : ''}" data-day="${date}"
    aria-pressed="${date === selected}" ${isToday ? 'aria-current="date"' : ''}
    aria-label="${dateLabel}, ${dayTypes[type].label}${completed ? ', всё выполнено' : ''}">
    <small>${weekdays[i]}</small><strong>${parseDate(date).getDate()}</strong>${dayBadge(type)}
    ${completed ? '<span class="day-done" aria-hidden="true">✓</span>' : ''}
  </button>`;
}

function animateWeek(element, direction) {
  if (!element || !direction || reducedMotion.matches || !element.animate) return;
  const offset = direction * 14;
  element.animate(
    [{opacity: .55, transform: `translateX(${offset}px)`}, {opacity: 1, transform: 'translateX(0)'}],
    {duration: 290, easing: 'cubic-bezier(.2,.75,.25,1)'}
  );
}

function bindWeekSwipe(element, move) {
  let start;
  element.addEventListener('touchstart', event => {
    const touch = event.touches.length === 1 ? event.touches[0] : null;
    start = touch ? [touch.clientX, touch.clientY] : null;
  }, {passive: true});
  element.addEventListener('touchcancel', () => { start = null; }, {passive: true});
  element.addEventListener('touchend', event => {
    if (!start || event.touches.length || !event.cancelable) return;
    const {clientX, clientY} = event.changedTouches[0];
    const dx = clientX - start[0], dy = clientY - start[1];
    start = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    event.preventDefault();
    move(dx < 0 ? 1 : -1);
  }, {passive: false});
}

function home(direction = 0) {
  const t = today(), selected = state.selected ?? t;
  const weekDays = Array.from({length: 7}, (_, i) => plusDays(weekMonday(selected), i));
  const items = allActivities(selected);
  const completed = items.filter(activity => done(selected, activity.id)).length;
  const pct = Math.round(completed / items.length * 100);
  const w = courseWeek(selected);
  const strength = items.some(activity => activity.id === 'strength');
  const cardio = items.some(activity => activity.id === 'cardio');
  const cp = w >= 0 && w < 12 && cardio ? cardioPlan(w) : null;
  shell(`<section aria-labelledby="calendarHeading">
    <div class="sectionhead"><h2 id="calendarHeading">Календарь</h2><button class="btn ghost" id="goToday">К сегодня</button></div>
    <div class="panel calendar-panel glass">
      <div class="week-controls">
        <button class="btn icon-button" id="prevWeek" aria-label="Предыдущая неделя">${icon('m15 5-7 7 7 7')}</button>
        <div class="week-range" id="weekRange">${niceDate(weekDays[0])} — ${niceDate(weekDays[6])}</div>
        <button class="btn icon-button" id="nextWeek" aria-label="Следующая неделя">${icon('m9 5 7 7-7 7')}</button>
      </div>
      <div class="week-window"><div class="weekrow">${weekDays.map((date, i) => dayButton(date, selected, i)).join('')}</div></div>
      <div class="week-legend">${Object.entries(dayTypes).map(([type, {label}]) => `<span>${dayBadge(type)}${label}</span>`).join('')}</div>
    </div>
  </section>
  <section aria-labelledby="dayHeading">
    <div class="sectionhead day-heading"><div><h2 id="dayHeading">${selected === t ? 'Сегодня' : niceDate(selected, {weekday: 'long'})}</h2><span class="selected-date">${niceDate(selected, {day: 'numeric', month: 'long'})}</span></div><span class="tag">${completed} из ${items.length} выполнено</span></div>
    <div class="panel activity-panel">${items.map(a => `<label class="activity"><span class="activity-icon" aria-hidden="true">${a.id === 'walk' ? icon('M14 4a2 2 0 1 0 0 .01ZM7 21l3-5m3-7 2 4 4 1m-5 7-2-5-3-2 2-5-4 2-2 3') : icon(dayTypes[a.id].icon)}</span><span class="details"><strong>${a.label}</strong><small>${esc(state.times[a.id])} · ${a.id === 'strength' ? '25–35' : '30–40'} мин</small></span><input class="check" type="checkbox" data-check="${a.id}" ${done(selected, a.id) ? 'checked' : ''} aria-label="Отметить: ${a.label}"></label>`).join('')}
    <div class="progress" role="progressbar" aria-label="Прогресс дня" aria-valuenow="${pct}"><div style="width:${pct}%"></div></div></div>
    ${w >= 0 && w < 12 ? `<div class="panel accent"><h3>${strength ? 'План силовой' : cardio ? 'План кардио' : 'Восстановление'}</h3>
    <p>${strength ? exercisePlan(w).map(x => `${x.name}: ${x.presc}`).join(' · ') : cp ? `Бег ${cp.run} мин / ходьба ${cp.walk} мин × ${cp.loops}. Добавь разминку и заминку.` : 'Спокойная прогулка в комфортном темпе.'}</p>
    <button class="btn primary" id="showPlan">Весь план недели →</button></div>` : ''}
  </section>
  <div class="panel"><h3>Твой ритм</h3><p>Прогулки каждый день. В воскресенье — обзор недели.</p><p>Если сегодня тяжело, уменьши нагрузку или замени бег ходьбой.</p></div>`);

  function selectDay(date, focusTarget) {
    const change = Math.sign(diffDays(weekMonday(date), weekMonday(selected)));
    state.selected = date;
    save();
    home(change);
    if (focusTarget) $(focusTarget)?.focus({preventScroll: true});
  }

  $('#goToday').onclick = event => selectDay(t, event.detail === 0 && '#goToday');
  $('#prevWeek').onclick = event => selectDay(plusDays(selected, -7), event.detail === 0 && '#prevWeek');
  $('#nextWeek').onclick = event => selectDay(plusDays(selected, 7), event.detail === 0 && '#nextWeek');
  bindWeekSwipe($('.week-window'), change => selectDay(plusDays(selected, change * 7)));
  animateWeek($('.weekrow'), direction);
  document.querySelectorAll('[data-day]').forEach(button => button.onclick = event =>
    selectDay(button.dataset.day, event.detail === 0 && `[data-day="${button.dataset.day}"]`));
  document.querySelectorAll('[data-check]').forEach(box => box.onchange = () => {
    const focused = document.activeElement === box;
    setDone(selected, box.dataset.check, box.checked);
    if (focused) $(`[data-check="${box.dataset.check}"]`).focus({preventScroll: true});
  });
  $('#showPlan')?.addEventListener('click', () => {
    state.tab = 'plan';
    state.seenWeek = w;
    render();
    window.scrollTo(0, 0);
  });
}

function weekStrip(selected, review = false) {
  return `<div class="scrollweeks" role="group" aria-label="Выбор недели курса">
    ${Array.from({length: 12}, (_, i) => `<button class="weekchip ${i === selected ? 'active' : ''} ${i === courseWeek() ? 'current' : ''}"
      data-course-week="${i}" aria-pressed="${i === selected}" ${i === courseWeek() ? 'aria-current="true"' : ''}
      aria-label="Неделя ${i+1}${review && state.course.reviews[i] ? ', обзор заполнен' : ''}">${i+1} нед.${review && state.course.reviews[i] ? ' ✓' : ''}</button>`).join('')}
  </div>`;
}

function bindWeekStrip(selected, showWeek, stripPosition) {
  const strip = $('.scrollweeks');
  const active = strip.querySelector('.active');
  const target = Math.max(0, active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2);
  strip.scrollLeft = stripPosition ?? target;
  if (stripPosition != null) strip.scrollTo({left: target, behavior: reducedMotion.matches ? 'auto' : 'smooth'});

  strip.querySelectorAll('[data-course-week]').forEach(button => button.onclick = event => {
    const next = Number(button.dataset.courseWeek);
    if (next === selected) return;
    const position = strip.scrollLeft;
    state.seenWeek = next;
    save();
    showWeek(position, Math.sign(next - selected));
    if (event.detail === 0) $(`[data-course-week="${next}"]`).focus({preventScroll: true});
  });
}

function plan(stripPosition, direction = 0){const w=Math.max(0,Math.min(11,state.seenWeek??currentWeek())),p=progressWeek(w),ex=exercisePlan(w),cp=cardioPlan(w);shell(`<div class="sectionhead"><h2>Недели курса</h2></div>${weekStrip(w)}<div class="panel accent week-summary"><div class="row"><h3>Неделя ${w+1}</h3><span class="tag">${p.pct}%</span></div><p>${niceDate(weekStart(w),{day:'numeric',month:'long'})} — ${niceDate(weekEnd(w),{day:'numeric',month:'long'})}</p><div class="progress"><div style="width:${p.pct}%"></div></div><p>${w===7?'Облегчённая неделя для восстановления.':w===11?'Заключительная неделя. Сосредоточься на технике, не на максимуме.':'Увеличивай нагрузку только при качественной технике и нормальном восстановлении.'}</p></div><div class="sectionhead"><h2>Сила · Пн / Ср / Пт</h2><span class="tag">25–35 минут</span></div><div class="panel"><p>Разминка 5–10 минут. Между подходами отдых 90–120 секунд. Последние 2–3 повторения должны оставаться в запасе.</p>${ex.map(x=>`<div class="exercise"><div><strong>${x.name}</strong><small>${x.desc}</small></div><b>${x.presc}</b></div>`).join('')}</div><div class="sectionhead"><h2>Кардио · Вт / Сб</h2></div><div class="panel"><h3>${cp.run} мин бега + ${cp.walk} мин ходьбы × ${cp.loops}</h3><p>${cp.total} минут интервалов + 5 минут ходьбы до и после. Беги так, чтобы можно было говорить целыми фразами. При усталости повтори предыдущую неделю.</p></div><div class="sectionhead"><h2>Ежедневное движение</h2></div><div class="panel"><p>Прогулка 30–40 минут вечером, в комфортном темпе. В дни отдыха допустима более короткая прогулка.</p></div><div class="panel"><h3>Изменить нагрузку этой недели</h3><p>Корректировки не меняют другие недели и сохраняются в журнале курса.</p>${[['push','Отжимания','повт.'],['squat','Приседания','повт.'],['row','Тяга','повт.'],['bridge','Мостик','повт.'],['plank','Планка','сек']].map(([k,name,unit])=>`<div class="exercise"><div><strong>${name}</strong><small>Коррекция: ${(state.course.adjustments[w]||{})[k]||0} ${unit}</small></div><div class="updown"><button data-adjust="${k}" data-delta="-1">−</button><button data-adjust="${k}" data-delta="1">+</button></div></div>`).join('')}</div>`);
 bindWeekStrip(w, plan, stripPosition);
 animateWeek($('.week-summary'), direction);
 document.querySelectorAll('[data-adjust]').forEach(b=>b.onclick=()=>{const k=b.dataset.adjust;const a=state.course.adjustments[w]||(state.course.adjustments[w]={});a[k]=Math.max(-8,Math.min(12,(a[k]||0)+Number(b.dataset.delta)));save();render()});}
function review(stripPosition, direction = 0){const w=state.seenWeek??currentWeek();shell(`<div class="sectionhead"><h2>Воскресный обзор</h2><span class="tag">12 недель</span></div><div class="panel accent"><h3>Как прошла неделя?</h3><p>Каждое воскресенье оцени выполнение плана, самочувствие, внешний вид и реши: оставить нагрузку, снизить или осторожно увеличить.</p><p>Отмечать результаты можно и позже — всё привязано к датам недели.</p></div>${weekStrip(w, true)}<div id="reviewForm"></div><div class="sectionhead"><h2>Твои записи</h2></div><div class="panel">${Object.entries(state.course.reviews).length?Object.entries(state.course.reviews).sort((a,b)=>Number(b[0])-Number(a[0])).map(([n,r])=>`<div class="exercise"><div><strong>Неделя ${Number(n)+1} · ${esc(r.mood)}</strong><small>${esc(r.notes||'Без заметок')}</small></div><span class="tag">${esc(r.decision)}</span></div>`).join(''):'<div class="empty">Пока нет отчётов. Первый можно сделать в воскресенье.</div>'}</div>${courseWeek()>11?`<div class="panel accent"><h3>Курс завершён!</h3><p>Зафиксируй результат и начни новый 12-недельный цикл с обновлёнными параметрами.</p><button class="btn primary" id="newCourseFromReview">Новый курс →</button></div>`:''}`);
 bindWeekStrip(w, review, stripPosition);
 $('#newCourseFromReview')?.addEventListener('click',()=>{state.tab='settings';render();setTimeout(()=>$('#newCourseSection')?.scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'}),80)});showReviewForm();
 animateWeek($('#reviewForm'), direction);
}
function showReviewForm(){const w=Math.max(0,Math.min(11,state.seenWeek??currentWeek())),r=state.course.reviews[w]||{},p=progressWeek(w);
 $('#reviewForm').innerHTML=`<div class="panel" style="margin-top:13px"><h3>Неделя ${w+1} · ${niceDate(weekStart(w))} — ${niceDate(weekEnd(w))}</h3><p>Отмечено ${p.completed} из ${p.total} запланированных активностей (${p.pct}%).</p><label class="formlabel" for="mood">Самочувствие</label><select id="mood" class="field"><option value="Хорошее" ${r.mood==='Хорошее'?'selected':''}>Хорошее</option><option value="Нормальное" ${r.mood==='Нормальное'?'selected':''}>Нормальное</option><option value="Тяжело" ${r.mood==='Тяжело'?'selected':''}>Тяжело</option><option value="Боль или дискомфорт" ${r.mood==='Боль или дискомфорт'?'selected':''}>Боль или дискомфорт</option></select><label class="formlabel" for="effort">Насколько тяжело давались тренировки?</label><select id="effort" class="field">${[['easy','Легко — оставался запас'],['ok','Умеренно — нормально'],['hard','Тяжело — почти предел']].map(([v,n])=>`<option value="${v}" ${r.effort===v?'selected':''}>${n}</option>`).join('')}</select><label class="formlabel" for="decision">Нагрузка на следующей неделе</label><select id="decision" class="field"><option value="По плану" ${r.decision==='По плану'?'selected':''}>По базовому плану</option><option value="Облегчить" ${r.decision==='Облегчить'?'selected':''}>Облегчить (−2 повт., −5 сек планки)</option><option value="Усилить" ${r.decision==='Усилить'?'selected':''}>Немного увеличить (+1 повтор, +5 сек планки)</option></select><label class="formlabel" for="visual">Внешний вид / одежда / пояс</label><textarea class="field" id="visual" placeholder="Например: стало комфортнее сидеть, живот чуть меньше, легче подниматься по лестнице">${esc(r.visual||'')}</textarea><label class="formlabel" for="notes">Что получилось и что не получилось?</label><textarea class="field" id="notes" placeholder="Наблюдения, пропуски, сон, восстановление">${esc(r.notes||'')}</textarea><button class="btn primary" id="saveReview">Сохранить обзор</button><div class="note">Если была боль или восстановление плохое, не увеличивай нагрузку. Можно оставить или повторить предыдущую неделю.</div></div>`;
 $('#saveReview').onclick=()=>{const mood=$('#mood').value,effort=$('#effort').value,decision=$('#decision').value;if(decision==='Усилить'&&(mood==='Тяжело'||mood==='Боль или дискомфорт'||effort==='hard')){toast('При выраженном дискомфорте лучше не увеличивать нагрузку.');return}state.course.reviews[w]={mood,effort,decision,visual:$('#visual').value,notes:$('#notes').value,date:today(),completion:p};if(w<11){const next=state.course.adjustments[w+1]||(state.course.adjustments[w+1]={});const delta=decision==='Усилить'?1:decision==='Облегчить'?-2:0;for(const k of ['push','squat','row','bridge'])next[k]=delta;next.plank=delta===1?5:delta===-2?-5:0;}save();review();toast('Обзор сохранён')};}
function timerView(){shell(`<div class="sectionhead"><h2>Отдых</h2></div><div class="panel accent"><h3>Между подходами</h3><div class="choice">${[30,60,90,120,180,300].map(n=>`<button class="btn tiny ${timer.duration===n?'active':''}" data-preset="${n}">${n<60?n+' сек':n/60+' мин'}</button>`).join('')}</div><div class="bigtime" id="timerDisplay">${formatTimer(timer.remaining)}</div><div class="controls" style="justify-content:center"><button class="btn primary" id="timerStart">${timer.running?'Пауза':'Старт'}</button><button class="btn ghost" id="timerReset">Сбросить</button></div><div class="note">На iPhone таймер не гарантированно сработает при блокировке экрана или закрытом PWA. Для надёжных напоминаний используй события календаря из настроек.</div></div><div class="panel"><h3>Вибрация и звук</h3><p>После окончания таймера приложение попробует подать звуковой сигнал, вибрацию (если поддерживается) и показать сообщение на экране.</p><button class="btn ghost" id="testSound">Проверить сигнал</button></div>`);document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{stopTimer();timer.duration=+b.dataset.preset;timer.remaining=timer.duration;timerView()});$('#timerStart').onclick=()=>{toggleTimer();updateTimerUI()};$('#timerReset').onclick=()=>{stopTimer();timer.remaining=timer.duration;updateTimerUI()};$('#testSound').onclick=()=>{beep();toast('Проверка сигнала')};updateTimerUI();}
function formatTimer(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function beep(){try{const A=window.AudioContext||window.webkitAudioContext;const ac=new A();const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=740;g.gain.setValueAtTime(.001,ac.currentTime);g.gain.exponentialRampToValueAtTime(.18,ac.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.6);o.start();o.stop(ac.currentTime+.62);setTimeout(()=>ac.close(),900)}catch{}if(navigator.vibrate)navigator.vibrate([250,100,250]);}
function updateTimerUI(){if($('#timerDisplay'))$('#timerDisplay').textContent=formatTimer(timer.remaining);if($('#timerStart'))$('#timerStart').textContent=timer.running?'Пауза':'Старт'}
function stopTimer(){timer.running=false;if(timer.interval){clearInterval(timer.interval);timer.interval=null}}
function tickTimer(){if(!timer.running)return;timer.remaining=Math.max(0,Math.ceil((timer.ends-Date.now())/1000));updateTimerUI();if(timer.remaining===0){stopTimer();beep();toast('Время отдыха закончилось!')}}
function toggleTimer(){if(timer.running){timer.remaining=Math.max(1,Math.ceil((timer.ends-Date.now())/1000));stopTimer()}else{if(timer.remaining<=0)timer.remaining=timer.duration;timer.ends=Date.now()+timer.remaining*1000;timer.running=true;timer.interval=setInterval(tickTimer,250)} }
function settings(){shell(`<div class="sectionhead"><h2>Расписание и данные</h2></div><div class="panel"><h3>Время занятий</h3><p>Изменения влияют на новые календарные файлы.</p>${[...activities,{id:'review',label:'Воскресный обзор'}].map(a=>`<label class="formlabel" for="time_${a.id}">${a.label}</label><input class="field" type="time" id="time_${a.id}" value="${esc(state.times[a.id])}">`).join('')}<button class="btn primary" id="saveTimes">Сохранить время</button></div><div class="panel accent"><h3>Напоминания на iPhone</h3><p>Скачай файл .ics и добавь события в календарь iPhone с уведомлением за 10 минут. Он включает расписание на 12 недель и воскресные обзоры.</p><button class="btn primary" id="exportCalendar">Скачать расписание .ics</button><div class="note">Для уведомлений при закрытом PWA необходим календарь iPhone или отдельный сервер Web Push. GitHub Pages не запускает фоновые уведомления сам.</div></div><div class="panel"><h3>Начало текущего курса</h3><p>Сейчас курс №${state.course.number} с ${niceDate(state.course.start,{day:'numeric',month:'long',year:'numeric'})}. Смена даты не удаляет отметки, но меняет привязку недель.</p><label class="formlabel" for="startDate">Первый понедельник</label><input class="field" type="date" id="startDate" value="${state.course.start}"><button class="btn ghost" id="saveStart">Изменить дату начала</button></div><div class="panel"><h3>Резервная копия</h3><p>Все отметки хранятся локально в браузере этого iPhone. При удалении данных сайта они могут исчезнуть. Регулярно сохраняй резервную копию.</p><div class="controls"><button class="btn ghost" id="exportBackup">Скачать JSON</button><label class="btn ghost" for="importBackup">Восстановить JSON</label><input id="importBackup" type="file" accept="application/json,.json" hidden></div></div><div class="panel" id="newCourseSection"><h3>Новый курс на 12 недель</h3><p>Текущий курс сохранится в архиве. Укажи стартовый уровень; новая программа начнётся с щадящей первой недели.</p><label class="formlabel" for="newStart">Дата начала нового курса (понедельник)</label><input id="newStart" type="date" class="field" value="${nextMonday()}"><label class="formlabel" for="basePush">Текущий максимум качественных отжиманий</label><input id="basePush" type="number" min="1" max="200" class="field" value="${esc(state.course.baseline.pushups)}"><label class="formlabel" for="baseNotes">Самочувствие / внешний вид</label><textarea id="baseNotes" class="field" placeholder="Что изменилось, на что хочешь обратить внимание">${esc(state.course.baseline.photoNotes||'')}</textarea><button class="btn primary" id="newCourse">Начать новый курс</button></div><div class="panel"><h3>Архив курсов (${state.history.length})</h3>${state.history.length?state.history.map(c=>`<div class="exercise"><div><strong>Курс ${c.number}</strong><small>Начало ${niceDate(c.start)} · ${Object.keys(c.completed).length} отметок · ${Object.keys(c.reviews).length} обзоров</small></div></div>`).join(''):'<p>Архив появится, когда начнёшь второй курс.</p>'}</div>`);
 $('#saveTimes').onclick=()=>{for(const a of [...activities,{id:'review'}])state.times[a.id]=$(`#time_${a.id}`).value||defTimes[a.id];save();toast('Время сохранено')};
 $('#saveStart').onclick=()=>{const date=$('#startDate').value;if(!date||weekMonday(date)!==date){toast('Дата начала должна быть понедельником');return}if(!confirm('Изменить дату начала курса? Отметки останутся на исходных датах.'))return;state.course.start=date;save();render();toast('Дата начала обновлена')};
 $('#exportCalendar').onclick=downloadCalendar;$('#exportBackup').onclick=()=>download('forma12-backup-'+today()+'.json',JSON.stringify(state,null,2),'application/json');
 $('#importBackup').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const v=JSON.parse(await f.text());if(v.version!==1||!v.course?.start||!v.course?.completed||!Array.isArray(v.history))throw Error('Некорректный файл');if(!confirm('Заменить все данные приложения импортированной копией?'))return;state={...defaultState(),...v,times:{...defTimes,...v.times}};save();render();toast('Резервная копия восстановлена')}catch{toast('Не удалось прочитать резервную копию')}};
 $('#newCourse').onclick=()=>{const date=$('#newStart').value,num=Number($('#basePush').value);if(!date||weekMonday(date)!==date){toast('Выбери понедельник для начала курса');return}if(!Number.isInteger(num)||num<1||num>200){toast('Укажи корректное число отжиманий');return}if(!confirm('Создать новый курс? Текущий будет сохранён в архиве.'))return;state.history.push(state.course);state.course=newCourse(date,state.course.number+1,{pushups:num,photoNotes:$('#baseNotes').value,feeling:''});state.seenWeek=0;state.selected=date;state.tab='home';save();render();toast('Новый курс создан')};}
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function icsEscape(s){return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function dtUTC(d){return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}T${String(d.getUTCHours()).padStart(2,'0')}${String(d.getUTCMinutes()).padStart(2,'0')}${String(d.getUTCSeconds()).padStart(2,'0')}Z`}
function dateTime(date,time){let [h,m]=time.split(':').map(Number);let d=parseDate(date);d.setHours(h,m,0,0);return d}
function downloadCalendar(){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Forma12//Training planner//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Форма 12'];let idx=0;for(let day=0;day<84;day++){const date=plusDays(state.course.start,day),week=Math.floor(day/7);for(const a of allActivities(date)){const start=dateTime(date,state.times[a.id]),end=new Date(start.getTime()+a.mins*60000),desc=a.id==='strength'?exercisePlan(week).map(x=>`${x.name} ${x.presc}`).join('; '):a.id==='cardio'?`Бег ${cardioPlan(week).run} мин, ходьба ${cardioPlan(week).walk} мин × ${cardioPlan(week).loops}`:'Прогулка 30–40 минут';lines.push('BEGIN:VEVENT',`UID:forma12-${state.course.id}-${idx++}@forma12.local`,`DTSTAMP:${dtUTC(new Date())}`,`DTSTART:${dtUTC(start)}`,`DTEND:${dtUTC(end)}`,`SUMMARY:${icsEscape(a.label)}`,`DESCRIPTION:${icsEscape('Курс '+state.course.number+', неделя '+(week+1)+'. '+desc)}`,'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY',`DESCRIPTION:${icsEscape('Скоро: '+a.label)}`,'END:VALARM','END:VEVENT')}if(day%7===6){const start=dateTime(date,state.times.review),end=new Date(start.getTime()+15*60000);lines.push('BEGIN:VEVENT',`UID:forma12-${state.course.id}-review-${week}@forma12.local`,`DTSTAMP:${dtUTC(new Date())}`,`DTSTART:${dtUTC(start)}`,`DTEND:${dtUTC(end)}`,`SUMMARY:${icsEscape('Итоги недели '+(week+1))}`,'DESCRIPTION:Открой приложение Форма 12 и заполни воскресный обзор.','BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:Пора подвести итоги недели','END:VALARM','END:VEVENT')}}lines.push('END:VCALENDAR');download('forma12-course-'+state.course.number+'.ics',lines.join('\r\n')+'\r\n','text/calendar;charset=utf-8');toast('Календарь сформирован. Импортируй файл в календарь iPhone.');}
function render(){document.title='Форма 12 — тренировки';switch(state.tab){case 'plan':plan();break;case 'review':review();break;case 'timer':timerView();break;case 'settings':settings();break;default:home()}save()}
render();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
