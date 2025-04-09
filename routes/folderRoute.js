const {
  getFolderData,
  createFolder,
  addFileToFolder,
  deleteFolder,
  getRootFolder,
  deleteFile,
  renderAddFolderPage,
  renderAddFilePage,
  renderEditFolderPage,
  editFolder,
  downloadFile,
} = require("../controllers/folderController");
const { userLoggedIn } = require("../utils/userLoggedIn");
const multer = require("multer");
const folderRoute = require("express").Router();

// Store uploaded files in memory
const storage = multer.memoryStorage();

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

folderRoute.use(userLoggedIn);

folderRoute.get("/", getRootFolder);
folderRoute.get("/:folderId", getFolderData);
folderRoute.get("/:parentId/create", renderAddFolderPage);
folderRoute.post("/:parentId/create", createFolder);
folderRoute.get("/:folderId/edit", renderEditFolderPage);
folderRoute.post("/:folderId/edit", editFolder);
folderRoute.get("/:folderId/delete", deleteFolder);

folderRoute.get("/:folderId/add-file", renderAddFilePage);
folderRoute.post("/:folderId/add-file", upload.single("file"), addFileToFolder);
folderRoute.get("/:fileId/delete-file", deleteFile);
folderRoute.get("/:fileId/download", downloadFile);

module.exports = folderRoute;
