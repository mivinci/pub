window.addEventListener("DOMContentLoaded", event => {

  const MSG_TYPE_SYSTEM = 1;
  const MSG_TYPE_OTHER = 2;
  const MSG_TYPE_SELF = 3;

  const MSG_MAX_LEN = 800;

  const sendBtn = document.getElementById("send-btn");
  const exitBtn = document.getElementById("exit-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const input = document.getElementById("input");
  const stateBar = document.getElementById("state");
  const log = document.getElementById("log");

  let matched = false
  let textReady = "";
  let id = new URLSearchParams(document.location.search).get("id");

  let socket = new WebSocket(`wss://${document.location.host}/ws?id=${id}`);

  if (socket.readyState === 3) {
    alert("服务器走丢啦～");
    return;
  }
  
  socket.onclose = evt => {
    setPubState('无连接');
    appendBubble({text: '您已断线'}, MSG_TYPE_SYSTEM);
  }

  socket.onmessage = evt => {
    let sysMsg;
    const json = JSON.parse(evt.data);
    if (json['Type'] === MSG_TYPE_SYSTEM) {
      sysMsg = json['Content'];
      if (sysMsg === "START") {
        matched = true;
        activeSendBtn();
      }
      if (sysMsg === "LOSE" || sysMsg === "CLOSE") {
        matched = false;
        disableSendBtn();
      }
      setPubState(getState(json));
      appendBubble(getSysMsg(json), MSG_TYPE_SYSTEM);
      return;
    }
    if (json['Type'] === MSG_TYPE_OTHER) {
      if (json['Sender'] === id) {
        appendBubble({id: id, text: json['Content']}, MSG_TYPE_SELF);
      } else {
        appendBubble({id: json['Sender'], text: json['Content']}, MSG_TYPE_OTHER);
      }
    }
  }

  input.addEventListener("input", function (evt) {
    textReady = this.value;
  });

  sendBtn.addEventListener("click", sendMsg);

  exitBtn.addEventListener("click", function(evt) {
    if (confirm("确定要退出吗？")) {
      socket.close();
      socket = null;
      setPubState('无连接');
    }
  });

  refreshBtn.addEventListener("click", evt => {
    if (confirm("刷新会失去与对方的连接，确定刷新吗？")) {
      socket.close();
      socket = null;
      document.location.reload();
    }
  })

  input.addEventListener("keypress", evt => {
    if (evt.key === 'Enter') {
      sendMsg();
    }
  })

  function sendMsg() {
    if (!socket) {
      return;
    }
    if (!matched) {
      return;
    }
    if (!textReady || textReady.length <= 0) {
      return;
    }
    if (textReady.length > MSG_MAX_LEN) {
      alert(`最多一次发送${MSG_MAX_LEN}字哦～`);
      return;
    }
    socket.send(textReady);
    input.value = "";
    textReady = "";
  }

  function bubble(msg) {
    return `<div class="bb-id">${msg.id}</div><div class="bb-text">${msg.text}</div>`;
  }

  function bubbleSys(msg) {
    return `<div class="bb-text">${msg.text}</div>`;
  }

  function appendBubble(msg, type) {
    let item = document.createElement("div");

    if (type === MSG_TYPE_SYSTEM) {
      item.classList.add("bb-sys");
      item.innerHTML = bubbleSys(msg);
    } else {
      item.classList.add("bb");
      if (type === MSG_TYPE_SELF) {
        item.classList.add("bb-right");
      } else {
        item.classList.add("bb-left");
      }
      item.innerHTML = bubble(msg);
    }

    const scroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1;
    log.appendChild(item);
    if (scroll) {
      log.scrollTop = log.scrollHeight - log.clientHeight;
    }
  }

  function disableSendBtn() {
    sendBtn.classList.add("btn-disable");
  }

  function activeSendBtn() {
    sendBtn.classList.remove("btn-disable");
  }

  function setPubState(text) {
    stateBar.innerText = text;
  }

  function getSysMsg(json) {
    let msg = {};
    switch (json["Content"]) {
      case "HALT": msg.text = "匹配中，请等待"; break;
      case "CLOSE": msg.text = "连接已断开"; break;
      case "START": msg.text = "匹配成功，开始聊天吧"; break;
      case "LOSE": msg.text = "对方已断线，请重新匹配"; break;
      default: msg.text = json["Content"];
    }
    return msg;
  }

  function getState(json) {
    let text = "";
    switch (json["Content"]) {
      case "HALT": text = "匹配中"; break;
      case "CLOSE": text = "连接已断开"; break;
      case "START": text = "连接稳定"; break;
      case "LOSE": text = "对方已断线"; break;
      default: ;
    }
    return text;
  }

  setInterval(() => {
    const t = new Date();
    const msg = {
      text: `${t.getHours()}:${t.getMinutes()}`
    }
    appendBubble(msg, MSG_TYPE_SYSTEM);
  }, 1000 * 60 * 15);
})


