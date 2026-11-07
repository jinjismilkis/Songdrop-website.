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

function validClip(startValue,endValue){
  const start=Number(startValue),end=Number(endValue);
  if(startValue==="" || endValue==="" || !Number.isFinite(start) || !Number.isFinite(end) || start<0 || end<=start) return null;
  return {start:Math.floor(start),end:Math.floor(end)};
}
function vinylMarkup(coverUrl){
  let image='';
  if(coverUrl){
    try{const u=new URL(coverUrl);if(['https:','http:'].includes(u.protocol)) image=`<img src="${escapeHtml(u.href)}" alt="Album cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`;}catch{}
  }
  return `<div class="vinyl-stage" aria-label="Vinyl record with album artwork"><div class="vinyl-record">${image}<span class="vinyl-fallback" ${image?'style="display:none"':''}>♫</span></div></div>`;
}
function songPlayerMarkup(rawUrl,coverUrl,clipStart,clipEnd){
  if(!rawUrl) return '<p class="player-help">No playable song link was added to this dedication.</p>';
  try{
    const url=new URL(rawUrl);
    if(url.protocol!=='https:' && url.protocol!=='http:') throw new Error('Unsupported URL');
    const host=url.hostname.replace(/^www\./,'').toLowerCase();
    const clip=validClip(String(clipStart??''),String(clipEnd??''));
    let embed='';
    if(host==='youtube.com' || host==='m.youtube.com' || host==='youtu.be' || host==='youtube-nocookie.com'){
      let id='';
      if(host==='youtu.be') id=url.pathname.split('/').filter(Boolean)[0]||'';
      else if(url.pathname==='/watch') id=url.searchParams.get('v')||'';
      else { const parts=url.pathname.split('/').filter(Boolean); if(['embed','shorts','live'].includes(parts[0])) id=parts[1]||''; }
      if(/^[A-Za-z0-9_-]{11}$/.test(id)){
        const params=new URLSearchParams({rel:'0'});if(clip){params.set('start',String(clip.start));params.set('end',String(clip.end));}
        embed=`<div class="player-with-vinyl">${vinylMarkup(coverUrl)}<div class="song-player"><iframe src="https://www.youtube-nocookie.com/embed/${id}?${params.toString()}" title="YouTube song player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div></div>`;
      }
    } else if(host==='open.spotify.com'){
      const parts=url.pathname.split('/').filter(Boolean);
      const type=parts[parts.length-2], id=parts[parts.length-1];
      if(['track','album','playlist','episode','show'].includes(type) && /^[A-Za-z0-9]{22}$/.test(id)) embed=`<div class="player-with-vinyl">${vinylMarkup(coverUrl)}<div class="song-player spotify-player"><iframe src="https://open.spotify.com/embed/${type}/${id}" title="Spotify song player" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div></div>${clip?'<p class="player-help">Clip timing is controlled by Spotify for this link.</p>':''}`;
    } else if(host==='soundcloud.com'){
      embed=`<div class="player-with-vinyl">${vinylMarkup(coverUrl)}<div class="song-player soundcloud-player"><iframe src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&auto_play=false&hide_related=true" title="SoundCloud song player" loading="lazy" allow="autoplay"></iframe></div></div>${clip?'<p class="player-help">Clip timing is controlled by SoundCloud for this link.</p>':''}`;
    } else if(/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(url.pathname)){
      embed=`<div class="player-with-vinyl">${vinylMarkup(coverUrl)}<audio class="direct-audio-player" controls preload="metadata" src="${escapeHtml(url.href)}" ${clip?`data-clip-start="${clip.start}" data-clip-end="${clip.end}"`:''}>Your browser does not support audio playback.</audio></div>`;
    }
    if(embed) return `<div class="listen-section"><b>Listen to this song</b>${embed}${clip?`<small class="clip-range-label">Selected portion: ${clip.start}s–${clip.end}s</small>`:''}</div>`;
    return `<p class="player-help">This link can't be played in the card. <a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">Open song in a new tab ↗</a></p>`;
  }catch{return '<p class="player-help">Please add a valid public song link to enable playback.</p>';}
}
function setupClipPlayers(root){
  root.querySelectorAll('audio[data-clip-start][data-clip-end]').forEach(audio=>{
    const start=Number(audio.dataset.clipStart),end=Number(audio.dataset.clipEnd);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return;
    audio.addEventListener('loadedmetadata',()=>{audio.currentTime=Math.min(start,audio.duration||start);});
    audio.addEventListener('play',()=>{if(audio.currentTime<start||audio.currentTime>=end)audio.currentTime=start;});
    audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=end){audio.pause();audio.currentTime=start;}});
  });
}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400);}
function makeId(){return "sd-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
function updatePreview(){
  $("previewRecipient").textContent=($("recipient").value.trim()||"SOMEONE SPECIAL").toUpperCase();
  $("previewMessage").textContent='“'+($("message").value.trim()||"Some songs say the things we don't know how to.")+'”';
  $("previewSong").textContent=$("songTitle").value.trim()||"Your song goes here";
  $("previewArtist").textContent=$("artist").value.trim()||"Artist name";
  $("previewMood").textContent="✦ "+$("mood").value.toUpperCase();
  const cover=$("coverUrl").value.trim();
  const thumb=$("livePreview").querySelector(".song-thumb");
  thumb.innerHTML=cover?`<img src="${escapeHtml(cover)}" alt="Album cover" onerror="this.remove()">`:"♫";
  $("livePreview").className="dedication-card theme-"+$("theme").value;
  $("messageCount").textContent=$("message").value.length+" / 280";
}
["recipient","message","songTitle","artist","mood","theme","coverUrl"].forEach(id=>$(id).addEventListener("input",updatePreview));
$("mood").addEventListener("change",updatePreview);
$("theme").addEventListener("change",updatePreview);
$("anonymous").addEventListener("change",()=> $("senderWrap").classList.toggle("hidden",$("anonymous").checked));
$("dedicationForm").addEventListener("submit",e=>{
  e.preventDefault();
  const clipStartValue=$("clipStart").value.trim(),clipEndValue=$("clipEnd").value.trim();
  if((clipStartValue!=="" || clipEndValue!=="") && !validClip(clipStartValue,clipEndValue)){toast("Enter both clip times, and make sure the end is after the start.");return;}
  const item={id:makeId(),recipient:$("recipient").value.trim(),message:$("message").value.trim(),mood:$("mood").value,theme:$("theme").value,songTitle:$("songTitle").value.trim(),artist:$("artist").value.trim(),songUrl:$("songUrl").value.trim(),coverUrl:$("coverUrl").value.trim(),clipStart:$("clipStart").value,clipEnd:$("clipEnd").value,anonymous:$("anonymous").checked,sender:$("anonymous").checked?"":$("sender").value.trim(),mystery:$("mystery").checked,allowReplies:$("allowReplies").checked,reactions:{heart:0,fire:0},replies:[],createdAt:new Date().toISOString(),voice:null};
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
  content.innerHTML=`<div class="dialog-card"><div class="eyebrow">${escapeHtml(d.mood.toUpperCase())} · A SONG FOR ${escapeHtml(d.recipient.toUpperCase())}</div><h3>${d.mystery?"A mystery song for you ✦":"A little song dedication"}</h3><p>“${escapeHtml(d.message)}”</p><div class="song-line"><div class="song-thumb">♫</div><div class="song-meta"><b>${escapeHtml(d.songTitle)}</b><small>${escapeHtml(d.artist||"Unknown artist")}</small></div></div><p class="fine-print">${senderLabel}</p>${d.songUrl?songPlayerMarkup(d.songUrl,d.coverUrl,d.clipStart,d.clipEnd):""}${d.voice?'<div class="listen-section"><b>Voice dedication</b><audio controls style="width:100%" src="'+d.voice+'"></audio></div>':""}
    ${d.mystery?`<div class="reply-list"><b>Who do you think sent this?</b><form id="guessForm"><input id="guessInput" maxlength="45" placeholder="Your guess"><button class="small-button">Submit guess</button></form><p id="guessResult"></p></div>`:""}
    <div class="reply-list"><b>Reactions</b><button class="small-button" id="heartReact">♡ Send a heart</button> <button class="small-button" id="fireReact">✦ Send a sparkle</button></div>
    ${d.allowReplies?`<div class="reply-list"><b>Replies (${d.replies.length})</b>${d.replies.map(r=>`<p><b>${escapeHtml(r.name||"Someone")}:</b> ${escapeHtml(r.text)}</p>`).join("")||"<p>No replies yet. Leave the first one.</p>"}<form class="reply-form" id="replyForm"><input id="replyName" maxlength="35" placeholder="Your name (optional)"><input id="replyText" maxlength="180" placeholder="Write a kind reply..." required><button class="small-button">Send reply</button></form></div>`:""}
    <div class="result-actions"><button class="small-button" id="dialogCopy">Copy share link</button><button class="small-button" id="dialogQr">Make QR code</button></div><div id="dialogQrBox" class="hidden" style="padding:12px;background:white;width:max-content;margin-top:12px"></div></div>`;
  setupClipPlayers(content);
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
