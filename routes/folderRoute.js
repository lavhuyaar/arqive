const { getFolderData } = require("../controllers/folderController");

const folderRoute = require("express").Router();

folderRoute.get("/:folderId", getFolderData);

module.exports = folderRoute;
