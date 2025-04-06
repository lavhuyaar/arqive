const { getFolderData, createFolder } = require("../controllers/folderController");

const folderRoute = require("express").Router();

folderRoute.get("/:folderId", getFolderData);
folderRoute.post("/:parentId/create", createFolder);

module.exports = folderRoute;
