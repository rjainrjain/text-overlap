const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const csvWriter = require('csv-writer').createObjectCsvWriter;

const folderPath = '/mermaidsvg';
const batchSize = 100; // Adjust batch size as needed
const svgFiles = fs.readdirSync(folderPath).filter(file => path.extname(file) === '.svg');
let overlapCount = 0;

const writer = csvWriter({
  path: 'overlaps.csv',
  header: [
    { id: 'fileNumber', title: 'File Number' },
    { id: 'overlapCount', title: 'Overlap Count' },
    { id: 'text1', title: 'Text 1' },
    { id: 'text2', title: 'Text 2' },
    { id: 'intersection', title: 'Intersection Points' }
  ]
});

(async function processSVGs() {
  for (let i = 0; i < svgFiles.length; i += batchSize) {
    const batch = svgFiles.slice(i, i + batchSize);
    const overlaps = [];

    for (const file of batch) {
      const filePath = path.join(folderPath, file);
      const svgContent = fs.readFileSync(filePath, 'utf8');
      const dom = new JSDOM(svgContent);
      const document = dom.window.document;

      const textElements = Array.from(document.querySelectorAll('text, p'));
      for (let j = 0; j < textElements.length; j++) {
        const bbox1 = textElements[j].getBBox();
        for (let k = j + 1; k < textElements.length; k++) {
          const bbox2 = textElements[k].getBBox();
          if (doBoundingBoxesOverlap(bbox1, bbox2)) {
            const verticalOverlap = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height) - Math.max(bbox1.y, bbox2.y);
            if (verticalOverlap >= 1) {
              overlapCount++;
              overlaps.push({
                fileNumber: i + j,
                overlapCount,
                text1: textElements[j].textContent,
                text2: textElements[k].textContent,
                intersection: calculateIntersection(bbox1, bbox2)
              });
            }
          }
        }
      }
    }

    if (overlaps.length > 0) {
      await writer.writeRecords(overlaps);
      console.log(`Processed batch ${i / batchSize + 1}`);
    }

    // Clear the DOM to release memory
    resetDOM();
  }
  console.log('Processing complete');
})();

function doBoundingBoxesOverlap(bbox1, bbox2) {
  return !(bbox2.x > bbox1.x + bbox1.width ||
           bbox2.x + bbox2.width < bbox1.x ||
           bbox2.y > bbox1.y + bbox1.height ||
           bbox2.y + bbox2.height < bbox1.y);
}

function calculateIntersection(bbox1, bbox2) {
  const x1 = Math.max(bbox1.x, bbox2.x);
  const y1 = Math.max(bbox1.y, bbox2.y);
  const x2 = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
  const y2 = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);
  return `(${x1}, ${y1}), (${x2}, ${y2})`;
}

function resetDOM() {
  global.gc && global.gc(); // Suggest a GC run if --expose-gc is used
  console.log('DOM reset to clear memory');
}
