window.addEventListener("DOMContentLoaded", event => {

  const MSG_TYPE_SYSTEM = 10;
  const MSG_TYPE_OTHER_CONTENT = 20;
  const MSG_TYPE_OTHER_FOCUSIN = 21;
  const MSG_TYPE_OTHER_FOCUSOUT = 22;
  const MSG_TYPE_SELF = 30;

  const MSG_MAX_LEN = 800;

  const STATE_HALT = "HALT";
  const STATE_START = "START";
  const STATE_CLOSE = "CLOSE";
  const STATE_LOSE = "LOSE";

  const sendBtn = document.getElementById("send-btn");
  const exitBtn = document.getElementById("exit-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const inputBar = document.getElementById("input");
  const stateBar = document.getElementById("state");
  const bbMain = document.getElementById("bb-main");

  let state = STATE_CLOSE;
  let sendBuf = "";
  let id = new URLSearchParams(document.location.search).get("id");

  let socket = new WebSocket(`ws://${document.location.host}/ws?id=${id}`);

  if (socket.readyState === 3) {
    alert("服务器走丢啦～");
    return;
  }
  
  socket.onopen = evt => {
    console.log("open")
  }

  socket.onclose = evt => {
    console.log("close")
  }

  socket.onmessage = evt => {
    console.log("messsage")
  }
  
})


