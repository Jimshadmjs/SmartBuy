const multer = require("multer");
const path = require("path");
// const crypto = reqire('cryp')

function generateRandomFilename(originalname) {
    const ext = path.extname(originalname);
    return `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`; // Generates a timestamp + random number
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null,generateRandomFilename(file.originalname)); 
    },
});

const upload = multer({ storage: storage ,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/; 
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: Only images are allowed!");
    },
});

module.exports =upload;