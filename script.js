// ================= AUDIO =================
let audioEnabled = false;

const soundComplete = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
const soundClick = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");

function enableAudio(){
  if(audioEnabled) return;

  soundClick.play().then(()=>{
    soundClick.pause();
    soundClick.currentTime = 0;
    audioEnabled = true;
  }).catch(()=>{});
}

document.addEventListener("click", enableAudio);

function feedback(type){
  if(audioEnabled){
    try{
      if(type === "complete"){
        soundComplete.currentTime = 0;
        soundComplete.play();
      }else{
        soundClick.currentTime = 0;
        soundClick.play();
      }
    }catch(e){}
  }

  if(navigator.vibrate){
    navigator.vibrate(type === "complete" ? [50,30,50] : 20);
  }
}

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

// 🎓 UNIVERSIDAD
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

if(!state.subjects) state.subjects = [];
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

  updateCurrentClassUI();
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

  feedback("click");

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

  feedback("complete");

  save();
  render();

  setTimeout(()=>{
    const items = document.querySelectorAll('#taskList li');
    if(items[i]){
      items[i].classList.add('completed-anim');
      setTimeout(()=>items[i].classList.remove('completed-anim'), 400);
    }
  },50);
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

  feedback("click");

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
    existing = { name, schedule:{}, attendance:0 };
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

  feedback("click");

  state.subjects[i].attendance++;
  save();
  render();
}

function getCurrentClass(){
  if(!state.subjects.length) return null;

  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours()*60 + now.getMinutes();

  return state.subjects.find(s=>{
    const sch = s.schedule?.[day];
    if(!sch) return false;

    const [sh,sm] = sch.start.split(':');
    const [eh,em] = sch.end.split(':');

    const start = parseInt(sh)*60 + parseInt(sm);
    const end = parseInt(eh)*60 + parseInt(em);

    return minutes >= start && minutes <= end;
  });
}

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
      next = { name: s.name, minutes: diff };
    }
  });

  return next;
}

function updateCurrentClassUI(){
  if(!currentClassText) return;

  const current = getCurrentClass();
  const next = getNextClass();

  if(current){
    currentClassText.textContent = `📍 ${current.name}`;
  } else if(next){
    currentClassText.textContent = `🕒 ${next.name} en ${next.minutes} min`;
  } else {
    currentClassText.textContent = "💤 Sin clases";
  }
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

// ================= RENDER =================
function render(){

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

    sorted.forEach(r=>{
      const li=document.createElement('li');
      li.className='routine-item';

      li.innerHTML=`
        <div>${formatTime(r.time)}</div>
        <div>
          <b>${r.title}</b>
          <small>${r.duration} min</small>
        </div>
        <button class="danger">✖</button>
      `;

      li.onclick=()=>toggleRoutine(r.originalIndex);

      li.querySelector('button').onclick=e=>{
        e.stopPropagation();
        deleteRoutine(r.originalIndex);
      };

      routineList.appendChild(li);
    });
  }

  // universidad
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

      li.querySelector('button').onclick = ()=> addAttendance(i);

      subjectList.appendChild(li);
    });
  }
}

// ================= INIT =================
render();