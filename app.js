/* =========================================
   app.js - Single JS powering QuizSpace
   Supports Teacher & Student roles
   ========================================= */

/* ---------- Storage Keys ---------- */
const KEY_USERS = "q_users";
const KEY_QS = "q_questions";
const KEY_CATS = "q_categories";
const KEY_SUBS = "q_submissions";

/* ---------- Seed defaults ---------- */
function seedIfEmpty() {
  if (!localStorage.getItem(KEY_CATS)) {
    const defaultCats = ["Maths", "Science", "History", "Programming"];
    localStorage.setItem(KEY_CATS, JSON.stringify(defaultCats));
  }
  if (!localStorage.getItem(KEY_QS)) {
    const defaultQs = [
      { q: "2 + 2 = ?", options:{A:"3",B:"4",C:"5",D:"22"}, correct:"B", category:"Maths" },
      { q: "HTML stands for?", options:{A:"Hyper Text Markup",B:"Hot Mail Text",C:"Hyperlinks Text Machine",D:"Home Tool Markup"}, correct:"A", category:"Programming" },
      { q: "Water chemical formula?", options:{A:"CO2",B:"H2O",C:"O2",D:"H2"}, correct:"B", category:"Science" },
      { q: "The first president of USA?", options:{A:"Lincoln",B:"Jefferson",C:"George Washington",D:"Adams"}, correct:"C", category:"History" }
    ];
    localStorage.setItem(KEY_QS, JSON.stringify(defaultQs));
  }
  if (!localStorage.getItem(KEY_USERS)) {
    localStorage.setItem(KEY_USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEY_SUBS)) {
    localStorage.setItem(KEY_SUBS, JSON.stringify([]));
  }
}
seedIfEmpty();

/* ---------- Helpers ---------- */
function getUsers(){ return JSON.parse(localStorage.getItem(KEY_USERS) || "[]"); }
function setUsers(v){ localStorage.setItem(KEY_USERS, JSON.stringify(v)); }

function getQuestions(){ return JSON.parse(localStorage.getItem(KEY_QS) || "[]"); }
function setQuestions(v){ localStorage.setItem(KEY_QS, JSON.stringify(v)); }

function getCategories(){ return JSON.parse(localStorage.getItem(KEY_CATS) || "[]"); }
function setCategories(v){ localStorage.setItem(KEY_CATS, JSON.stringify(v)); }

function getSubs(){ return JSON.parse(localStorage.getItem(KEY_SUBS) || "[]"); }
function setSubs(v){ localStorage.setItem(KEY_SUBS, JSON.stringify(v)); }

/* ---------- Auth ---------- */
function registerUser(e){
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password").value.trim();

  if(!username || !password) return alert("Enter username & password");

  let users = getUsers();
  if(users.find(u=>u.username===username)) return alert("Username already exists");

  users.push({ username, email, password, registeredAt: Date.now() });
  setUsers(users);

  alert("Registered! Please login.");
  location.href = "index.html";
}

function loginUnified(e){
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const role = document.getElementById("selectedRole").value;

  if(role === "teacher"){
    if(username==="teacher" && password==="teacher123"){
      localStorage.setItem("q_logged_in", "teacher");
      location.href = "admin_dashboard.html";
    } else {
      alert("Invalid teacher credentials");
    }
    return;
  }

  const users = getUsers();
  const user = users.find(u=>u.username===username && u.password===password);
  if(user){
    localStorage.setItem("q_logged_in", username);
    location.href = "quiz.html";
  } else {
    alert("Invalid student credentials. Please register first.");
  }
}

function logout(){
  localStorage.removeItem("q_logged_in");
  location.href = "index.html";
}

/* ---------- Teacher: Categories ---------- */
function addCategory(e){
  e.preventDefault();
  const name = document.getElementById("newCategory").value.trim();
  if(!name) return alert("Enter category name");

  let cats = getCategories();
  if(cats.includes(name)) return alert("Category already exists");

  cats.push(name);
  setCategories(cats);
  document.getElementById("newCategory").value="";
  loadCategories();
}

function deleteCategory(i){
  if(!confirm("Delete this category and all its questions?")) return;
  let cats = getCategories();
  const cat = cats[i];
  cats.splice(i,1);
  setCategories(cats);

  let qs = getQuestions().filter(q=>q.category!==cat);
  setQuestions(qs);

  loadCategories();
  loadQuestions();
  loadResults();
}

/* ---------- Teacher: Questions ---------- */
function addQuestion(e){
  e.preventDefault();
  const q = document.getElementById("newQuestion").value.trim();
  const a = document.getElementById("optionA").value.trim();
  const b = document.getElementById("optionB").value.trim();
  const c = document.getElementById("optionC").value.trim();
  const d = document.getElementById("optionD").value.trim();
  const correct = document.getElementById("correct").value.toUpperCase();
  const category = document.getElementById("category").value;

  if(!q || !a||!b||!c||!d) return alert("Fill all fields");
  if(!["A","B","C","D"].includes(correct)) return alert("Correct must be A/B/C/D");

  let qs = getQuestions();
  qs.push({ q, options:{A:a,B:b,C:c,D:d}, correct, category });
  setQuestions(qs);

  alert("Question added");
  document.getElementById("addQForm").reset();
  loadQuestions();
}

function editQuestion(i){
  let qs = getQuestions();
  let q = qs[i];

  const newQ = prompt("Edit question:", q.q);
  if(!newQ) return;
  q.q = newQ;
  q.options.A = prompt("Option A:", q.options.A) || q.options.A;
  q.options.B = prompt("Option B:", q.options.B) || q.options.B;
  q.options.C = prompt("Option C:", q.options.C) || q.options.C;
  q.options.D = prompt("Option D:", q.options.D) || q.options.D;
  q.correct = (prompt("Correct (A/B/C/D):", q.correct) || q.correct).toUpperCase();
  q.category = prompt("Category:", q.category) || q.category;

  setQuestions(qs);
  loadQuestions();
}

function deleteQuestion(i){
  if(!confirm("Delete question?")) return;
  let qs = getQuestions();
  qs.splice(i,1);
  setQuestions(qs);
  loadQuestions();
}

/* ---------- Teacher: Results ---------- */
function loadResults(){
  let subs = getSubs();
  const list = document.getElementById("resultsList");
  if(!list) return;

  list.innerHTML="";
  if(subs.length===0){
    list.innerHTML="<li class='muted'>No submissions yet</li>";
    return;
  }

  subs.slice().reverse().forEach((s,idx)=>{
    const when = new Date(s.time).toLocaleString();
    list.innerHTML+=`
      <li>
        <div>
          <b>${s.user}</b> — ${s.category}
          <small class="muted">${when} | Score: ${s.score}/${s.total}</small>
        </div>
        <div>
          <button class="btn small alt" onclick="deleteSubmission(${subs.length-1-idx})">Delete</button>
        </div>
      </li>`;
  });
}

function deleteSubmission(i){
  if(!confirm("Delete this submission?")) return;
  let subs=getSubs();
  subs.splice(i,1);
  setSubs(subs);
  loadResults();
}

/* ======== NEW: Teacher: Manage Students ======== */
function loadStudents() {
  const users = getUsers();
  const list = document.getElementById("studentList");
  if (!list) return;

  list.innerHTML = "";
  if (users.length === 0) {
    list.innerHTML = "<li class='muted'>No students have registered yet.</li>";
    return;
  }

  users.forEach((user, i) => {
    const regDate = new Date(user.registeredAt).toLocaleString();
    list.innerHTML += `
      <li>
        <div>
          <b>${user.username}</b>
          <small class="muted">${user.email || 'No email'} | Registered: ${regDate}</small>
        </div>
        <button class="btn small alt" onclick="deleteStudent(${i})">Delete</button>
      </li>`;
  });
}

function deleteStudent(i) {
  if (!confirm("Are you sure you want to delete this student? All of their submission records will remain, but their account will be removed.")) return;
  
  let users = getUsers();
  users.splice(i, 1);
  setUsers(users);
  loadStudents();
}

/* ---------- Student: Quiz Flow ---------- */
let state = { qset:[], index:0, score:0, category:null, answers:[] };

function startQuiz(){
  const sel = document.getElementById("categorySelect");
  const category = sel.value;
  const qs = getQuestions().filter(q=>q.category===category);

  if(qs.length===0) return alert("No questions in this category");

  state = { qset:qs, index:0, score:0, category, answers:[] };

  document.getElementById("categoryArea").style.display="none";
  document.getElementById("quizArea").style.display="block";
  showQuestion();
}

/* ✅ UPDATED showQuestion() FUNCTION */
function showQuestion() {
  const q = state.qset[state.index];
  document.getElementById("questionText").innerText = `Q${state.index + 1}. ${q.q}`;
  document.getElementById("progress").innerText = `Question ${state.index + 1} of ${state.qset.length}`;

  let opts = document.getElementById("options");
  opts.innerHTML = "";

  const labels = ["A", "B", "C", "D"];
  labels.forEach((key) => {
    const label = document.createElement("label");
    label.className = "option";

    const r = document.createElement("input");
    r.type = "radio";
    r.name = "opt";
    r.value = key;

    label.appendChild(r);
    label.appendChild(document.createTextNode(`${key}. ${q.options[key]}`));

    label.onclick = () => {
      document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      label.classList.add('selected');
      r.checked = true;
    };

    opts.appendChild(label);
  });
}



function nextQuestion(){
  const chosen=document.querySelector("input[name='opt']:checked");
  if(!chosen) return alert("Select an option");
  const sel=chosen.value;
  state.answers.push(sel);
  if(sel===state.qset[state.index].correct) state.score++;

  state.index++;
  if(state.index>=state.qset.length){ finishQuiz(); }
  else showQuestion();
}

function endQuizEarly(){
  if(confirm("End quiz early? Unanswered will be marked wrong.")){
    while(state.answers.length<state.qset.length) state.answers.push("-");
    finishQuiz();
  }
}

function finishQuiz(){
  const user=localStorage.getItem("q_logged_in")||"guest";
  let subs=getSubs();
  const record={ user, category:state.category, score:state.score, total:state.qset.length, time:Date.now(), answers:state.answers };
  subs.push(record);
  setSubs(subs);

  localStorage.setItem("q_last_result", JSON.stringify(record));
  location.href="result.html";
}

/* ---------- Student: Result Page ---------- */
function loadResultPage(){
  const last=JSON.parse(localStorage.getItem("q_last_result")||"null");
  if(!last){
    document.getElementById("scoreText").innerText="No recent result found";
    return;
  }
  document.getElementById("scoreText").innerText=`${last.score}/${last.total}`;
  document.getElementById("detailsText").innerText=`${last.user} · ${last.category} · ${new Date(last.time).toLocaleString()}`;
}

/* ---------- Student: Profile Page ---------- */
function loadProfilePage(){
  const logged = localStorage.getItem("q_logged_in");
  if(!logged || logged==="teacher"){
    location.href = "index.html";
    return;
  }

  const users = getUsers();
  const user = users.find(u=>u.username===logged);

  const infoDiv = document.getElementById("profileInfo");
  if(user){
    const regDate = new Date(user.registeredAt || Date.now()).toLocaleString();
    infoDiv.innerHTML = `
      <p><b>Username:</b> ${user.username}</p>
      <p><b>Email:</b> ${user.email || "—"}</p>
      <p><b>Registered At:</b> ${regDate}</p>
    `;
  } else {
    infoDiv.innerHTML = "<p class='muted'>User not found.</p>";
  }

  const subs = getSubs().filter(s=>s.user===logged);
  const list = document.getElementById("myResults");
  list.innerHTML = "";
  if(subs.length===0){
    list.innerHTML = "<li class='muted'>No results yet</li>";
  } else {
    subs.slice().reverse().forEach(s=>{
      const when = new Date(s.time).toLocaleString();
      list.innerHTML += `<li>
        <div>
          <b>${s.category}</b> — Score: ${s.score}/${s.total}
          <small class="muted">${when}</small>
        </div>
      </li>`;
    });
  }
}

/* ---------- UI Loaders ---------- */
function loadCategories(){
  const list=document.getElementById("categoryList");
  const select=document.getElementById("category");
  const selectUser=document.getElementById("categorySelect");
  const cats=getCategories();

  if(list){
    list.innerHTML="";
    cats.forEach((c,i)=>{
      list.innerHTML+=`<li><b>${c}</b><button class="btn small alt" onclick="deleteCategory(${i})">Delete</button></li>`;
    });
  }
  if(select) select.innerHTML=cats.map(c=>`<option value="${c}">${c}</option>`).join("");
  if(selectUser) selectUser.innerHTML=cats.map(c=>`<option value="${c}">${c}</option>`).join("");
}

function loadQuestions(){
  const list=document.getElementById("questionList");
  if(!list) return;
  const qs=getQuestions();
  list.innerHTML="";
  if(qs.length===0) return list.innerHTML="<li class='muted'>No questions</li>";
  qs.forEach((q,i)=>{
    list.innerHTML+=`<li>
      <div>
        <b>${q.q}</b> [${q.category}]
        <small class='muted'>A:${q.options.A} | B:${q.options.B} | C:${q.options.C} | D:${q.options.D} | Correct: ${q.correct}</small>
      </div>
      <div>
        <button class="btn small" onclick="editQuestion(${i})">Edit</button>
        <button class="btn small alt" onclick="deleteQuestion(${i})">Delete</button>
      </div>
    </li>`;
  });
}

/* ---------- Init on Page Load ---------- */
window.addEventListener("load", ()=>{
  const page=location.pathname.split("/").pop();
  const logged=localStorage.getItem("q_logged_in");

  if(document.getElementById("welcomeUser")){
    document.getElementById("welcomeUser").innerText =
      logged && logged!=="teacher" ? `Hi, ${logged}` : (logged==="teacher" ? "Teacher" : "");
  }

  if(page==="admin_dashboard.html"){
    if(logged!=="teacher") return location.href="index.html";
    loadCategories();
    loadQuestions();
    loadResults();
    loadStudents();
  }
  if(page==="quiz.html"){
    if(!logged || logged==="teacher") return location.href="index.html";
    loadCategories();
  }
  if(page==="result.html"){ loadResultPage(); }
  if(page==="profile.html"){ loadProfilePage(); }
});
