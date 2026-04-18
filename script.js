// ================= DOM =================
const clock = document.getElementById('clock');
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskImage = document.getElementById('taskImage');
const taskList = document.getElementById('taskList');
const calendar = document.getElementById('calendar');
const dayTitle = document.getElementById('dayTitle');

const routineTitle = document.getElementById('routineTitle');
const routineTime = document.getElementById('routineTime');
const routineDuration = document.getElementById('routineDuration');
const routineList = document.getElementById('routineList');
const currentClassText = document.getElementById('currentClass');

// 🎓 NUEVO
const subjectName = document.getElementById('subjectName');
const subjectDay = document.getElementById('subjectDay');
const subjectStart = document.getElementById('subjectStart');
const subjectEnd = document.getElementById('subjectEnd');
const subjectList = document.getElementById('subjectList');

// ================= STATE =================
const KEY = 'rutina-app';

let state = JSON.parse(localStorage.getItem(KEY)) || {
  tasksByDate: {},
  routinesByDay: {0:[],1:[],2:[],3:[],4:[],5:[],6:[]},
  subjects: []
};

// 🔥 FIX DATOS VIEJOS (CLAVE)
if(!state.subjects){
  state.subjects = [];
}

if(!state.routinesByDay){
  state.routinesByDay = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]};
}

let selectedDate = getToday();
let selectedDay = new Date().getDay();

// ================= HELPERS =================
function save(){
  localStorage.setItem(KEY, JSON.stringify(state));
}

function getToday(){
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

// ================= CLOCK =================
setInterval(()=>{
  const tasks = getTasks();
  const done = tasks.filter(t=>t.done).length;
  clock.textContent = `⏱ ${new Date().toLocaleTimeString()} | ✔ ${done}/${tasks.length}`;
},1000);

setInterval(()=>{
  const tasks = getTasks();
  const done = tasks.filter(t=>t.done).length;
  clock.textContent = `⏱ ${new Date().toLocaleTimeString()} | ✔ ${done}/${tasks.length}`;

  updateCurrentClassUI(); // 🔥 AQUÍ
},1000);
// ================= TASKS =================
function getTasks(){
  if(!state.tasksByDate[selectedDate]){
    state.tasksByDate[selectedDate] = [];
  }
  return state.tasksByDate[selectedDate];
}

function addTask(){
  const t = taskTitle.value.trim();
  const d = taskDesc.value.trim();
  const file = taskImage.files[0];

  if(!t || !d) return;

  if(file){
    const reader = new FileReader();
    reader.onload = e => saveTask(t,d,e.target.result);
    reader.readAsDataURL(file);
  } else {
    saveTask(t,d,null);
  }
}

function saveTask(title, desc, image){
  getTasks().push({title,desc,image,done:false});
  taskTitle.value='';
  taskDesc.value='';
  taskImage.value='';
  save();
  render();
}

function toggleTask(i){
  const t = getTasks();
  t[i].done = !t[i].done;
  save(); render();
}

function deleteTask(i){
  const t = getTasks();
  t.splice(i,1);
  save(); render();
}

// ================= RUTINAS =================
function getRoutines(){
  if(!state.routinesByDay[selectedDay]){
    state.routinesByDay[selectedDay] = [];
  }
  return state.routinesByDay[selectedDay];
}

function addRoutine(){
  const title = routineTitle.value.trim();
  const time = routineTime.value;
  const duration = parseInt(routineDuration.value);

  if(!title || !time || !duration) return;

  getRoutines().push({title,time,duration,done:false});

  routineTitle.value='';
  routineTime.value='';
  routineDuration.value='';

  save();
  render();
}

function toggleRoutine(i){
  const r = getRoutines();
  r[i].done = !r[i].done;
  save(); render();
}

function deleteRoutine(i){
  const r = getRoutines();
  r.splice(i,1);
  save(); render();
}

// ================= UNIVERSIDAD =================
function addSubject(){
  const name = subjectName.value.trim();
  const day = subjectDay.value;
  const start = subjectStart.value;
  const end = subjectEnd.value;

  if(!name || !start || !end) return;

  let existing = state.subjects.find(s => s.name === name);

  if(!existing){
    existing = {
      name,
      schedule: {},
      attendance: 0
    };
    state.subjects.push(existing);
  }

  existing.schedule[day] = {start, end};

  subjectName.value='';
  subjectStart.value='';
  subjectEnd.value='';

  save();
  render();
}

function addAttendance(i){
  if(!state.subjects[i]) return;
  state.subjects[i].attendance++;
  save();
  render();
}

function getCurrentClass(){
  if(!state.subjects || state.subjects.length === 0) return null;

  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours()*60 + now.getMinutes();

  return state.subjects.find(s=>{
    if(!s.schedule) return false;

    const sch = s.schedule[day];
    if(!sch) return false;

    const [sh,sm] = sch.start.split(':');
    const [eh,em] = sch.end.split(':');

    const start = parseInt(sh)*60 + parseInt(sm);
    const end = parseInt(eh)*60 + parseInt(em);

    return minutes >= start && minutes <= end;
  });
}
//display
function updateCurrentClassUI(){
  if(!currentClassText) return;

  const current = getCurrentClass();
  const next = getNextClass();

  if(current){
    const remaining = getRemainingTime(current);
    currentClassText.textContent = `📍 Estás en: ${current.name || current.title} ${remaining ? `| ⏳ ${remaining}` : ''}`;
  }
  else if(next){
    currentClassText.textContent = `🕒 Siguiente: ${next.name} en ${next.minutes} min`;
  }
  else{
    currentClassText.textContent = "💤 Sin clases ahora";
  }
}
//siguinete clase

function getNextClass(){
  const now = new Date();
  const day = now.getDay();
  const currentMinutes = now.getHours()*60 + now.getMinutes();

  let next = null;
  let minDiff = Infinity;

  state.subjects.forEach(s=>{
    const sch = s.schedule?.[day];
    if(!sch) return;

    const [h,m] = sch.start.split(':');
    const start = parseInt(h)*60 + parseInt(m);

    const diff = start - currentMinutes;

    if(diff > 0 && diff < minDiff){
      minDiff = diff;
      next = {
        name: s.name,
        minutes: diff
      };
    }
  });

  return next;
}
// ================= TIEMPO =================
function getCurrentRoutine(){
  const now = new Date();
  const currentMinutes = now.getHours()*60 + now.getMinutes();

  let currentRoutine = null;

  getRoutines().forEach(r=>{
    const [h,m] = r.time.split(':');
    const start = parseInt(h)*60 + parseInt(m);
    const end = start + parseInt(r.duration);

    if(currentMinutes >= start && currentMinutes <= end){
      currentRoutine = r;
    }
  });

  return currentRoutine;
}

function getProgress(r){
  const now = new Date();
  const [h,m] = r.time.split(':');

  const start = new Date();
  start.setHours(h,m,0);

  const end = new Date(start.getTime() + r.duration*60000);

  let percent = ((now - start)/(end-start))*100;

  if(percent<0) percent=0;
  if(percent>100) percent=100;

  return Math.floor(percent);
}

function formatTime(time){
  const [h,m]=time.split(':');
  let hour=parseInt(h);
  const ampm=hour>=12?'pm':'am';
  hour=hour%12||12;
  return `${hour}:${m} ${ampm}`;
}

// ================= CALENDARIO =================
function renderCalendar(){
  calendar.innerHTML='';
  const now=new Date();
  const year=now.getFullYear();
  const month=now.getMonth();
  const today=now.getDate();

  const days=new Date(year,month+1,0).getDate();

  for(let i=1;i<=days;i++){
    const key=`${year}-${month+1}-${i}`;
    const div=document.createElement('div');
    div.className='day';
    div.textContent=i;

    if(i===today) div.classList.add('today');
    if(key===selectedDate) div.classList.add('selected');

    div.onclick=()=>{
      selectedDate=key;
      render();
    };

    calendar.appendChild(div);
  }
}

//tiempo restante
function getRemainingTime(r){
  if(!r.time) return null;

  const now = new Date();

  const [h,m] = r.time.split(':');
  const start = new Date();
  start.setHours(h,m,0);

  const end = new Date(start.getTime() + r.duration * 60000);

  const diff = end - now;

  if(diff <= 0) return null;

  const minutes = Math.floor(diff / 60000);
  return `${minutes} min`;
}
// ================= RENDER =================
function render(){

  // tareas
  const tasks=getTasks();
  dayTitle.textContent=`Tareas del ${selectedDate}`;
  taskList.innerHTML='';

  tasks.forEach((t,i)=>{
    const li=document.createElement('li');

    const left=document.createElement('div');
    left.innerHTML=`
      <b>${t.title}</b><br>
      <small>${t.desc}</small>
      ${t.image?`<br><img src="${t.image}" style="max-width:100px;">`:''}
    `;

    if(t.done) left.classList.add('done');

    left.onclick=()=>toggleTask(i);

    const del=document.createElement('button');
    del.textContent='✖';
    del.className='danger';
    del.onclick=e=>{
      e.stopPropagation();
      deleteTask(i);
    };

    li.appendChild(left);
    li.appendChild(del);
    taskList.appendChild(li);
  });

  renderCalendar();

  // rutinas
  if(routineList){
    routineList.innerHTML='';

    const sorted=getRoutines()
      .map((r,i)=>({...r,originalIndex:i}))
      .sort((a,b)=>a.time.localeCompare(b.time));

    const current=getCurrentRoutine();

    sorted.forEach(r=>{
      const li=document.createElement('li');
      li.className='routine-item';

      li.innerHTML=`
        <div>${formatTime(r.time)}</div>
        <div>
          <b>${r.title}</b>
          <small>${r.duration} min</small>

          ${
            current && r.time===current.time
            ? `
              <div class="progress-bar">
                <div class="progress-fill" style="width:${getProgress(r)}%"></div>
              </div>
              <div>${getProgress(r)}%</div>
            `
            : ''
          }
        </div>
        <button class="danger">✖</button>
      `;

      if(r.done) li.classList.add('done');
      if(current && r.time===current.time) li.classList.add('active');

      li.onclick=()=>toggleRoutine(r.originalIndex);

      li.querySelector('button').onclick=e=>{
        e.stopPropagation();
        deleteRoutine(r.originalIndex);
      };

      routineList.appendChild(li);
    });
  }

  // 🎓 universidad
  if(subjectList){
    subjectList.innerHTML='';

    const currentClass = getCurrentClass();

    state.subjects.forEach((s,i)=>{
      const li = document.createElement('li');

      li.innerHTML = `
        <div>
          <b>${s.name}</b><br>
          <small>Asistencias: ${s.attendance}</small>
        </div>
        <button>+1</button>
      `;

      if(currentClass && currentClass.name === s.name){
        li.style.border = "2px solid gold";
      }

      li.querySelector('button').onclick = ()=>{
        addAttendance(i);
      };

      subjectList.appendChild(li);
    });
  }
}

// ================= INIT =================
render();