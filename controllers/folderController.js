const asyncHandler = require("express-async-handler");
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
} = require("../db/queries");
const { decode } = require("base64-arraybuffer");
const { supabase } = require("../supabase/supabase");
const { v4: uuidv4 } = require("uuid");

exports.getRootFolder = asyncHandler(async (req, res, next) => {
  const folders = await getNestedFolders(req.user.id, null);
  const files = await getFiles(req.user.id, null);

  res.render("folder", {
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
    user: req.user,
    folders: nestedFolders,
    parentFolder: folder,
    files: files,
    breadcrumb,
  });
});

exports.createFolder = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;
  const { newFolderName } = req.body;

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
