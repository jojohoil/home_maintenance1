const $ = s => document.querySelector(s);

$("#unlock").addEventListener("click", () => {
  const ok = ($("#adminPass").value.trim() === window.APP_CONFIG.ADMIN_PASSWORD);
  if(!ok){ alert("كلمة المرور غير صحيحة"); return; }
  document.getElementById("adminArea").classList.remove("hidden");
  load();
});

async function fetchAll(){
  const url = `${window.APP_CONFIG.APPS_SCRIPT_URL}?action=list`;
  const r = await fetch(url);
  const j = await r.json();
  if(j && (j.status==="ok" || j.status==="success") && Array.isArray(j.data)) return j.data;
  return [];
}

function avg(arr){ if(!arr.length) return 0; return (arr.reduce((a,b)=>a+Number(b||0),0)/arr.length).toFixed(1); }

function drawChart(passes, total){
  const ctx = document.getElementById("pieChart");
  if(!ctx) return;
  if(window._pie) window._pie.destroy();
  window._pie = new Chart(ctx, {
    type: "pie",
    data: { labels: ["ناجح", "يحتاج إعادة"], datasets: [{ data: [passes, Math.max(total - passes, 0)], backgroundColor: ["#007a3d", "#cf8a1b"] }] },
    options: { responsive:true, plugins:{ legend:{ position:"bottom" } } }
  });
}

async function load(){
  const list = await fetchAll();
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";
  list.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name||""}</td><td>${r.id||""}</td><td>${r.phone||""}</td><td>${r.email||""}</td><td>${r.birth||""}</td>
      <td>${r.quiz?.q1||""}</td><td>${r.quiz?.q2||""}</td><td>${r.quiz?.q3||""}</td><td>${r.score||""}</td>
      <td>${r.ratings?.presenter||""}</td><td>${r.ratings?.content||""}</td><td>${r.finished_at||""}</td>
    `;
    tbody.appendChild(tr);
  });
  const total = list.length;
  const passes = list.filter(r => Number(String(r.score||"").match(/\d+/)?.[0] || 0) >= 2).length;
  const passPct = total ? Math.round((passes/total)*100) : 0;
  const avgPresenter = avg(list.map(r => r.ratings?.presenter));
  const avgContent = avg(list.map(r => r.ratings?.content));
  document.getElementById("stat_total").textContent = total;
  document.getElementById("stat_pass").textContent = passPct + "%";
  document.getElementById("stat_rate_presenter").textContent = avgPresenter;
  document.getElementById("stat_rate_content").textContent = avgContent;
  drawChart(passes, total);
}
document.getElementById("refresh").addEventListener("click", load);
document.getElementById("exportExcel").addEventListener("click", async () => {
  const rows = [["الاسم","الهوية","الجوال","البريد","الميلاد","إجابة1","إجابة2","إجابة3","النتيجة","تقييم مقدم","تقييم محتوى","وقت الإنهاء"]];
  const list = await fetchAll();
  list.forEach(r => rows.push([r.name||"",r.id||"",r.phone||"",r.email||"",r.birth||"",r.quiz?.q1||"",r.quiz?.q2||"",r.quiz?.q3||"",r.score||"",r.ratings?.presenter||"",r.ratings?.content||"",r.finished_at||""]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "الردود");
  XLSX.writeFile(wb, "home_maintenance_responses.xlsx");
});