const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "songdrop-dedications-v1";
let dedications = loadDedications();
let activeFilter = "All";
let voiceBlob = null;
let mediaRecorder = null;
let audioChunks = [];
let voiceUrl = null;

function loadDedications(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []} }
function saveDedications(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(dedications)); }
function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400);}
function makeId(){return "sd-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
function updatePreview(){
  $("previewRecipient").textContent=($("recipient").value.trim()||"SOMEONE SPECIAL").toUpperCase();
  $("previewMessage").textContent='“'+($("message").value.trim()||"Some songs say the things we don't know how to.")+'”';
  $("previewSong").textContent=$("songTitle").value.trim()||"Your song goes here";
  $("previewArtist").textContent=$("artist").value.trim()||"Artist name";
  $("previewMood").textContent="✦ "+$("mood").value.toUpperCase();
  $("livePreview").className="dedication-card theme-"+$("theme").value;
  $("messageCount").textContent=$("message").value.length+" / 280";
}
["recipient","message","songTitle","artist","mood","theme"].forEach(id=>$(id).addEventListener("input",updatePreview));
$("mood").addEventListener("change",updatePreview);
$("theme").addEventListener("change",updatePreview);
$("anonymous").addEventListener("change",()=> $("senderWrap").classList.toggle("hidden",$("anonymous").checked));
$("dedicationForm").addEventListener("submit",e=>{
  e.preventDefault();
  const item={id:makeId(),recipient:$("recipient").value.trim(),message:$("message").value.trim(),mood:$("mood").value,theme:$("theme").value,songTitle:$("songTitle").value.trim(),artist:$("artist").value.trim(),songUrl:$("songUrl").value.trim(),anonymous:$("anonymous").checked,sender:$("anonymous").checked?"":$("sender").value.trim(),mystery:$("mystery").checked,allowReplies:$("allowReplies").checked,reactions:{heart:0,fire:0},replies:[],createdAt:new Date().toISOString(),voice:null};
  if(!item.recipient||!item.message||!item.songTitle){toast("Please complete the required fields.");return;}
  if(voiceBlob){const reader=new FileReader();reader.onload=()=>{item.voice=reader.result;storeItem(item)};reader.readAsDataURL(voiceBlob);}
  else storeItem(item);
});
function storeItem(item){
  dedications.unshift(item);saveDedications();renderWall();showCreated(item);toast("Your song card is ready!");
  $("dedicationForm").reset();voiceBlob=null;if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceUrl=null;$("voicePlayback").classList.add("hidden");$("clearVoice").classList.add("hidden");$("recordStatus").textContent="A little voice note";$("recordHint").textContent="Up to 30 seconds · saved on this device";$("senderWrap").classList.add("hidden");updatePreview();
}
function showCreated(item){
  const box=$("createdResult");box.classList.remove("hidden");
  const url=location.href.split("#")[0]+"#card="+encodeURIComponent(item.id);
  box.innerHTML=`<b>✦ Your dedication has been added to the song wall.</b><span>Share this link with ${escapeHtml(item.recipient)}:</span><div class="result-actions"><button class="small-button" id="copyLink">Copy card link</button><button class="small-button" id="showQr">Show QR code</button></div><div id="qrHolder" class="hidden" style="padding:14px;background:white;width:max-content;margin-top:12px;border-radius:10px"></div>`;
  $("copyLink").onclick=()=>copyText(url);
  $("showQr").onclick=()=>{const holder=$("qrHolder");holder.classList.toggle("hidden");holder.innerHTML="";if(!holder.classList.contains("hidden")){if(window.QRCode)new QRCode(holder,{text:url,width:150,height:150,colorDark:"#211d36",colorLight:"#ffffff"});else holder.textContent="QR library needs an internet connection.";}};
}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast("Link copied!");}catch{toast("Copy isn't available in this browser.");}}
function renderWall(){
  const list=dedications.filter(d=>activeFilter==="All"||d.mood===activeFilter);
  $("wallCount").textContent=list.length+" dedication"+(list.length===1?"":"s");
  $("emptyState").classList.toggle("hidden",list.length>0);
  $("wallGrid").innerHTML=list.map(d=>`<article class="wall-card theme-${escapeHtml(d.theme)}" data-open="${escapeHtml(d.id)}">
    <span class="wall-mood">✦ ${escapeHtml(d.mood.toUpperCase())} · FOR ${escapeHtml(d.recipient.toUpperCase())}</span>
    <blockquote>“${escapeHtml(d.message)}”</blockquote>
    <div class="wall-song"><div class="song-thumb">♫</div><div><b>${escapeHtml(d.songTitle)}</b><small>${escapeHtml(d.artist||"A song dedication")}</small></div></div>
    <div class="wall-card-actions"><span>${d.anonymous?"from someone ✧":"from "+escapeHtml(d.sender||"a friend")}</span><span><button data-react="heart" data-id="${escapeHtml(d.id)}" aria-label="React with heart">♡ ${d.reactions?.heart||0}</button><button data-react="fire" data-id="${escapeHtml(d.id)}" aria-label="React with fire">✦ ${d.reactions?.fire||0}</button></span></div>
  </article>`).join("");
  $("wallGrid").querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("[data-react]"))return;openCard(el.dataset.open)}));
  $("wallGrid").querySelectorAll("[data-react]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();react(btn.dataset.id,btn.dataset.react)}));
}
function react(id,type){const d=dedications.find(x=>x.id===id);if(!d)return;d.reactions=d.reactions||{heart:0,fire:0};d.reactions[type]=(d.reactions[type]||0)+1;saveDedications();renderWall();toast("Reaction added!");}
function openCard(id){
  const d=dedications.find(x=>x.id===id);if(!d)return;
  const dialog=$("cardDialog"),content=$("dialogContent");
  const senderLabel=d.anonymous?"Someone sent this":("Sent by "+(d.sender||"a friend"));
  content.innerHTML=`<div class="dialog-card"><div class="eyebrow">${escapeHtml(d.mood.toUpperCase())} · A SONG FOR ${escapeHtml(d.recipient.toUpperCase())}</div><h3>${d.mystery?"A mystery song for you ✦":"A little song dedication"}</h3><p>“${escapeHtml(d.message)}”</p><div class="song-line"><div class="song-thumb">♫</div><div class="song-meta"><b>${escapeHtml(d.songTitle)}</b><small>${escapeHtml(d.artist||"Unknown artist")}</small></div></div><p class="fine-print">${senderLabel}</p>${d.songUrl?`<p><a href="${escapeHtml(d.songUrl)}" target="_blank" rel="noopener">Open song ↗</a></p>`:""}${d.voice?'<audio controls style="width:100%" src="'+d.voice+'"></audio>':""}
    ${d.mystery?`<div class="reply-list"><b>Who do you think sent this?</b><form id="guessForm"><input id="guessInput" maxlength="45" placeholder="Your guess"><button class="small-button">Submit guess</button></form><p id="guessResult"></p></div>`:""}
    <div class="reply-list"><b>Reactions</b><button class="small-button" id="heartReact">♡ Send a heart</button> <button class="small-button" id="fireReact">✦ Send a sparkle</button></div>
    ${d.allowReplies?`<div class="reply-list"><b>Replies (${d.replies.length})</b>${d.replies.map(r=>`<p><b>${escapeHtml(r.name||"Someone")}:</b> ${escapeHtml(r.text)}</p>`).join("")||"<p>No replies yet. Leave the first one.</p>"}<form class="reply-form" id="replyForm"><input id="replyName" maxlength="35" placeholder="Your name (optional)"><input id="replyText" maxlength="180" placeholder="Write a kind reply..." required><button class="small-button">Send reply</button></form></div>`:""}
    <div class="result-actions"><button class="small-button" id="dialogCopy">Copy share link</button><button class="small-button" id="dialogQr">Make QR code</button></div><div id="dialogQrBox" class="hidden" style="padding:12px;background:white;width:max-content;margin-top:12px"></div></div>`;
  $("heartReact").onclick=()=>react(id,"heart");$("fireReact").onclick=()=>react(id,"fire");
  if(d.mystery)$("guessForm").onsubmit=e=>{e.preventDefault();$("guessResult").textContent="Your guess has been noted! The sender chose whether to reveal their identity.";};
  if(d.allowReplies)$("replyForm").onsubmit=e=>{e.preventDefault();const text=$("replyText").value.trim();if(!text)return;d.replies.push({name:$("replyName").value.trim(),text});saveDedications();openCard(id);toast("Reply added.");};
  const url=location.href.split("#")[0]+"#card="+encodeURIComponent(id);
  $("dialogCopy").onclick=()=>copyText(url);
  $("dialogQr").onclick=()=>{const el=$("dialogQrBox");el.classList.toggle("hidden");el.innerHTML="";if(!el.classList.contains("hidden")){if(window.QRCode)new QRCode(el,{text:url,width:150,height:150});else el.textContent="QR library needs an internet connection.";}};
  dialog.showModal();
}
$("closeDialog").onclick=()=>$("cardDialog").close();
$("wallFilters").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{activeFilter=btn.dataset.filter;$("wallFilters").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===btn));renderWall();}));
document.querySelectorAll(".mood-tile").forEach(btn=>btn.addEventListener("click",()=>{$("mood").value=btn.dataset.mood;updatePreview();$("moodHint").textContent="Mood selected: "+btn.dataset.mood+". Your dedication form is ready.";document.querySelectorAll(".mood-tile").forEach(b=>b.style.outline=b===btn?"2px solid #8e7bd0":"none");$("create").scrollIntoView({behavior:"smooth"});}));

// Voice recording: browser microphone permission is required. Recording is stored with the dedication on this device.
$("recordBtn").addEventListener("click",async()=>{
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast("Voice recording is not supported in this browser.");return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    audioChunks=[];mediaRecorder=new MediaRecorder(stream);
    mediaRecorder.ondataavailable=e=>{if(e.data.size)audioChunks.push(e.data)};
    mediaRecorder.onstop=()=>{voiceBlob=new Blob(audioChunks,{type:mediaRecorder.mimeType||"audio/webm"});if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceUrl=URL.createObjectURL(voiceBlob);$("voicePlayback").src=voiceUrl;$("voicePlayback").classList.remove("hidden");$("clearVoice").classList.remove("hidden");$("recordStatus").textContent="Voice note ready";$("recordHint").textContent="It will be attached to your next dedication.";stream.getTracks().forEach(t=>t.stop());};
    mediaRecorder.start();$("recordBtn").classList.add("hidden");$("stopBtn").classList.remove("hidden");$("recordStatus").textContent="Recording…";$("recordHint").textContent="Keep it short. Maximum 30 seconds.";setTimeout(()=>{if(mediaRecorder?.state==="recording")stopRecording();},30000);
  }catch{toast("Microphone permission was not granted.");}
});
function stopRecording(){if(mediaRecorder?.state==="recording"){mediaRecorder.stop();$("stopBtn").classList.add("hidden");$("recordBtn").classList.remove("hidden");}}
$("stopBtn").addEventListener("click",stopRecording);
$("clearVoice").addEventListener("click",()=>{voiceBlob=null;if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceUrl=null;$("voicePlayback").src="";$("voicePlayback").classList.add("hidden");$("clearVoice").classList.add("hidden");$("recordStatus").textContent="A little voice note";$("recordHint").textContent="Up to 30 seconds · saved on this device";});

function handleHash(){const match=location.hash.match(/card=([^&]+)/);if(match){const id=decodeURIComponent(match[1]);setTimeout(()=>openCard(id),100);}}
updatePreview();renderWall();handleHash();
