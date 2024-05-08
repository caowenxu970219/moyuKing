const IDBUtil = {
  dbName: "myDatabase",
  storeName: "idStore",
  version: 1, // 可以根据需要更新数据库结构时增加版本号

  // 打开（或初始化）数据库
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error("Database error:", event.target.errorCode);
        reject(event.target.errorCode);
      };

      // 第一次创建数据库或版本更新时触发
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // 创建一个新的存储对象
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: false,
          });
        }
      };

      request.onsuccess = (event) => {
        console.log("Database opened successfully");
        resolve(event.target.result);
      };
    });
  },

  // 设置ID值
  async setId(id) {
    const db = await this.openDB();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    const request = store.put({ id: "unique", value: id });

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log("ID stored successfully");
        resolve();
      };
      request.onerror = (event) => {
        console.error("Error storing the ID:", event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  },

  // 获取ID值
  async getId() {
    const db = await this.openDB();
    const transaction = db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    const request = store.get("unique");

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          console.log("ID retrieved successfully:", request.result.value);
          resolve(request.result.value);
        } else {
          console.log("ID not found");
          resolve(null);
        }
      };
      request.onerror = (event) => {
        console.error("Error retrieving the ID:", event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  },

  // 更新ID值
  async updateId(newId) {
    // 此处的更新操作实际上与setId方法相同，因为put方法会替换已有记录或新增一条记录
    return this.setId(newId);
  },
};

// 打开（或创建）数据库
const openDB = () => {
  return new Promise((resolve, reject) => {
    // 增加版本号以触发onupgradeneeded事件
    const request = indexedDB.open("FileDB", 1);
    request.onupgradeneeded = function (event) {
      let db = event.target.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
      }
      // 确保所有记录都有pageNum和pageSize字段
      const store = transaction.objectStore("files");
      store.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          var updateData = cursor.value;
          updateData.pageNum = updateData.pageNum || 0; // 默认值
          updateData.pageSize = updateData.pageSize || 0; // 默认值
          cursor.update(updateData);
          cursor.continue();
        }
      };
    };
    request.onerror = function (event) {
      console.error("Database error: ", event.target.errorCode);
      reject(event.target.errorCode);
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
  });
};
const updatePageInfo = async (id, pageNum, pageSize) => {
  const db = await openDB();
  const transaction = db.transaction(["files"], "readwrite");
  const store = transaction.objectStore("files");
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        data.pageNum = pageNum;
        data.pageSize = pageSize;
        const updateRequest = store.put(data);
        updateRequest.onsuccess = () => {
          console.log("Page info updated successfully");
          resolve();
        };
        updateRequest.onerror = (event) => {
          console.error("Error updating page info:", event.target.errorCode);
          reject(event.target.errorCode);
        };
      } else {
        console.log("No data found with id:", id);
        reject("No data found");
      }
    };
    request.onerror = (event) => {
      console.error("Error fetching data to update:", event.target.errorCode);
      reject(event.target.errorCode);
    };
  });
};

// 保存文件内容到IndexedDB
const saveToDB = async (content, name) => {
  const db = await openDB();
  const transaction = db.transaction(["files"], "readwrite");
  const store = transaction.objectStore("files");
  const request = store.add({
    content: content,
    name: name,
    pageNum: 0,
    pageSize: 20,
  });
  request.onsuccess = () => console.log("File content saved to DB");
  request.onerror = () => console.error("Error saving file content to DB");
};

const initData = async (id) => {
  const db = await openDB();
  const transaction = db.transaction(["files"], "readonly");
  const store = transaction.objectStore("files");
  const request = store.get(id * 1);
  request.onsuccess = function (event) {
    console.log("onsuccess", request);
    if (request.result) {
      const contents = request.result;
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var currentTab = tabs[0];
        if (currentTab) {
          chrome.tabs.sendMessage(
            currentTab.id,
            { action: "FROM_POPUP", data: { id, ...contents } },
            function (response) {
              console.log(response.status);
            }
          );
        }
      });
    } else {
      console.log("No data found with id:", id);
    }
  };
  request.onerror = function () {
    console.error("Error fetching data:", request.error);
  };
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "fetchDataFromIndexedDB") {
    openDB().then((db) => {
      const transaction = db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const request = store.getAll();
      request.onerror = function (event) {
        sendResponse({ status: "error", data: event.target.errorCode });
      };
      request.onsuccess = function (event) {
        const result = event.target.result;
        console.log("fetchDataFromIndexedDB", event);
        sendResponse({ status: "success", data: result });
      };
    });
  }
  if (request.action === "saveToDB") {
    console.log("saveToDB", request);
    saveToDB(request.data.content, request.data.name).then(() => {
      sendResponse({ status: "success" });
    });
  }
  if (request.action === "getId") {
    IDBUtil.getId().then((id) => {
      sendResponse({ status: "success", data: id });
    });
  }
  if (request.action === "updateId") {
    IDBUtil.updateId(request.data).then(() => {
      initData(request.data).then(() => {
        sendResponse({ status: "success" });
      });
    });
  }
  if (request.action === "updatePage") {
    updatePageInfo(
      request.data.id,
      request.data.pageNum,
      request.data.pageSize
    ).then(() => {
      sendResponse({ status: "success" });
    });
  }
  if (request.action === "initPage") {
    IDBUtil.getId().then((id) => {
      initData(id).then(() => {
        sendResponse({ status: "success" });
      });
    });
  }
  return true; // 异步响应
});
