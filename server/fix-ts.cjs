const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'modules');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/req\.params\.id/g, '(req.params.id as string)')
    .replace(/req\.params\.conversationId/g, '(req.params.conversationId as string)')
    .replace(/req\.params\.postId/g, '(req.params.postId as string)');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

traverse(directoryPath);
