let localOptions = [];
let curOption = null;
// 读取IndexedDB中的内容
const loadOptionsFromDb = async () => {
  // 请求 Background 获取 IndexedDB 数据
  chrome.runtime.sendMessage(
    { action: "fetchDataFromIndexedDB" },
    function (response) {
      addOptionsToSelect(response.data);
    }
  );
};

// const getDataByIdFromDb = async (id) => {
//   const db = await openDB();
//   const transaction = db.transaction(["files"], "readonly");
//   const store = transaction.objectStore("files");
//   const request = store.get(id * 1);
//   request.onsuccess = function (event) {
//     console.log("onsuccess", request);
//     if (request.result) {
//       const contents = request.result;
//       chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, {
//           type: "FROM_POPUP",
//           data: contents,
//         });
//       });
//     } else {
//       console.log("No data found with id:", id);
//     }
//   };
//   request.onerror = function () {
//     console.error("Error fetching data:", request.error);
//   };
// };

// 绑定事件到文件选择
document
  .getElementById("fileInput")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      chrome.runtime.sendMessage(
        { action: "saveToDB", data: { content, name: file.name } },
        function (response) {
          loadOptionsFromDb();
        }
      );
      // await saveToDB(content, file.name); // 读取文件内容后保存到DB
    };
    reader.readAsText(file);
  });

// 函数来动态添加选项到下拉选择框
async function addOptionsToSelect(options) {
  localOptions = options;
  const selectElement = document.getElementById("mySelect");
  // 清除所有现有的选项
  selectElement.innerHTML = "";
  chrome.runtime.sendMessage({ action: "getId" }, function (response) {
    let curId = response.data;
    // 循环传入的选项数组并添加到select元素
    options.forEach((option) => {
      const optElement = document.createElement("option");
      optElement.value = option.id;
      optElement.textContent = option.name;
      selectElement.appendChild(optElement);
    });
    if (curId) {
      selectElement.value = curId * 1;
      curOption = localOptions.find((item) => item.id * 1 === curId * 1);
      document.getElementById("myPageNum").value = curOption.pageNum*1;
      document.getElementById("myPageSize").value = curOption.pageSize*1;
      // getDataByIdFromDb(curId);
    }
  });
}
document
  .getElementById("importBtn")
  .addEventListener("click", async function (e) {
    document.getElementById("fileInput").click();
  });
// 添加事件监听，绑定到 select 更改操作
document
  .getElementById("mySelect")
  .addEventListener("change", async function (e) {
    curOption = localOptions.find((item) => item.id*1 === this.value*1);
    document.getElementById("myPageNum").value = curOption.pageNum*1;
    document.getElementById("myPageSize").value = curOption.pageSize*1;
    chrome.runtime.sendMessage(
      { action: "updateId", data: this.value },
      function (response) {
        // chrome.tabs.query(
        //   { active: true, currentWindow: true },
        //   function (tabs) {
        //     chrome.tabs.sendMessage(tabs[0].id, {
        //       type: "FROM_POPUP",
        //       data: response.content,
        //     });
        //   }
        // );
      }
    );
  });
document
  .getElementById("myPageNum")
  .addEventListener("change", async function (e) {
    curOption.pageNum = this.value * 1;
    chrome.runtime.sendMessage(
      {
        action: "updatePage",
        data: {
          id: curOption.id,
          pageNum: this.value * 1,
          pageSize: curOption.pageSize*1,
        },
      },
      function (response) {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            var currentTab = tabs[0];
            if (currentTab) {
              chrome.tabs.sendMessage(
                currentTab.id,
                {
                  action: "FROM_POPUP",
                  data: { id: curOption.id, ...curOption },
                },
                function (response) {
                  console.log(response);
                }
              );
            }
          }
        );
      }
    );
  });
document
  .getElementById("myPageSize")
  .addEventListener("change", async function (e) {
    curOption.pageSize = this.value * 1;
    chrome.runtime.sendMessage(
      {
        action: "updatePage",
        data: {
          id: curOption.id,
          pageNum: curOption.pageNum,
          pageSize: this.value * 1,
        },
      },
      function (response) {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            var currentTab = tabs[0];
            if (currentTab) {
              chrome.tabs.sendMessage(
                currentTab.id,
                {
                  action: "FROM_POPUP",
                  data: { id: curOption.id, ...curOption },
                },
                function (response) {
                  console.log(response);
                }
              );
            }
          }
        );
      }
    );
  });
loadOptionsFromDb();
