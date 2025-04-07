const fs = require('fs');
const path = require('path');

// Function to delete a file
async function deleteFile(filePath) {
  try {
    // Use fs.promises.unlink for cleaner async handling
    await fs.promises.unlink(filePath);
    console.log(`Image deleted: ${filePath}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File not found (this might happen if it was already deleted)
      console.warn(`Image not found: ${filePath}`);
    } else {
      console.error(`Error deleting image: ${filePath}`, err);
      // Handle error gracefully (e.g., log it, but don't crash)
    }
  }
}

async function deleteFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`File deleted: ${filePath}`);
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err);
    throw err; // Re-throw the error to be handled elsewhere
  }
}

function constructFilePath(fileUrl) {
  console.log(fileUrl);
  let filePath; // Declare filePath outside the if block

  // Construct the full file path
  filePath = new URL(fileUrl).pathname; // Extract the pathname
  filePath = path.join(__dirname, '../', filePath); // Still join with __dirname to be safe

  console.log(filePath); // Keep this for debugging!
  return filePath;
}

// Function to generate a unique filename
function generateUniqueFilename(originalFilename) {
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `<span class="math-inline">\{name\}\-</span>{uniqueSuffix}${ext}`;
}

module.exports = {
  deleteFile,
  deleteFileIfExists,
  constructFilePath,
  generateUniqueFilename,
};
