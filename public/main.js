const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const PAGES = ["#formCard","#video1Card","#video2Card","#quizCard","#ratingCard","#doneCard"];

function show(id){ PAGES.forEach(p => $(p).classList.add("hidden")); $(id).classList.remove("hidden"); window.scrollTo({top:0,behavior:"smooth"}); }
function setProgress(step){ const bar = $("#bar"); const steps = PAGES.length-1; bar.style.width = Math.round((step/steps)*100) + "%"; }

function showToast(msg, type="err", timeout=2500){
  const t = $("#toast"); if(!t) return;
  t.className = ""; t.classList.add(type === "ok" ? "ok" : "err");
  t.textContent = msg; t.style.display = "block";
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>{ t.style.display = "none"; }, timeout);
}

const isArabicOnly = v => /^[\u0600-\u06FF\s]+$/.test((v||"").trim());
const isSaudiId = v => /^[12]\d{9}$/.test((v||"").trim());
const isSaPhone = v => /^05\d{8}$/.test((v||"").").trim());

$("#scrollStart").addEventListener("click", ()=> $("#formCard").scrollIntoView({behavior:'smooth'}));

$("#startBtn").addEventListener("click", async () => {
  const name = $("#name").value.trim();
  const id = $("#idNumber").value.trim();
  const phone = $("#phone").value.trim();
  const email = $("#email").value.trim();
  const birth = $("#birthdate").value;

  if(!isArabicOnly(name) || name.split(/\s+/).length < 4){
    return showToast("⚠️ يجب إدخال الاسم الرباعي باللغة العربية فقط.", "err");
  }
  if(!isSaudiId(id)){
    return showToast("⚠️ رقم الهوية الوطنية غير صحيح (10 أرقام سعودية فقط).", "err");
  }
  if(!isSaPhone(phone)){
    return showToast("⚠️ رقم الجوال السعودي يبدأ بـ05 ويتكون من 10 أرقام.", "err");
  }
  if(!email){ return showToast("⚠️ الرجاء إدخال البريد الإلكتروني.", "err"); }
  if(!birth){ return showToast("⚠️ الرجاء اختيار تاريخ الميلاد.", "err"); }

  const localIds = JSON.parse(localStorage.getItem("hm_ids") || "[]");
  if(localIds.includes(id)){ return showToast("⚠️ رقم الهوية مسجل مسبقًا في هذا المتصفح.", "err"); }

  try{
    const existsRes = await fetch(`${window.APP_CONFIG.APPS_SCRIPT_URL}?action=exists&id=${encodeURIComponent(id)}`, {method:"GET"});
    const existsJson = await existsRes.json();
    if(existsJson && existsJson.exists === true){
      return showToast("⚠️ رقم الهوية مسجل مسبقًا في النظام، لا يمكن التسجيل مرتين.", "err");
    }
  }catch(e){ console.warn("Existence check failed", e); }

  sessionStorage.setItem("hm_user", JSON.stringify({name,id,phone,email,birth,ts:new Date().toISOString()}));
  show("#video1Card"); setProgress(1);
  showToast("تم حفظ البيانات الأولية، انتقل للخطوة التالية.", "ok", 1600);
});

$("#prevVideo1").addEventListener("click", ()=> { show("#formCard"); setProgress(0); });
$("#nextVideo1").addEventListener("click", ()=> { show("#video2Card"); setProgress(2); });
$("#prevVideo2").addEventListener("click", ()=> { show("#video1Card"); setProgress(1); });
$("#nextVideo2").addEventListener("click", ()=> { show("#quizCard"); setProgress(3); });
$("#prevQuiz").addEventListener("click", ()=> { show("#video2Card"); setProgress(2); });

$("#resultBtn").addEventListener("click", () => {
  const q1 = $$("input[name=q1]").find(r => r.checked)?.value;
  const q2 = $$("input[name=q2]").find(r => r.checked)?.value;
  const q3 = $$("input[name=q3]").find(r => r.checked)?.value;
  if(!q1 || !q2 || !q3) return showToast("⚠️ الرجاء الإجابة على جميع الأسئلة.", "err");
  let score = 0; if(q1==="نعم") score++; if(q2==="نعم") score++; if(q3==="خطأ") score++;
  $("#result").textContent = `نتيجتك: ${score} من 3`;
  $("#resultNote").innerHTML = score>=2 ? '<span class="badge">ممتاز، انتقل للتقييم</span>' : '<span class="badge">يفضل إعادة مشاهدة المقاطع</span>';
  show("#ratingCard"); setProgress(4);
  showToast("تم احتساب نتيجتك.", "ok", 1600);
});

$("#prevRating").addEventListener("click", ()=> { show("#quizCard"); setProgress(3); });

$("#finishBtn").addEventListener("click", async () => {
  const user = JSON.parse(sessionStorage.getItem("hm_user") || "{}");
  if(!user?.id) return showToast("بيانات المستخدم غير مكتملة، ابدأ من جديد.", "err");
  const record = {
    name: user.name, id: user.id, phone: user.phone, email: user.email, birth: user.birth,
    quiz: { q1: $$("input[name=q1]").find(r=>r.checked)?.value || "", q2: $$("input[name=q2]").find(r=>r.checked)?.value || "", q3: $$("input[name=q3]").find(r=>r.checked)?.value || "" },
    score: ($("#result").textContent.match(/\d+/)||["0"])[0],
    ratings: { presenter: $("#rate1").value, content: $("#rate2").value },
    finished_at: new Date().toISOString()
  };

  try{
    const existsRes = await fetch(`${window.APP_CONFIG.APPS_SCRIPT_URL}?action=exists&id=${encodeURIComponent(record.id)}`);
    const existsJson = await existsRes.json();
    if(existsJson && existsJson.exists === true){
      return showToast("⚠️ رقم الهوية مسجل مسبقًا في النظام، لا يمكن الإرسال.", "err");
    }
  }catch{}

  try{
    const resp = await fetch(window.APP_CONFIG.APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(record) });
    const j = await resp.json();
    if(j && j.status === "duplicate"){ 
      return showToast("⚠️ رقم الهوية مسجل مسبقًا في النظام، لا يمكن الإرسال.", "err");
    }
    if(j && j.status === "success"){
      const localIds = JSON.parse(localStorage.getItem("hm_ids") || "[]");
      if(!localIds.includes(record.id)){ localIds.push(record.id); localStorage.setItem("hm_ids", JSON.stringify(localIds)); }
      $("#saveStatus").innerHTML = 'تم الحفظ في Google Sheets ✅';
      showToast("تم حفظ إدخالاتك بنجاح ✅", "ok", 2200);
    } else {
      $("#saveStatus").innerHTML = 'تعذّر الحفظ في Google Sheets ❌';
      showToast("تعذّر الحفظ في Google Sheets ❌", "err");
    }
  }catch(e){
    $("#saveStatus").innerHTML = 'تعذّر الحفظ، تحقق من الاتصال ❌';
    showToast("تعذّر الحفظ، تحقق من الاتصال ❌", "err");
  }
  show("#doneCard"); setProgress(5);
});

window.openAdmin = function(){ location.href = "admin.html"; };