window.addEventListener("DOMContentLoaded", event => {

  const MSG_SYSTEM = 10;
  const MSG_OTHER_CONTENT = 20;
  const MSG_OTHER_FOCUSIN = 21;
  const MSG_OTHER_FOCUSOUT = 22;
  const MSG_SELF_CONTENT = 30;

  const MSG_MAX_LEN = 800;

  const STATE_HALT = "HALT";
  const STATE_START = "START";
  const STATE_CLOSE = "CLOSE";
  const STATE_LOSE = "LOSE";

  const STATE_FOCUSIN = "focusin";
  const STATE_FOCUSOUT = "focusout";

  const sendBtn = document.getElementById("send-btn");
  const exitBtn = document.getElementById("exit-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const inputBar = document.getElementById("input");
  const stateBar = document.getElementById("state");

  const Bubble = {
    dom: null,
    bbs: [],
    clones: [],
    maxBbs: 10,

    up(el) {
      this.dom = document.getElementById(el);
    },

    user(sender, receiver, text) {
      return `<div class="bb-id">${sender}</div><div class="bb-text">${text}</div>`;
    },

    system(text) {
      return `<div class="bb-text">${text}</div>`;
    },

    append({ type, sender, receiver, text }) {
      this.push(arguments[0]);
      this.split();

      let bb = document.createElement("div");
      if (type === MSG_SYSTEM) {
        bb.classList.add("bb-sys");
        bb.innerHTML = this.system(text);
      } else {
        bb.classList.add("bb");
        if (type === MSG_SELF_CONTENT) {
          bb.classList.add("bb-right");
        } else {
          bb.classList.add("bb-left");
        }
        bb.innerHTML = this.user(sender, receiver, text);
      }

      const scroll = this.dom.scrollTop > this.dom.scrollHeight - this.dom.clientHeight - 1;
      this.dom.appendChild(bb);
      if (scroll) {
        this.dom.scrollTop = this.dom.scrollHeight - this.dom.clientHeight;
      }
    },

    push(msg) {
      this.bbs.push(msg);
    },

    split() {
      if (this.bbs.length >= this.maxBbs) {
        this.clones.push(this.bbs);
        this.bbs = [];
        while (this.dom.hasChildNodes()) {
          this.dom.removeChild(this.dom.lastChild);
        }
        console.log(this.clones)
      }
    },

    tick() {
      setInterval(() => {
        const t = new Date();
        const msg = {
          type: MSG_SYSTEM,
          text: `${t.getHours()}:${t.getMinutes()}`
        }
        this.append(msg);
      }, 1000 * 60 * 30);
    },
  }

  Bubble.up("bb-main");
  Bubble.tick();

  const Pub = {
    o: STATE_CLOSE,
    get state() {
      return this.o;
    },

    /**
     * @param {string} value
     */
    set state(value) {
      this.o = value;
      switch (value) {
        case STATE_HALT: {
          stateBar.innerText = "匹配中";
          Bubble.append({
            type: MSG_SYSTEM,
            text: "匹配中，请等待"
          });
          return;
        }
        case STATE_START: {
          stateBar.innerText = "连接稳定";
          Bubble.append({
            type: MSG_SYSTEM,
            text: "匹配成功，开始聊天吧"
          });
          return;
        }
        case STATE_CLOSE: {
          stateBar.innerText = "无连接";
          Bubble.append({
            type: MSG_SYSTEM,
            text: "您已断开连接",
          });
          return;
        }
        case STATE_LOSE: {
          stateBar.innerText = "无连接";
          Bubble.append({
            type: MSG_SYSTEM,
            text: "对方已断线，请重新匹配"
          })
          return;
        }
        case STATE_FOCUSIN: {
          stateBar.innerText = "对方正在输入";
          return;
        }
        case STATE_FOCUSOUT: {
          stateBar.innerText = "连接稳定";
          return;
        }
        default: {
          stateBar.innerText = "无连接";
        }
      }
    },
  }



  let sendBuf = "";
  let id = new URLSearchParams(document.location.search).get("id");

  let socket = new WebSocket(`ws://${document.location.host}/ws?id=${id}`);

  if (socket.readyState === 3) {
    alert("服务器走丢啦～");
    return;
  }

  socket.onopen = evt => {
    stateBar.innerText = "连接稳定";
  }

  socket.onclose = evt => {
    Pub.state = STATE_CLOSE;
  }

  socket.onmessage = evt => {
    const json = JSON.parse(evt.data);
    const content = json["Content"];
    const type = json["Type"];
    const sender = json["Sender"];

    if (type === MSG_SYSTEM) {
      if (content === STATE_START) {
        Pub.state = STATE_START;
        sendBtn.classList.remove("btn-disable");
        return
      }
      Pub.state = content;
      sendBtn.classList.add("btn-disbale");
      return;
    }
    const msg = JSON.parse(content);
    if (msg["type"] === MSG_OTHER_CONTENT) {
      if (sender === id) {
        Bubble.append({
          type: MSG_SELF_CONTENT,
          sender: id,
          text: msg["content"]
        })
      } else {
        Bubble.append({
          type: MSG_OTHER_CONTENT,
          sender: id,
          text: msg["content"]
        })
      }
      return;
    }
    if (msg["type"] === MSG_OTHER_FOCUSIN) {
      if (msg["content"] !== id) {
        Pub.state = STATE_FOCUSIN;
      }
      return;
    }
    if (msg["type"] === MSG_OTHER_FOCUSOUT) {
      if (msg["content"] !== id) {
        Pub.state = STATE_FOCUSOUT;
      }
      return;
    }
  }

  inputBar.addEventListener("input", function () { sendBuf = this.value })
  inputBar.addEventListener("focusin", function () { send(MSG_OTHER_FOCUSIN, id) });
  inputBar.addEventListener("focusout", function () { send(MSG_OTHER_FOCUSOUT, id) });
  inputBar.addEventListener("keypress", evt => {
    if (evt.key === "Enter") {
      sendUser();
    }
  })

  sendBtn.addEventListener("click", sendUser);

  exitBtn.addEventListener("click", function(evt) {
    if (confirm("确定要退出吗？")) {
      socket.close();
      socket = null;
      Pub.state = STATE_CLOSE;
    }
  });

  refreshBtn.addEventListener("click", evt => {
    if (confirm("刷新会失去与对方的连接，确定刷新吗？")) {
      socket.close();
      socket = null;
      document.location.reload();
    }
  })

  function sendUser() {
    if (send(MSG_OTHER_CONTENT, sendBuf)) {
      inputBar.value = "";
      sendBuf = "";
    }
  }

  function send(type, content) {
    if (!socket || Pub.state !== STATE_START) {
      return false;
    }
    if (!content || content.length <= 0) {
      return false;
    }
    if (content.length > MSG_MAX_LEN) {
      alert(`最多一次发送${MSG_MAX_LEN}字哦～`);
      return false;
    }
    socket.send(JSON.stringify({ type, content }));
    return true;
  }

})


