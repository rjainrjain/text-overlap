const fs = require('fs');
const path = require('path');

const masterFolder = './d3charts';
const outputFolder = './public/svgs';

// Ensure the output folder exists
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

fs.readdir(masterFolder, (err, folders) => {
    if (err) {
        console.error(`Unable to read master folder: ${err.message}`);
        return;
    }

    folders.forEach(folder => {
        const folderPath = path.join(masterFolder, folder);
        const txtFilePath = path.join(folderPath, 'svg.txt'); // Change 'file.txt' if your .txt files have different names

        if (fs.existsSync(txtFilePath)) {
            fs.readFile(txtFilePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Unable to read file ${txtFilePath}: ${err.message}`);
                    return;
                }

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format date and time
                const svgFileName = `${timestamp}-${folder}.svg`;
                const svgFilePath = path.join(outputFolder, svgFileName);

                const str = data.replace("<svg", "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink= \"http://www.w3.org/1999/xlink\"")

                fs.writeFile(svgFilePath, str, err => {
                    if (err) {
                        console.error(`Unable to write file ${svgFilePath}: ${err.message}`);
                        return;
                    }

                    console.log(`Created ${svgFilePath}`);
                });
            });
        } else {
            console.log(`No .txt file found in ${folderPath}`);
        }
    });
});
