// ↓vscodeの関係ないエラーを無くす
// @ts-nocheck
let ws;
let chatUsersCtr = document.querySelector("#chatUsers");
let chatUsersCount = document.querySelector("#chatUsersCount");
let sendMessageForm = document.querySelector("#messageSendForm");
let messageInput = document.querySelector("#messageInput");
let chatMessagesCtr = document.querySelector("#chatMessages");
let leaveGroupBtn = document.querySelector("#leaveGroupBtn");
let groupName = document.querySelector("#groupName");

window.addEventListener("DOMContentLoaded", () => {
  ws = new WebSocket(`ws://localhost:3000/ws`);
  ws.addEventListener("open", onConnectionOpen);
  ws.addEventListener("message", onMessageReceived);
});

sendMessageForm.onsubmit = (ev) => {
  ev.preventDefault();
  if (!messageInput.value) {
    return;
  }
  const event = {
    event: "message",
    data: messageInput.value,
  };
  ws.send(JSON.stringify(event));
  messageInput.value = "";
};

leaveGroupBtn.onclick = () => {
  window.location.href = "index.html";
};

// 接続したとき
function onConnectionOpen() {
  console.log(`接続しました`);
  urlRedirect();
  const queryParams = getQueryParams();

  if (!queryParams.name || !queryParams.group) {
    window.location.href = "index.html";
    return;
  }
  groupName.innerHTML = queryParams.group;
  const event = {
    event: "join",
    groupName: queryParams.group,
    name: queryParams.name,
  };
  ws.send(JSON.stringify(event));
}

//メッセージを受け取ったとき
function onMessageReceived(event) {
  //console.log("メッセージデータ：");
  event = JSON.parse(event.data);
  switch (event.event) {
    case "users":
      chatUsersCount.innerHTML = event.data.length;
      chatUsersCtr.innerHTML = "";
      event.data.forEach((u) => {
        const userEl = document.createElement("div");
        userEl.className = "chat-user";
        userEl.innerHTML = u.name;
        chatUsersCtr.appendChild(userEl);
      });
      break;
    case "message":
      const el = chatMessagesCtr;
      const scrollToBottom =
        Math.floor(el.offsetHeight + el.scrollTop) === el.scrollHeight;
      appendMessage(event.data);

      if (scrollToBottom) {
        el.scrollTop = 10000000;
      }
      break;
    case "previousMessages":
      event.data.forEach(appendMessage);
      break;
    case "roomFull":
      redirect();
      break;
  }
}

//メッセージの埋め込み
function appendMessage(message) {
  const messageEl = document.createElement("div");
  if(message.sender === "me") {
    messageEl.className = "message message-to";
    messageEl.innerHTML = `<p class="message-text">${message.message}</p>`
  }
  else if(message.sender === "System" || (message.sender === undefined && message.name === "System")) {
    messageEl.className = "message message-System";
    messageEl.innerHTML = `<p class="message-system">${message.message}</p>`
  }
  else {
    messageEl.className = "message message-from";
    messageEl.innerHTML = `
      <h4>${message.name}</h4>
      <p class="message-text">${message.message}</p> `
  }
  chatMessagesCtr.appendChild(messageEl);
}

//名前とグループ名をURLから取得
function getQueryParams() {
  const search = window.location.search.substring(1);
  const pairs = search.split("&");
  const params = {};
  for (const pair of pairs) {
    const parts = pair.split("=");
    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return params;
}

function redirect() {
  window.location.href = "./index.html";
  return;
}

//リダイレクトするかしないか
function urlRedirect() {
  //現在のURLを取得
  const protocol = window.location.protocol;
  const host = window.location.host;
  //前のページであるはずのパス(今はindex.htmlから来るのを想定)
  const pathname = "/index.html";
  const previousPath1 = protocol + "//" + host + pathname;
  //index.html以外から来たらリダイレクト
  if(document.referrer !== previousPath1) {
    redirect();
  }
}