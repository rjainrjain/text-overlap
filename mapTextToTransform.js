const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const folderPath = './public/mermaidsvg';


const parser = new xml2js.Parser();

// Function to traverse through each file in the folder
fs.readdir(folderPath, (err, files) => {
    if (err) {
        return console.error('Unable to scan directory: ' + err);
    }

    files.forEach(file => {
        if (path.extname(file) === '.svg') {
            fs.readFile(path.join(folderPath, file), 'utf8', (err, data) => {
                if (err) {
                    return console.error('Unable to read file: ' + err);
                }

                parser.parseString(data, (err, result) => {
                    if (err) {
                        return console.error('Unable to parse SVG file: ' + err);
                    }

                    const elementToTransformGMap = new Map();

                    // Traverse SVG elements to find <text>, <p>, or <span> elements and map them to the farthest ancestor <g> with a transform attribute
                    traverseSvg(result, elementToTransformGMap);

                    console.log(`Element to farthest ancestor <g> with transform map for ${file}:`, Array.from(elementToTransformGMap.entries()));
                });
            });
        }
    });
});

// Helper function to traverse the SVG elements recursively
function traverseSvg(element, elementToTransformGMap, currentGWithTransform = null) {
    if (element.g) {
        element.g.forEach(g => {
            const gHasTransform = g.$ && g.$.transform;
            const currentFarthestG = gHasTransform ? g : currentGWithTransform;
            traverseSvg(g, elementToTransformGMap, currentFarthestG);  // Continue traversing the rest of the SVG
        });
    }

    if (currentGWithTransform) {
        findTextElements(element, elementToTransformGMap, currentGWithTransform);
    }

    if (typeof element === 'object') {
        for (let key in element) {
            if (element.hasOwnProperty(key) && key !== 'g') {
                traverseSvg(element[key], elementToTransformGMap, currentGWithTransform);
            }
        }
    }
}

// Function to find <text>, <p>, and <span> elements within a given element
function findTextElements(element, elementToTransformGMap, currentGWithTransform) {
    if (element.text || element.p || element.span) {
        const textElements = [].concat(element.text || [], element.p || [], element.span || []);

        textElements.forEach(t => {
            elementToTransformGMap.set(t, currentGWithTransform);
            console.log(`Mapping element:`, t, `to farthest ancestor <g> with transform:`, currentGWithTransform);
        });
    }

    if (typeof element === 'object') {
        for (let key in element) {
            if (element.hasOwnProperty(key) && ['text', 'p', 'span'].includes(key)) {
                findTextElements(element[key], elementToTransformGMap, currentGWithTransform);
            }
        }
    }
}
