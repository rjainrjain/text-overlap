const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const folderPath = './public/mermaidsvg';  // Path to your folder containing SVGs

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

                    const elementToGMap = new Map();

                    // Traverse SVG elements to find <g> elements with the appropriate classes
                    traverseSvg(result, elementToGMap);

                    console.log(`Element to <g> Map for ${file}:`, Array.from(elementToGMap.entries()));
                });
            });
        }
    });
});

// Helper function to traverse the SVG elements recursively
function traverseSvg(element, elementToGMap, parentG = null) {
    if (element.g) {
        element.g.forEach(g => {
            const gClass = g.$ && g.$.class;
            if (gClass === 'node default' || gClass === 'label' || gClass === 'edgeLabel') {
                findTextElements(g, elementToGMap, g);
            }
            traverseSvg(g, elementToGMap, gClass ? g : parentG);  // Continue traversing the rest of the SVG
        });
    }

    if (parentG) {
        findTextElements(element, elementToGMap, parentG);
    }

    if (typeof element === 'object') {
        for (let key in element) {
            if (element.hasOwnProperty(key) && key !== 'g') {
                traverseSvg(element[key], elementToGMap, parentG);
            }
        }
    }
}

// Function to find <text>, <p>, and <span> elements within a given element
function findTextElements(element, elementToGMap, parentG) {
    if (element.text || element.p || element.span) {
        const textElements = [].concat(element.text || [], element.p || [], element.span || []);

        textElements.forEach(t => {
            elementToGMap.set(t, parentG);
            console.log(`Mapping element:`, t, `to parent <g>:`, parentG);
        });
    }

    if (typeof element === 'object') {
        for (let key in element) {
            if (element.hasOwnProperty(key) && ['text', 'p', 'span'].includes(key)) {
                findTextElements(element[key], elementToGMap, parentG);
            }
        }
    }
}
