const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourceDirectory = '/Users/rijuljain/Documents/Code/text-overlap/mmd'; // Directory with .mermaid files
const outputDirectory = '/Users/rijuljain/Documents/Code/text-overlap/public/mermaidsvg'; // Directory to save .svg files
const errorLog = path.join(__dirname, 'errors.log');
const processedLog = path.join(__dirname, 'processed.log');

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Initialize log files
fs.writeFileSync(errorLog, '');
fs.writeFileSync(processedLog, '');

fs.readdir(sourceDirectory, (err, files) => {
  if (err) {
    fs.appendFileSync(errorLog, `Error reading input directory: ${err}\n`);
    return console.error('Unable to scan directory:', err);
  }

  const mmdFiles = files.filter(file => path.extname(file) === '.mmd');

  function convertFile(index) {
    if (index >= mmdFiles.length) {
      console.log('All files processed.');
      return;
    }

    const file = mmdFiles[index];
    const filePath = path.join(sourceDirectory, file);
    const outputFilePath = path.join(outputDirectory, file.replace('.mmd', '.svg'));

    const command = `mmdc -i "${filePath}" -o "${outputFilePath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        fs.appendFileSync(errorLog, `Error converting file ${filePath}: ${error}\n`);
        console.error(`Error converting file ${filePath}:`, error);
      } else {
        fs.appendFileSync(processedLog, `Converted ${filePath} to ${outputFilePath}\n`);
        console.log(`Converted ${filePath} to ${outputFilePath}`);
      }
      convertFile(index + 1); // Ensure this is called regardless of error
    });
  }

  convertFile(0);
});
