const { prisma } = require("../lib/prisma");
const { supabase } = require("../supabase/supabase");

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
  bucketFileId,
  folderId = null
) => {
  await prisma.file.create({
    data: { name, size, fileType, url, userId, folderId, bucketFileId },
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

exports.getFile = async (id, userId) => {
  const file = await prisma.file.findUnique({
    where: {
      id,
      userId,
    },
  });
  return file;
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

exports.changeFolderName = async (name, folderId, userId) => {
  await prisma.folder.update({
    where: {
      id: folderId,
      userId,
    },
    data: {
      name,
    },
  });
};

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

exports.deleteFolders = async (ids) => {
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

exports.deleteFileFromFolder = async (id) => {
  await prisma.file.delete({
    where: {
      id,
    },
  });
};

exports.deleteFilesFromIds = async (ids) => {
  //Gets all the files to be deleted
  const filesFromAllFolders = await Promise.all(
    ids.map((id) =>
      prisma.file.findMany({
        where: {
          folderId: id,
        },
      })
    )
  );

  //Gets all the bucket file names and firstly removes all files from Supabase bucket
  const filePathsToDelete = filesFromAllFolders
    .flat()
    .map((file) => `${file.name} ${file.bucketFileId}`); //Array of file names which is to be deleted from supabase as well

  if (filePathsToDelete.length > 0) {
    const { error } = await supabase.storage
      .from("arqive")
      .remove(filePathsToDelete);

    if (error) {
      console.error(error.message);
      throw error;
    }
  }

  //Finally removes all the files with folderId as any id of ids[]
  await Promise.all(
    ids.map((id) =>
      prisma.file.deleteMany({
        where: {
          folderId: id,
        },
      })
    )
  );
};
