window.addEventListener("DOMContentLoaded", evt => {

  const status = document.getElementById("cover-status");
  
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/status");
  xhr.onreadystatechange = function () {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      const r = JSON.parse(this.response);
      status.innerHTML = unsafeState(r);

    }
  }
  xhr.send();

  function unsafeState(r) {
    return `<div><div class="cover-status-item">在线人数：${r.ClientCount}</div><div class="cover-status-item">匹配对数：${r.RoomCount}</div></div>`
  }
})