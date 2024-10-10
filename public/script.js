fetch('/svgs')
            .then(response => response.json())
            .then(svgFiles => {
                const container = document.getElementById('svgContainer');
                svgFiles.forEach(file => {
                    const objectElement = document.createElement('object');
                    objectElement.data = `/svgs/${file}`;
                    objectElement.type = 'image/svg+xml';
                    objectElement.addEventListener('load', function() {
                        const svgDoc = objectElement.contentDocument;
                        const textElements = svgDoc.querySelectorAll("text");
                        const boundingBoxes = [];
                
                        // bounding boxes of text elements
                        textElements.forEach(text => {
                            const bbox = text.getBoundingClientRect();
                            //console.log(`${text.textContent}: ${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                            boundingBoxes.push({ element: text, bbox: bbox });
                        });
                
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
                                const text1 = boundingBoxes[i].element.textContent;
                                const text2 = boundingBoxes[j].element.textContent;
                
                                if (isOverlapping(bbox1, bbox2)) {
                                    const intersectionPoints = getIntersectionPoints(bbox1, bbox2);
                                    console.log(`${text1} and ${text2} overlap at:`, intersectionPoints);
                                }
                            }
                        }
                    });
                    objectElement.addEventListener('click', () => {
                        console.log(`${file} clicked`);
                    });
                    container.appendChild(objectElement);
                });
            })
            .catch(error => console.error('Error fetching SVG files:', error));

/*
document.addEventListener("DOMContentLoaded", function() {
    const svgObject = document.getElementById("svgObject");
    svgObject.addEventListener("load", function() {
        const svgDoc = svgObject.contentDocument;
        const textElements = svgDoc.querySelectorAll("text");
        const boundingBoxes = [];

        // bounding boxes of text elements
        textElements.forEach(text => {
            const bbox = text.getBoundingClientRect();
            //console.log(`${text.textContent}: ${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
            boundingBoxes.push({ element: text, bbox: bbox });
        });

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
                const text1 = boundingBoxes[i].element.textContent;
                const text2 = boundingBoxes[j].element.textContent;

                if (isOverlapping(bbox1, bbox2)) {
                    const intersectionPoints = getIntersectionPoints(bbox1, bbox2);
                    console.log(`${text1} and ${text2} overlap at:`, intersectionPoints);
                }
            }
        }
    });
});
*/