window.addEventListener("DOMContentLoaded", event => {

  const MSG_TYPE_SYSTEM = 1;
  const MSG_TYPE_OTHER = 2;
  const MSG_TYPE_SELF = 3;

  const MSG_CONTENT_SYSTEM_HALT = "halt";
  const MSG_CONTENT_SYSTEM_START = "start";
  const MSG_CONTENT_SYSTEM_CLOSE = "close";
  const MSG_CONTENT_SYSTEM_LOSE = "lose";

  const sendBtn = document.getElementById("send-btn");
  const exitBtn = document.getElementById("exit-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const input = document.getElementById("input");

  let textReady = "";
  let id = new URLSearchParams(document.location.search).get("id");

  let socket = new WebSocket(`ws://${document.location.host}/ws?id=${id}`);

  if (socket.readyState === 3) {
    alert("服务器走丢啦～");
    return;
  }
  
  socket.onclose = evt => {
    appendBubble({text: '您已断线'}, MSG_TYPE_SYSTEM);
  }

  socket.onmessage = evt => {
    const json = JSON.parse(evt.data);
    if (json['Type'] === MSG_TYPE_SYSTEM) {
      if (json['Content'] === "start") {
        sendBtn.removeAttribute("disabled");
      }
      appendBubble(getSysMsg(json), MSG_TYPE_SYSTEM);
      return;
    }
    if (json['Type'] === MSG_TYPE_OTHER) {
      if (json['Sender'] === id) {
        appendBubble({id: id, text: json['Content']}, MSG_TYPE_SELF);
      } else {
        appendBubble({id: id, text: json['Content']}, MSG_TYPE_OTHER);
      }
    }
  }

  input.addEventListener("input", function (evt) {
    textReady = this.value;
  });

  sendBtn.addEventListener("click", function (evt) {
    sendMsg();
  });

  exitBtn.addEventListener("click", function(evt) {
    if (confirm("确定要退出吗？")) {
      socket.close();
    }
  });

  refreshBtn.addEventListener("click", evt => {
    if (confirm("刷新会失去与对方的连接，确定刷新吗？")) {
      socket.close();
      socket = null;
      document.location.reload();
    }
  })

  function sendMsg() {
    if (!socket) {
      return;
    }
    if (!textReady || textReady.length <= 0) {
      return;
    }
    socket.send(textReady);
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

    const log = document.getElementById("log");
    const scroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1;
    log.appendChild(item);
    if (scroll) {
      log.scrollTop = log.scrollHeight - log.clientHeight;
    }
  }

  function getSysMsg(json) {
    let msg = {};
    switch (json["Content"]) {
      case "halt": msg.text = "匹配中，请等待"; break;
      case "close": msg.text = "连接已断开"; break;
      case "start": msg.text = "匹配成功，开始聊天吧"; break;
      case "lose": msg.text = "对方已断线，请重新匹配"; break;
      default: msg.text = json["Content"];
    }
    return msg;
  }
})
