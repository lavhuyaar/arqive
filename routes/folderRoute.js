const { getFolderData, createFolder, addFileToFolder, deleteFolder } = require("../controllers/folderController");
const { userLoggedIn } = require("../utils/userLoggedIn");
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const folderRoute = require("express").Router();

folderRoute.use(userLoggedIn);

folderRoute.get("/:folderId", getFolderData);
folderRoute.post("/:parentId/create", createFolder);
folderRoute.post("/:parentId/add-file", upload.single('newFile'), addFileToFolder);
folderRoute.get("/:folderId/delete", deleteFolder);

module.exports = folderRoute;
