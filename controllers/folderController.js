const { prisma } = require("../lib/prisma");

exports.getFolderData = async (req, res) => {
  const { folderId } = req.params;

  //If User is not logged in
  if (!req.user) res.redirect("/login");

  //If there exists no folderId
  if (!folderId) res.redirect("/"); //Redirects to home page

  //In case there exists a folderId
  const folder = await prisma.folder.findFirst({
    //Gets folder with folderId as id
    where: {
      userId: req.user.id,
      id: folderId,
    },
  });

  //If folderId is invalid (no folder exists with such id)
  if (!folder) res.redirect("/"); //Redirects to home page

  //If folderId is valid, gets all nested folders of the folder
  const nestedFolder = await prisma.folder.findMany({
    where: {
      userId: req.user.id,
      parentId: folderId,
    },
  });

  return res.render("index", {
    user: req.user,
    folders: nestedFolder,
    parentName: folder.name,
  });
};

// exports.createFolder = async (req, res) => {
//   const { folderId } = req.params;
//   const { folderName } = req.body;

//   //Later -> not req.user logic

//   if (!folderId) {
//     await prisma.folder.create({
//       data: {
//         name: folderName,
//         userId: req.user.id,
//         parentId: null,
//       },
//     });
//     const rootFolders = await prisma.folder.findMany({
//       where: {
//         parentId: null,
//         userId: req.user.id,
//       },
//     });
//     return res.redirect("/", { user: req.user, folders: rootFolders });
//   }

//   const folderData = await prisma.folder.findFirst({
//     where: {
//       id: folderId,
//     },
//   });

//   if (!folderData) {
//     const rootFolders = await prisma.folder.findMany({
//       where: {
//         parentId: null,
//         userId: req.user.id,
//       },
//     });
//     return res.redirect("/", { user: req.user, folders: rootFolders });
//   }

//   await prisma.folder.create({
//     data: {
//       userId: req.user.id,
//       parentId: folderData.id,
//       name: folderName,
//     },
//   });
//   const folders = await prisma.folder.findMany({
//     where: {
//         userId: req.user.id,
//         parentId: folderId
//     }
//   })
//   return res.render("index", {user: req.user, folders: folders});
// };
