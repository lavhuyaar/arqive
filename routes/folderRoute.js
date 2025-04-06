const { getFolderData, createFolder, addFileToFolder, deleteFolder } = require("../controllers/folderController");
const { userLoggedIn } = require("../utils/userLoggedIn");
const multer  = require('multer');
const folderRoute = require("express").Router();

// Store uploaded files in memory
const storage = multer.memoryStorage();

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

folderRoute.use(userLoggedIn);

folderRoute.get("/:folderId", getFolderData);
folderRoute.post("/:parentId/create", createFolder);
folderRoute.post("/:folderId/add-file", upload.single('file'), addFileToFolder);
folderRoute.get("/:folderId/delete", deleteFolder);

module.exports = folderRoute;
