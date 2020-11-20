window.addEventListener("DOMContentLoaded", event => {

  const 来自系统的消息 = 10;
  const 来自对方的消息 = 20;
  const 对方正在输入 = 21;
  const 对方停止输入 = 22;
  const 来自自己的消息 = 30;

  const 消息最大长度 = 800;

  const 匹配状态 = "HALT";
  const 匹配成功状态 = "START";
  const 连接断开状态 = "CLOSE";
  const 对方连接断开状态 = "LOSE";

  const 对方正在输入状态 = "focusin";
  const 对方停止输入状态 = "focusout";

  const 真 = 0 === 0;
  const 假 = 0 !== 0;

  const 发送按钮 = document.getElementById("send-btn");
  const 退出按钮 = document.getElementById("exit-btn");
  const 刷新按钮 = document.getElementById("refresh-btn");
  const 输入框 = document.getElementById("input");
  const 状态栏 = document.getElementById("state");

  const 气泡 = {
    文件对象模型: null,
    当前显示的气泡: [],
    历史气泡: [],
    气泡最大显示个数: 10,

    绑定标签(标签ID) {
      this.文件对象模型 = document.getElementById(标签ID);
    },

    用户消息气泡(发送的人, 接收的人, 内容) {
      return `<div class="bb-id">${发送的人}</div><div class="bb-text">${内容}</div>`;
    },

    系统消息气泡(内容) {
      return `<div class="bb-text">${内容}</div>`;
    },

    添加({ 类型, 发送的人, 接收的人, 内容 }) {
      this.保存(arguments[0]);
      this.拆分();

      let 气泡标签 = document.createElement("div");
      if (类型 === 来自系统的消息) {
        气泡标签.classList.add("bb-sys");
        气泡标签.innerHTML = this.系统消息气泡(内容);
      } else {
        气泡标签.classList.add("bb");
        if (类型 === 来自自己的消息) {
          气泡标签.classList.add("bb-right");
        } else {
          气泡标签.classList.add("bb-left");
        }
        气泡标签.innerHTML = this.用户消息气泡(发送的人, 接收的人, 内容);
      }

      const 滚动距离 = this.文件对象模型.scrollTop > this.文件对象模型.scrollHeight - this.文件对象模型.clientHeight - 1;
      this.文件对象模型.appendChild(气泡标签);
      if (滚动距离) {
        this.文件对象模型.scrollTop = this.文件对象模型.scrollHeight - this.文件对象模型.clientHeight;
      }
    },

    保存(消息) {
      this.当前显示的气泡.push(消息);
    },

    拆分() {
      if (this.当前显示的气泡.length >= this.气泡最大显示个数) {
        this.历史气泡.保存(this.当前显示的气泡);
        this.当前显示的气泡 = [];
        while (this.文件对象模型.hasChildNodes()) {
          this.文件对象模型.removeChild(this.文件对象模型.lastChild);
        }
        console.log(this.历史气泡)
      }
    },

    计时() {
      setInterval(() => {
        const 时间 = new Date();
        const 消息 = {
          类型: 来自系统的消息,
          内容: `${时间.getHours()}:${时间.getMinutes()}`
        }
        this.添加(消息);
      }, 1000 * 60 * 30);
    },
  }

  气泡.绑定标签("bb-main");
  气泡.计时();

  const 网页 = {
    o: 连接断开状态,
    get 状态() {
      return this.o;
    },

    /**
     * @param {string} 值
     */
    set 状态(值) {
      this.o = 值;
      switch (值) {
        case 匹配状态: {
          状态栏.innerText = "匹配中";
          气泡.添加({
            类型: 来自系统的消息,
            内容: "匹配中，请等待"
          });
          return;
        }
        case 匹配成功状态: {
          状态栏.innerText = "连接稳定";
          气泡.添加({
            类型: 来自系统的消息,
            内容: "匹配成功，开始聊天吧"
          });
          return;
        }
        case 连接断开状态: {
          状态栏.innerText = "无连接";
          气泡.添加({
            类型: 来自系统的消息,
            内容: "您已断开连接",
          });
          return;
        }
        case 对方连接断开状态: {
          状态栏.innerText = "无连接";
          气泡.添加({
            类型: 来自系统的消息,
            内容: "对方已断线，请重新匹配"
          })
          return;
        }
        case 对方正在输入状态: {
          状态栏.innerText = "对方正在输入";
          return;
        }
        case 对方停止输入状态: {
          状态栏.innerText = "连接稳定";
          return;
        }
        default: {
          状态栏.innerText = "无连接";
        }
      }
    },
  }



  let 要发送的消息 = "";
  let 用户名 = new URLSearchParams(document.location.search).get("id");

  let 连接 = new WebSocket(`ws://${document.location.host}/ws?id=${用户名}`);

  if (连接.readyState === 3) {
    alert("服务器走丢啦～");
    return;
  }

  连接.onopen = 事件 => {
    状态栏.innerText = "连接稳定";
  }

  连接.onclose = 事件 => {
    网页.状态 = 连接断开状态;
  }

  连接.onmessage = 事件 => {
    const 接收到的数据 = JSON.parse(事件.data);
    const 内容 = 接收到的数据["Content"];
    const 类型 = 接收到的数据["Type"];
    const 发送的人 = 接收到的数据["Sender"];

    if (类型 === 来自系统的消息) {
      if (内容 === 匹配成功状态) {
        网页.状态 = 匹配成功状态;
        发送按钮.classList.remove("btn-disable");
        return
      }
      网页.状态 = 内容;
      发送按钮.classList.add("btn-disbale");
      return;
    }
    const 消息 = JSON.parse(内容);
    if (消息["类型"] === 来自对方的消息) {
      if (发送的人 === 用户名) {
        气泡.添加({
          类型: 来自自己的消息,
          发送的人: 用户名,
          内容: 消息["内容"]
        })
      } else {
        气泡.添加({
          类型: 来自对方的消息,
          发送的人: 用户名,
          内容: 消息["内容"]
        })
      }
      return;
    }
    if (消息["类型"] === 对方正在输入) {
      if (消息["内容"] !== 用户名) {
        网页.状态 = 对方正在输入状态;
      }
      return;
    }
    if (消息["类型"] === 对方停止输入) {
      if (消息["内容"] !== 用户名) {
        网页.状态 = 对方停止输入状态;
      }
      return;
    }
  }

  输入框.addEventListener("input", function () { 要发送的消息 = this.value })
  输入框.addEventListener("focusin", function () { 发送(对方正在输入, 用户名) });
  输入框.addEventListener("focusout", function () { 发送(对方停止输入, 用户名) });
  输入框.addEventListener("keypress", evt => {
    if (evt.key === "Enter") {
      发送用户消息();
    }
  })

  发送按钮.addEventListener("click", 发送用户消息);

  退出按钮.addEventListener("click", function(evt) {
    if (confirm("确定要退出吗？")) {
      连接.close();
      连接 = null;
      网页.状态 = 连接断开状态;
    }
  });

  刷新按钮.addEventListener("click", evt => {
    if (confirm("刷新会失去与对方的连接，确定刷新吗？")) {
      连接.close();
      连接 = null;
      document.location.reload();
    }
  })

  function 发送用户消息() {
    if (发送(来自对方的消息, 要发送的消息)) {
      输入框.value = "";
      要发送的消息 = "";
    }
  }

  function 发送(类型, 内容) {
    if (!连接 || 网页.状态 !== 匹配成功状态) {
      return 假;
    }
    if (!内容 || 内容.length <= 0) {
      return 假;
    }
    if (内容.length > 消息最大长度) {
      alert(`最多一次发送${消息最大长度}字哦～`);
      return 假;
    }
    连接.send(JSON.stringify({ 类型, 内容 }));
    return 真;
  }

})


