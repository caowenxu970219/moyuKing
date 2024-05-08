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
  }
});
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
floatingElement.style.cursor = "pointer";
floatingElement.style.display = "none"; // 初始隐藏
floatingElement.style.zIndex = "999999";
document.body.appendChild(floatingElement);

let handelPage = (e) => {
  if (e.keyCode == 68) {
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
  if (e.keyCode == 65) {
    if (pageNum === 1) {
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
  if (e.ctrlKey && e.keyCode == 77) {
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