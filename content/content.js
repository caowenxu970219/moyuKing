let updateInner=()=>{
  floatingElement.innerText = content.slice(
    pageNum * pageSize,
    (pageNum + 1) * pageSize
  );
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "FROM_POPUP") {
    console.log("Received data from background:", request.data);
    id = request.data.id;
    content = request.data.content;
    pageSize = request.data.pageSize || 20;
    pageNum = request.data.pageNum || 0;
    updateInner();
  } else if (request.action === "UPDATE_STYLE") {
    applyStyles(request.data);
  }
});

const applyStyles = (styles) => {
  if (!styles) return;
  if (styles.bgColor) {
    const r = parseInt(styles.bgColor.slice(1, 3), 16) || 0;
    const g = parseInt(styles.bgColor.slice(3, 5), 16) || 0;
    const b = parseInt(styles.bgColor.slice(5, 7), 16) || 0;
    const a = styles.bgOpacity !== undefined ? styles.bgOpacity : 0.1;
    floatingElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  if (styles.textColor) {
    const r = parseInt(styles.textColor.slice(1, 3), 16) || 255;
    const g = parseInt(styles.textColor.slice(3, 5), 16) || 255;
    const b = parseInt(styles.textColor.slice(5, 7), 16) || 255;
    const a = styles.textOpacity !== undefined ? styles.textOpacity : 1;
    floatingElement.style.color = `rgba(${r}, ${g}, ${b}, ${a})`;
  }
};
let id = null;
let pageNum = 0;
let pageSize = 20;
let content = "";

// 创建浮动元素
const floatingElement = document.createElement("div");
floatingElement.id = "moyuKingDom";
floatingElement.style.position = "fixed";
floatingElement.style.bottom = "10px";
floatingElement.style.left = "10px";
floatingElement.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
floatingElement.style.color = "white";
floatingElement.style.padding = "5px";
floatingElement.style.borderRadius = "5px";
floatingElement.style.cursor = "move"; // Changed from pointer to move
floatingElement.style.display = "none"; // 初始隐藏
floatingElement.style.zIndex = "999999";
document.body.appendChild(floatingElement);

// Load styles from storage
chrome.storage.local.get(['moyuStyles'], function(result) {
  if (result.moyuStyles) {
    applyStyles(result.moyuStyles);
  }
});

// 拖动逻辑
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

floatingElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - floatingElement.getBoundingClientRect().left;
  offsetY = e.clientY - floatingElement.getBoundingClientRect().top;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    floatingElement.style.left = `${e.clientX - offsetX}px`;
    floatingElement.style.top = `${e.clientY - offsetY}px`;
    floatingElement.style.bottom = 'auto';
    floatingElement.style.right = 'auto';
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

let handelPage = (e) => {
  const key = e.key ? e.key.toLowerCase() : '';
  if (key === 'd' || e.keyCode == 68) {
    //下一页
    if((content.length/pageSize)<=pageNum){
      return
    }
    pageNum++;
    chrome.runtime.sendMessage(
      { action: "updatePage", data: {id,pageNum,pageSize} },
      function (response) {
      }
    );
    updateInner();
  }
  if (key === 'a' || e.keyCode == 65) {
    if (pageNum === 0) {
      return;
    }
    pageNum--;
    chrome.runtime.sendMessage(
      { action: "updatePage", data: {id,pageNum,pageSize} },
      function (response) {
      }
    );
    updateInner();
    //上一页
  }
};
// 触发
document.addEventListener("keydown", function (e) {
  const key = e.key ? e.key.toLowerCase() : '';
  if ((e.ctrlKey || e.metaKey) && (key === 'm' || e.keyCode == 77)) {
    // let dom = document.getElementById('moyuKingDom')
    if (floatingElement.style.display === "none") {
      floatingElement.style.display = "block";
      document.addEventListener("keydown",handelPage)
    } else {
      floatingElement.style.display = "none";
      document.removeEventListener("keydown",handelPage)
    }
  }
});

chrome.runtime.sendMessage(
  { action: "initPage" },
  function (response) {
  }
);