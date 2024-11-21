let overlapCount = 0;
let filesWithOverlap = 0;
let totalOverlaps = 0;

const BATCH_SIZE = 100; // Adjust the batch size as needed
const container = document.getElementById('svgContainer');

function isOverlapping(bbox1, bbox2) {
    return !(bbox2.x > bbox1.x + bbox1.width ||
             bbox2.x + bbox2.width < bbox1.x ||
             bbox2.y > bbox1.y + bbox1.height ||
             bbox2.y + bbox2.height < bbox1.y);
}

function getIntersectionPoints(bbox1, bbox2) {
    const points = [];
    const xOverlap = Math.max(bbox1.x, bbox2.x);
    const yOverlap = Math.max(bbox1.y, bbox2.y);
    const xEndOverlap = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
    const yEndOverlap = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);

    if (xOverlap < xEndOverlap && yOverlap < yEndOverlap) {
        points.push({ x: xOverlap, y: yOverlap });
        points.push({ x: xEndOverlap, y: yOverlap });
        points.push({ x: xOverlap, y: yEndOverlap });
        points.push({ x: xEndOverlap, y: yEndOverlap });
    }

    return points;
}

function processSVG(svgDoc, file) {
    const textElements = svgDoc.querySelectorAll("text");
    const boundingBoxes = [];

    // bounding boxes of text elements
    textElements.forEach(text => {
        const bbox = text.getBBox();
        if (bbox) {
            boundingBoxes.push({ element: text, bbox: bbox });
        }
    });

    console.log(`Processing file: ${file}`);
    //console.log(`Bounding Boxes:`, boundingBoxes);

    let fileOverlapCount = 0;

    // check overlapping elements and print results
    for (let i = 0; i < boundingBoxes.length; i++) {
        for (let j = i + 1; j < boundingBoxes.length; j++) {
            const bbox1 = boundingBoxes[i].bbox;
            const bbox2 = boundingBoxes[j].bbox;
            const text1 = boundingBoxes[i].element;
            const text2 = boundingBoxes[j].element;

            //console.log(`Checking overlap between: ${text1.textContent} and ${text2.textContent}`);
            //console.log(`bbox1:`, bbox1);
            //console.log(`bbox2:`, bbox2);

            if (bbox1 && bbox2 && isOverlapping(bbox1, bbox2)) {
                const intersectionPoints = getIntersectionPoints(bbox1, bbox2);
                //console.log(`Intersection Points:`, intersectionPoints);

                if (intersectionPoints.length > 0) {
                    const verticalOverlap = intersectionPoints[2].y - intersectionPoints[0].y;
                    if (verticalOverlap >= 1) {
                        overlapCount++;
                        fileOverlapCount++;
                        totalOverlaps++;
                        console.log(`${overlapCount} ${file}: ${text1.textContent} and ${text2.textContent} overlap at:`, intersectionPoints);
                    }
                }
            }
        }
    }

    if (fileOverlapCount > 0) {
        filesWithOverlap++;
    }
}

async function processBatch(svgFiles, start, end) {
    for (let i = start; i < end && i < svgFiles.length; i++) {
        const file = svgFiles[i];
        const encodedFileName = encodeURIComponent(file);
        const objectElement = document.createElement('object');
        objectElement.data = `/mermaidsvg/${encodedFileName}`;
        objectElement.type = 'image/svg+xml';

        await new Promise((resolve) => {
            objectElement.addEventListener('load', function() {
                const svgDoc = objectElement.contentDocument;
                processSVG(svgDoc, file);
                container.removeChild(objectElement);
                resolve();
            });

            container.appendChild(objectElement);
        });
    }
}

async function processFilesInBatches(svgFiles) {
    for (let i = 0; i < svgFiles.length; i += BATCH_SIZE) {
        await processBatch(svgFiles, i, i + BATCH_SIZE);
    }

    // Log filesWithOverlap and calculate the average only after all batches are processed
    console.log(`Files with at least one overlap: ${filesWithOverlap}`);
    if (filesWithOverlap > 0) {
        const avgOverlaps = totalOverlaps / filesWithOverlap;
        console.log(`Average number of overlaps per file with overlaps: ${avgOverlaps}`);
    }
}

fetch('/mermaidsvg')
    .then(response => response.json())
    .then(svgFiles => {
        console.log(`Fetched ${svgFiles.length} SVG files.`);
        return processFilesInBatches(svgFiles);
    })
    .catch(error => console.error('Error fetching SVG files:', error));
