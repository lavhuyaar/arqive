const { prisma } = require("../lib/prisma");

// ------------CREATE QUERIES---------------

exports.createUser = async (username, firstName, lastName, password) => {
  await prisma.user.create({
    data: {
      username,
      firstName,
      lastName,
      password,
    },
  });
};

exports.createFolder = async (name, userId, parentId = null) => {
  await prisma.folder.create({
    data: {
      name,
      userId,
      parentId,
    },
  });
};

exports.addFile = async (
  name,
  size,
  fileType,
  url,
  userId,
  folderId = null
) => {
  await prisma.file.create({
    data: { name, size, fileType, url, userId, folderId },
  });
};

// ------------READ QUERIES---------------

exports.getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};

exports.getUserByUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });
  return user;
};

exports.getFolder = async (userId, folderId) => {
  const data = await prisma.folder.findFirst({
    where: {
      userId,
      id: folderId,
    },
  });
  return data;
};

exports.getNestedFolders = async (userId, parentId) => {
  const data = await prisma.folder.findMany({
    where: {
      userId,
      parentId,
    },
  });
  return data;
};

exports.getFiles = async (userId, folderId) => {
  const data = await prisma.file.findMany({
    where: {
      userId,
      folderId,
    },
  });
  return data;
};

exports.getBreadCrumb = async function getBreadCrumb(
  userId,
  folderId,
  arr = []
) {
  const data = await prisma.folder.findFirst({
    where: {
      userId,
      id: folderId,
    },
  });
  if (!data.parentId) {
    arr.push(data);
    return arr;
  } else {
    arr.push(data);
    return await getBreadCrumb(data.userId, data.parentId, arr); //Recursion
  }
};

// ------------UPDATE QUERIES---------------

// ------------DELETE QUERIES---------------

//Returns an array of the folder to delete as well as all of it's deeply nested folders
exports.foldersToDelete = async function deleteFolder(
  id,
  userId,
  idsToDelete = []
) {
  idsToDelete.push(id);

  //Gets all children folders
  const folders = await prisma.folder.findMany({
    where: {
      parentId: id,
      userId,
    },
  });

  //Recursively looks for the children and pushes their id
  await Promise.all(
    folders.map((folder) => deleteFolder(folder.id, userId, idsToDelete)) //Recursion
  );

  return idsToDelete; //Array of ids
};

exports.deleteFolders = async (folderIds) => {
  const ids = folderIds.reverse(); //Makes sure that child folder is deleted first

  //Deletes all the folders with id from ids array
  await Promise.all(
    ids.map((id) =>
      prisma.folder.deleteMany({
        where: {
          id,
        },
      })
    )
  );
};
