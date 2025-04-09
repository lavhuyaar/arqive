const asyncHandler = require("express-async-handler");
const fs = require("fs/promises");
const path = require("node:path");
const {
  getFolder,
  getNestedFolders,
  createFolder,
  foldersToDelete,
  deleteFolders,
  addFile,
  getFiles,
  getBreadCrumb,
  getFile,
  deleteFileFromFolder,
  deleteFilesFromIds,
  changeFolderName,
} = require("../db/queries");
const { decode } = require("base64-arraybuffer");
const { supabase } = require("../supabase/supabase");
const { v4: uuidv4 } = require("uuid");

exports.getRootFolder = asyncHandler(async (req, res, next) => {
  const folders = await getNestedFolders(req.user.id, null);
  const files = await getFiles(req.user.id, null);

  res.render("folder", {
    title: "Arqive - root",
    user: req.user,
    folders: folders,
    parentFolder: null,
    files: files,
  });
});

exports.getFolderData = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  //If there exists no folderId
  if (!folderId) return res.redirect("/folder"); //Redirects to home page

  //In case there exists a folderId
  const folder = await getFolder(req.user.id, folderId);

  //If folderId is invalid (no folder exists with such id)
  if (!folder) return res.redirect("/folder"); //Redirects to home page

  //If folderId is valid, gets all nested folders of the folder
  const nestedFolders = await getNestedFolders(req.user.id, folderId);
  const files = await getFiles(req.user.id, folderId);

  const breadcrumb = await getBreadCrumb(req.user.id, folder.id, []);

  //Renders the page with same data
  return res.render("folder", {
    title: `Arqive - ${folder.name}`,
    user: req.user,
    folders: nestedFolders,
    parentFolder: folder,
    files: files,
    breadcrumb,
  });
});

exports.createFolder = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;
  const newFolderName = req.body.newFolderName.trim();

  //If there exists no folder with id as parentId
  if (!parentId) return res.redirect("/folder"); //Redirects to home page

  // If creating a folder in root
  if (parentId === "root") {
    await createFolder(newFolderName, req.user.id);
    return res.redirect("/folder"); //Redirects to home page
  }

  //Checks if parentId is valid
  const folder = await getFolder(req.user.id, parentId);

  //If not valid, redirects to home page (might change later -> better error handling)
  if (!folder) return res.redirect("/folder");

  //Else creates a new nested folder
  await createFolder(newFolderName, req.user.id, folder.id);
  return res.redirect(`/folder/${folder.id}`); //Redirects to the same page
});

exports.addFileToFolder = asyncHandler(async (req, res, next) => {
  const { file } = req;
  const { folderId } = req.params;

  if (!folderId) return res.redirect("/folder");

  // decode file buffer to base64
  const fileBase64 = decode(file.buffer.toString("base64"));
  const bucketFileId = uuidv4();

  // upload the file to supabase
  const { data, error } = await supabase.storage
    .from("arqive")
    .upload(`${file.originalname} ${bucketFileId}`, fileBase64, {
      contentType: file.mimetype,
    }); //Ensures that uploading same file doesn't throw an error

  if (error) {
    console.error(error.message);
    throw error;
  }

  // get public url of the uploaded file
  const { data: image } = supabase.storage
    .from("arqive")
    .getPublicUrl(data.path);

  // If creating a folder in root
  if (folderId === "root") {
    await addFile(
      file.originalname,
      file.size,
      file.mimetype,
      image.publicUrl,
      req.user.id,
      bucketFileId
    );
    return res.redirect("/folder"); //Redirects to home page
  }

  await addFile(
    file.originalname,
    file.size,
    file.mimetype,
    image.publicUrl,
    req.user.id,
    bucketFileId,
    folderId
  );

  return res.redirect(`/folder/${folderId}`);
});

exports.deleteFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  if (!folderId) return res.redirect("/folder");

  const folder = await getFolder(req.user.id, folderId);
  const parentId = folder.parentId; //parentId of folder to delete

  const ids = await foldersToDelete(folderId, req.user.id); //ids of all the folders deeply nested inside folder to delete (including id of folder to delete)

  const reversedIds = ids.reverse(); //Ensures that child file or folder is deleted first followed by it's parent folder (if any)
  await deleteFilesFromIds(reversedIds); //Deletes all files and nested files found inside folder recursively
  await deleteFolders(reversedIds); //Deletes folder and nested folders recursively

  if (parentId) {
    //If folder was not in Root folder
    return res.redirect(`/folder/${parentId}`);
  } else {
    return res.redirect("/folder");
  }
});

exports.deleteFile = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;

  if (!fileId) return res.redirect("/folder");

  const file = await getFile(fileId, req.user.id);
  const folderId = file.folderId;

  if (!file) return res.redirect("/folder");

  const { error } = await supabase.storage
    .from("arqive")
    .remove([`${file.name} ${file.bucketFileId}`]);

  if (error) {
    console.error(error.message);
    throw error;
  }

  await deleteFileFromFolder(file.id);

  if (folderId) {
    return res.redirect(`/folder/${folderId}`);
  } else return res.redirect("/folder");
});

exports.renderAddFolderPage = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;

  if (parentId === "root") {
    return res.render("addEditFolder", {
      title: "Arqive - Create folder",
      subTitle: "Create a new folder",
      isEdit: false,
      parentFolder: null,
      user: req.user,
    });
  }

  const parentFolder = await getFolder(req.user.id, parentId);

  if (!parentFolder) return res.redirect("/folder");

  return res.render("addEditFolder", {
    title: "Arqive - Create folder",
    subTitle: "Create a new folder",
    isEdit: false,
    parentFolder,
    user: req.user,
  });
});

exports.renderAddFilePage = asyncHandler(async (req, res, next) => {
  const parentId = req.params.folderId;

  if (parentId === "root") {
    return res.render("addFile", {
      title: "Arqive - Add file",
      subTitle: "Add a new file",
      parentFolder: null,
      user: req.user,
    });
  }

  const folder = await getFolder(req.user.id, parentId);

  if (!folder) return res.redirect("/folder");

  return res.render("addFile", {
    title: "Arqive - Add file",
    subTitle: "Add a new file",
    parentFolder: folder,
    user: req.user,
  });
});

exports.renderEditFolderPage = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  const folder = await getFolder(req.user.id, folderId);

  if (!folder) return res.redirect("/folder");

  return res.render("addEditFolder", {
    title: `Arqive - Edit ${folder.name}`,
    subTitle: "Edit folder name",
    folder: folder,
    isEdit: true,
    user: req.user,
  });
});

exports.editFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;
  const newFolderName = req.body.newFolderName.trim();

  const folder = await getFolder(req.user.id, folderId);

  if (!folder) return res.redirect("/folder");

  await changeFolderName(newFolderName, folder.id, req.user.id);

  return res.redirect(`/folder/${folder.parentId ?? ""}`);
});

  exports.downloadFile = asyncHandler(async (req, res, next) => {
    const { fileId } = req.params;

    const file = await getFile(fileId, req.user.id);
    if (!file) return res.redirect("/folder");

    const { data, error } = await supabase.storage
      .from("arqive")
      .download(`${file.name} ${file.bucketFileId}`);

    if (error) {
      console.error(error.message);
      throw error;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.fileType);
    res.send(buffer);

  });
