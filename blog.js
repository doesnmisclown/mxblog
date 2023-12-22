let posts = [];
const table = document.querySelector("table");
  
function getReactions(posts,p){
      let reactions = [];
      const preReactions = posts.filter(f => f.type == "m.reaction" && f.content["m.relates_to"].event_id == p.event_id).map(m => m.content["m.relates_to"]);
       preReactions.forEach(pr => {
         let r2 = reactions.find(f => f.key == pr.key);
         if(!r2) return reactions.push({
           key: pr.key,
           count: 1
         });
        reactions.find(f => f.key == pr.key).count++;
       });
       return '<div class="tags">' + reactions.map(m => `<span class="tag is-rounded">${m.count > 1 ? m.count: ''} ${DOMPurify.sanitize(m.key)}</span>`).join("") + "</div>";
}

    if(!localStorage.access_token){
      fetch("https://matrix.org/_matrix/client/v3/register?kind=guest", {method: "post", body: "{}"}).then(r => r.json()).then(json => {
        if(!json.access_token) console.log(json);
        localStorage.access_token = json.access_token;
      });
    }
function printPost(post,roomId,noButton){
let body = DOMPurify.sanitize(post.content.formatted_body ?? post.content.body);
body = body.split("\n").join("<br>");
    table.innerHTML += `<tr><td>${body}${post.content.msgtype == "m.image" ? `<br><img src="https://matrix.org/_matrix/media/v3/download/${post.content.url.slice(6)}">` : ''}${!noButton ? `<a href="#${roomId}/${post.event_id}">Открыть</a>` : ''}</td></tr>`;
}

function loadPosts(roomId,start){
const ignored_events = [];
table.innerHTML = `<tr><th>Контент</th></tr>`;
if(posts.length < 1 || start != undefined){
fetch("https://matrix.org/_matrix/client/v3/rooms/" + encodeURIComponent(roomId) + "/messages?limit=50&access_token=" + localStorage.access_token + (start ? `&from=${start}`: '') + "&dir=b").then(r => r.json()).then(json => {
if(json.errcode == "M_FORBIDDEN"){
  table.innerHTML = `<tr><th>Запрещено</th></tr><tr><td>Гостевой аккаунт не может получить доступ к этой комнате</td></tr>`;
  return false;
}
json.chunk.forEach(c => {
if(!["m.room.message","m.reaction"].includes(c.type)) return;
if(c.redacted_because) return;
if(ignored_events.includes(c.event_id)) return;
if(c.type == "m.room.message"){
    if(c.content.formatted_body != undefined){
      c.content.body = "";
      if(c.content["m.new_content"]) c.content["m.new_content"].body = "";
    }
  }
  
  if(c.content["m.new_content"]){
    if(ignored_events.includes(c.content["m.relates_to"].event_id)) return;
    ignored_events.push(c.content["m.relates_to"].event_id);
    c.content = c.content["m.new_content"];
  }
  posts.push(c);
  });
posts.forEach((p,i,a) => {
printPost(p,roomId);
});
if(json.end) table.innerHTML += `<button class="button is-fullwidth" onclick="loadPosts('${roomId}','${json.end}')">Ещё</button>`;
});
}
}
    
    window.onhashchange = () => {
    let hash = location.hash.slice(1);
   if(hash.startsWith("!") && !hash.includes("/")){
      return loadPosts(hash,undefined);
    }
    if(hash.includes("/")){
      hash = hash.split("/");
      fetch(`https://matrix.org/_matrix/client/v3/rooms/${hash[0]}/context/${hash[1]}?limit=0`, {
        headers: {
          Authorization: `Bearer ${localStorage.access_token}`
        }
      }).then(r => r.json()).then(json => {
        if(json.event){
    const post = json.event;
table.innerHTML = `<tr><th>Контент</th></tr>`;
    printPost(post,hash[0],true);
        }
      });
    }else{
//loadPosts("roomId");
table.innerHTML = "<tr><th>Добро пожаловать</th></tr><tr><td>Это блог работающий поверх децентрализованного мессенджера Matrix</td></tr>"
    }
    };
window.addEventListener("load", () => {
  window.onhashchange();
});