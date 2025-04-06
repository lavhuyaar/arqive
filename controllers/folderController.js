const asyncHandler = require("express-async-handler");
const {
  getFolder,
  getNestedFolders,
  createFolder,
  foldersToDelete,
  deleteFolders,
} = require("../db/queries");
const e = require("express");

exports.getFolderData = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  //If there exists no folderId
  if (!folderId) return res.redirect("/"); //Redirects to home page

  //In case there exists a folderId
  const folder = await getFolder(req.user.id, folderId);

  //If folderId is invalid (no folder exists with such id)
  if (!folder) return res.redirect("/"); //Redirects to home page

  //If folderId is valid, gets all nested folders of the folder
  const nestedFolders = await getNestedFolders(req.user.id, folderId);

  //Renders the page with same data
  return res.render("index", {
    user: req.user,
    folders: nestedFolders,
    parentFolder: folder,
  });
});

exports.createFolder = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;
  const { newFolderName } = req.body;

  //If there exists no folder with id as parentId
  if (!parentId) return res.redirect("/"); //Redirects to home page

  // If creating a folder in root
  if (parentId === "root") {
    await createFolder(newFolderName, req.user.id);
    return res.redirect("/"); //Redirects to home page
  }

  //Checks if parentId is valid
  const folder = await getFolder(req.user.id, parentId);

  //If not valid, redirects to home page (might change later -> better error handling)
  if (!folder) return res.redirect("/");

  //Else creates a new nested folder
  await createFolder(newFolderName, req.user.id, folder.id);
  return res.redirect(`/folder/${folder.id}`); //Redirects to the same page
});

exports.addFileToFolder = asyncHandler(async (req, res, next) => {
  const { file } = req;

  return res.redirect("/");
});

exports.deleteFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  if (!folderId) return res.redirect("/");

  const folder = await getFolder(req.user.id, folderId);
  const parentId = folder.parentId; //parentId of folder to delete

  const ids = await foldersToDelete(folderId, req.user.id); //ids of all the folders deeply nested inside folder to delete (including id of folder to delete)
  await deleteFolders(ids); //Deletes folder and nested folders recursively

  if (parentId) {
    //If folder was not in Root folder
    return res.redirect(`/folder/${parentId}`);
  } else {
    return res.redirect("/");
  }
});
