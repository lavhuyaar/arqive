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

  //Renders the page with same data
  return res.render("index", {
    user: req.user,
    folders: nestedFolder,
    parentFolder: folder,
  });
};

exports.createFolder = async (req, res) => {
  const { parentId } = req.params;
  const { newFolderName } = req.body;

  //If User is not logged in
  if (!req.user) res.redirect("/login");

  //If there exists no folder with id as parentId
  if (!parentId) res.redirect("/"); //Redirects to home page

  // If creating a folder in root
  if (parentId === "root") {
    await prisma.folder.create({
      data: {
        name: newFolderName,
        parentId: null,
        userId: req.user.id,
      },
    });
    return res.redirect("/"); //Redirects to home page
  }

  //Checks if parentId is valid
  const folder = await prisma.folder.findFirst({
    //Gets folder with id as parentId
    where: {
      userId: req.user.id,
      id: parentId,
    },
  });

  //If not valid, redirects to home page (might change later -> better error handling)
  if (!folder) res.redirect("/");

  //Else creates a new nested folder
  await prisma.folder.create({
    data: {
      name: newFolderName,
      parentId: folder.id,
      userId: req.user.id,
    },
  });
  return res.redirect(`/folder/${folder.id}`); //Redirects to the same page
};
