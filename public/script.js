let overlapCount = 0;
let filesWithOverlap = 0;
let totalOverlaps = 0;

fetch('/mermaidsvg')
    .then(response => response.json())
    .then(svgFiles => {
        const container = document.getElementById('svgContainer');
        svgFiles.forEach(file => {
            const objectElement = document.createElement('object');
            objectElement.data = `/mermaidsvg/${file}`;
            objectElement.type = 'image/svg+xml';

            objectElement.addEventListener('load', function() {
                const svgDoc = objectElement.contentDocument;
                const textElements = svgDoc.querySelectorAll("text");
                const boundingBoxes = [];

                // bounding boxes of text elements
                textElements.forEach(text => {
                    const bbox = text.getBoundingClientRect();
                    boundingBoxes.push({ element: text, bbox: bbox });
                });

                let fileOverlapCount = 0;

                // check if two bounding boxes overlap
                function isOverlapping(bbox1, bbox2) {
                    return !(bbox2.x > bbox1.x + bbox1.width ||
                             bbox2.x + bbox2.width < bbox1.x ||
                             bbox2.y > bbox1.y + bbox1.height ||
                             bbox2.y + bbox2.height < bbox1.y);
                }

                // get the points of intersection
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

                // check overlapping elements and print results
                for (let i = 0; i < boundingBoxes.length; i++) {
                    for (let j = i + 1; j < boundingBoxes.length; j++) {
                        const bbox1 = boundingBoxes[i].bbox;
                        const bbox2 = boundingBoxes[j].bbox;
                        const text1 = boundingBoxes[i].element;
                        const text2 = boundingBoxes[j].element;

                        if (isOverlapping(bbox1, bbox2)) {
                            const intersectionPoints = getIntersectionPoints(bbox1, bbox2);
                            if (intersectionPoints.length > 0){
                                overlapCount++;
                                fileOverlapCount++;
                                totalOverlaps++;
                                console.log(`${overlapCount} ${file}: ${text1.textContent} and ${text2.textContent} overlap at:`, intersectionPoints);
                                console.log('<svg> style:', svgDoc.querySelector("text").style.cssText);
                                console.log(`<text> 1 style:`, text1.style.cssText);
                                console.log(`<text> 2 style:`, text2.style.cssText);
                            }
                        }
                    }
                }

                if (fileOverlapCount > 0) {
                    filesWithOverlap++;
                }
            });

            objectElement.addEventListener('click', () => {
                console.log(`${file} clicked`);
            });

            container.appendChild(objectElement);
        });

    })
    .catch(error => console.error('Error fetching SVG files:', error))
    .finally(() => {

        console.log(`Files with at least one overlap: ${filesWithOverlap}`);
        if (filesWithOverlap > 0) {
            const avgOverlaps = totalOverlaps / filesWithOverlap;
            console.log(`Average number of overlaps per file with overlaps: ${avgOverlaps}`);
        }
    });
