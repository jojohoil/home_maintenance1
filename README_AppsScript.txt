
# تذكير بكود Google Apps Script (منع التكرار + قراءة الردود)
function doPost(e) {
  var sheet = SpreadsheetApp.openById("1R2ebQsZnuc_-hGZAtZKEmNmI23jic2_LeDGXV4KCVN4").getSheetByName("Sheet1");
  var data = JSON.parse(e.postData.contents || "{}");
  var ids = sheet.getRange(2, 2, Math.max(sheet.getLastRow()-1,0), 1).getValues();
  var exists = ids.some(function(r){ return String(r[0]) === String(data.id); });
  if (exists) {
    return ContentService.createTextOutput(JSON.stringify({status: "duplicate", message: "رقم الهوية مسجل مسبقًا"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  sheet.appendRow([
    data.name, data.id, data.phone, data.email, data.birth,
    (data.quiz||{}).q1, (data.quiz||{}).q2, (data.quiz||{}).q3,
    data.score, (data.ratings||{}).presenter, (data.ratings||{}).content, new Date()
  ]);
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  var sheet = SpreadsheetApp.openById("1R2ebQsZnuc_-hGZAtZKEmNmI23jic2_LeDGXV4KCVN4").getSheetByName("Sheet1");
  var action = (e.parameter.action || "").toLowerCase();
  if (action === "exists") {
    var id = e.parameter.id || "";
    var idsRange = sheet.getRange(2, 2, Math.max(sheet.getLastRow()-1,0), 1).getValues();
    var exists = idsRange.some(function(r){ return String(r[0]) === String(id); });
    return ContentService.createTextOutput(JSON.stringify({exists: exists})).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "list") {
    var rows = sheet.getRange(2, 1, Math.max(sheet.getLastRow()-1,0), 12).getValues();
    var data = rows.map(function(r){
      return {
        name: r[0], id: r[1], phone: r[2], email: r[3], birth: r[4],
        quiz: { q1: r[5], q2: r[6], q3: r[7] },
        score: r[8], ratings: { presenter: r[9], content: r[10] }, finished_at: r[11]
      };
    });
    return ContentService.createTextOutput(JSON.stringify({status:"ok", data: data})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({status:"error", message:"unknown action"})).setMimeType(ContentService.MimeType.JSON);
}
