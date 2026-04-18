const USER_KEY = "rutina-user";
const SESSION_KEY = "rutina-session";

function register(){
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  const msg = document.getElementById("msg");

  if(!user || !pass){
    msg.textContent = "Completa todo";
    return;
  }

  const data = { user, pass };

  localStorage.setItem(USER_KEY, JSON.stringify(data));
  msg.textContent = "Usuario creado ✔";
}

function login(){
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  const msg = document.getElementById("msg");

  const saved = JSON.parse(localStorage.getItem(USER_KEY));

  if(!saved){
    msg.textContent = "No existe usuario";
    return;
  }

  if(user === saved.user && pass === saved.pass){
    localStorage.setItem(SESSION_KEY, "active");
    window.location.href = "index.html";
  } else {
    msg.textContent = "Datos incorrectos";
  }
}