import * as bloom from "https://penrose.cs.cmu.edu/bloom.min.js";
let parser = new DOMParser();

// Bloom diagram builder to be defined after initial query of SVG canvas size
let db = null;
// SVG to Penrose coordinate translation offset to be defined after the same query
let xOffset, yOffset = 0;
// temp storage of db elements
let textElements = [];
const selectedIDs = [];
let diagram = null;

function parseTransform(transform) {
    let translate = [0, 0];
    let rotate = [0, 0, 0]; // Modify to store angle, cx, and cy

    if (transform) {
        // match translate and rotate
        const translateMatch = transform.match(/translate\(([^)]+)\)/);
        const rotateMatch = transform.match(/rotate\(([^)]+)\)/);

        if (translateMatch) {
            // extract translate values
            const translateValues = translateMatch[1].split(/[\s,]+/).map(parseFloat);
            translate = translateValues.length === 1 ? [translateValues[0], 0] : translateValues;
        }

        if (rotateMatch) {
            // extract rotate values
            const rotateValues = rotateMatch[1].split(/[\s,]+/).map(parseFloat);
            if (rotateValues.length === 1) {
                rotate = [rotateValues[0], 0, 0]; // angle only
            } else if (rotateValues.length === 3) {
                rotate = rotateValues; // angle, cx, cy
            }
        }
    }

    return { translate, rotate };
}

function getCanvasSize(svgElement) {
    if (!(svgElement instanceof SVGSVGElement)) {
        throw new Error('The provided element is not an SVGSVGElement.');
    }

    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) {
        throw new Error('The SVG element does not have a viewBox attribute.');
    }

    const viewBoxValues = viewBox.split(' ').map(parseFloat);
    if (viewBoxValues.length !== 4) {
        throw new Error('Invalid viewBox attribute.');
    }

    const canvasWidth = viewBoxValues[2];
    const canvasHeight = viewBoxValues[3];

    return [canvasWidth, canvasHeight];
}

function fetchAndProcessSVG(fileName, callback) {
    fetch(`svg/${fileName}`)
        .then(response => response.text())
        .then(async svgText => {
            let doc = parser.parseFromString(svgText, 'image/svg+xml');
            let svgElement = doc.querySelector('svg');
            if (svgElement) {
                let [canvasWidth, canvasHeight] = getCanvasSize(svgElement);
                xOffset = canvasWidth / 2;
                yOffset = canvasHeight / 2;

                db = new bloom.DiagramBuilder(bloom.canvas(canvasWidth, canvasHeight), "abcd", 1);
                
                // traverse SVG and build Bloom diagram elements
                traverseAndCheck(svgElement, callback);
                createTextBoxesAndConstraints(textElements);
                diagram = await db.build();
                let elem = diagram.getInteractiveElement();
                let style = doc.querySelector('style');
                document.body.appendChild(elem);

            }
        
        })
        .catch(error => console.error(`Failed to fetch or parse SVG file: ${fileName}`, error));
}

function handleGElement(element) {
    console.log(`Handling <g> element: ${element.tagName}`);
    // todo
}

function handleRectElement(element) {
    console.log(`Handling <rect> element: ${element.tagName}`);
    let props = {};
    let y, x = 0;
    let cx, cy = 0;
    let transl = [];
    Array.from(element.attributes).forEach(attr => {  
        if (attr.value) {
            switch (attr.name) {
                case 'corner-radius':
                    //props['cornerRadius'] = +attr.value;
                    break;
                case 'stroke-dasharray':
                    props['strokeDasharray'] = attr.value;
                    break;
                case 'stroke-style':
                    props['strokeStyle'] = attr.value;
                    break;
                case 'stroke-width':
                    props['strokeWidth'] = +attr.value;
                    break;
                case 'y':
                    y = +attr.value;
                    break;
                case 'x':
                    x = +attr.value;
                    break;
                case 'height':
                    props['height'] = +attr.value;
                    break;
                case 'width':
                    props['width'] = +attr.value;
                    break;
                case 'transform':
                    const {translate, rotate} = parseTransform(attr.value);
                    transl = translate;
                    if (rotate.length>0) {
                        props['rotation'] = rotate[0];
                    }
            }
            //console.log(`${attr.name}: ${attr.value}`); 
        }
    });
    cx = x + props['width'] / 2;
    cy = y + props['height'] / 2;

    // if transform field is set, use that as the center
    if (transl.length > 0) {
        let [dx,dy] = transl;
        props['center'] = [cx+dx-xOffset, yOffset-cy-dy];
    } else {
        props['center'] = [cx-xOffset, yOffset-cy];
    }
    //props['drag'] = true;

    console.log(props);

    db.rectangle(props);
}

function handleTextElement(element) {
    console.log(`Handling <text> element: ${element.tagName}`);
    let props = {};
    let y, x = 0;
    let center = [];
    Array.from(element.attributes).forEach(attr => {  
        if (attr.value) {
            switch (attr.name) {
                // case 'alignment-baseline':
                //     props['alignmentBaseline'] = attr.value;
                //     break;
                // case 'dominant-baseline':
                //     props['dominantBaseline'] = attr.value;
                //     break;
                // case 'font-family':
                //     props['fontFamily'] = attr.value;
                //     break;
                // case 'font-size':
                //     props['fontSize'] = attr.value;
                //     break;
                // case 'font-size-adjust':
                //     props['fontSizeAdjust'] = attr.value;
                //     break;
                // case 'font-stretch':
                //     props['fontStretch'] = attr.value;
                //     break;
                // case 'font-style':
                //     props['fontStyle'] = attr.value;
                //     break;
                // case 'font-weight':
                //     props['fontWeight'] = attr.value;
                //     break;
                // case 'font-variant':
                //     props['fontVariant'] = attr.value;
                //     break;
                // case 'text-anchor':
                //     props['textAnchor'] = attr.value;
                //     break;
                case 'y':
                    y = +attr.value;
                    break;
                case 'x':
                    x = +attr.value;
                    break;
                case 'transform':
                    const {translate, rotate} = parseTransform(attr.value);
                    let [fst, snd] = translate;
                    center = [fst-xOffset, yOffset-snd];
                    if (rotate.length>0) {
                        props['rotation'] = rotate[0];
                    }
            }
            //console.log(`${attr.name}: ${attr.value}`); 
        }
    });
    
    // if transform field is set, use that as the center
    if (center.length > 0) {
        props['center'] = center;
    } else {
        props['center'] = [x-xOffset, yOffset-y];
    }
    props['string'] = element.textContent;
    //props['drag'] = true;

    console.log(props);

    let dbElem = db.text(props);
    textElements.push(dbElem);
}

function handleCircleElement(element) {
    console.log(`Handling <circle> element: ${element.tagName}`);
    let props = {};
    let cy, cx = 0;
    let center = [];
    Array.from(element.attributes).forEach(attr => {  
        if (attr.value) {
            switch (attr.name) {
                case 'r':
                    props['r'] = +attr.value;
                    break;
                case 'cy':
                    cy = +attr.value;
                    break;
                case 'cx':
                    cx = +attr.value;
                    break;
                case 'transform':
                    const {translate, rotate} = parseTransform(attr.value);
                    let [fst, snd] = translate;
                    center = [fst-xOffset, yOffset-snd];
                    if (rotate.length>0) {
                        props['rotation'] = rotate[0];
                    }
            }
            //console.log(`${attr.name}: ${attr.value}`); 
        }
    });
    if (center.length > 0) {
        props['center'] = center;
    } else {
        props['center'] = [cx-xOffset, yOffset-cy];
    }
    //props['drag'] = true;
    console.log(props);

    db.circle(props);
}

function handleEllipseElement(element) {
    console.log(`Handling <ellipse> element: ${element.tagName}`);
    let props = {};
    let cy, cx = 0;
    let center = [];
    Array.from(element.attributes).forEach(attr => {  
        if (attr.value) {
            switch (attr.name) {
                case 'rx':
                    props['rx'] = +attr.value;
                    break;
                case 'ry':
                    props['ry'] = +attr.value;
                    break;
                case 'cy':
                    cy = +attr.value;
                    break;
                case 'cx':
                    cx = +attr.value;
                    break;
                case 'transform':
                    const {translate, rotate} = parseTransform(attr.value);
                    let [fst, snd] = translate;
                    center = [fst-xOffset, yOffset-snd];
                    if (rotate.length>0) {
                        props['rotation'] = rotate[0];
                    }
            }
        }
    });
    if (center.length > 0) {
        props['center'] = center;
    } else {
        props['center'] = [cx-xOffset, yOffset-cy];
    }
    //props['drag'] = true;
    console.log(props);

    db.ellipse(props);
}

function handleElement(element) {
    switch (element.tagName) {
        case 'g':
            handleGElement(element);
            break;
        case 'rect':
            handleRectElement(element);
            break;
        case 'text':
            handleTextElement(element);
            break;
        case 'circle':
            handleCircleElement(element);
            break;
        case 'ellipse':
            handleEllipseElement(element);
            break;
    }
}

function traverseAndCheck(svgElement, callback) {
    let list = [];
    if (svgElement) {
        // check if the element is one of the specified types
        if (['g', 'rect', 'text', 'circle'].includes(svgElement.tagName)) {
            callback(svgElement);
        }

        // traverse child elements
        let children = svgElement.children;
        for (let i = 0; i < children.length; i++) {
            traverseAndCheck(children[i], callback);
        }
    }
}

function createTextBoxesAndConstraints(textShapes) {
    let nextID = 0;
    for (const text of textShapes) {
        const i = nextID;

        const box = db.rectangle({
            width: text.width,
            height: text.height,
            center: text.center,
            rotation: text.rotation,
            fillColor: [0, 0, 0, 0],
            strokeColor: [1, 0, 0, db.input({ name: `${i}_selected`, optimized: false, init: 0 })],
            strokeWidth: 2
        });

        db.addEventListener(box, "pointerdown", (e) => {
            if (!e.shiftKey) {
                return;
            }
            if (selectedIDs.find(id => id === i) === undefined) {
                selectedIDs.push(i);
            }
            if (selectedIDs.length > 2) {
                selectedIDs.shift();
            }
            updateSelected();
            console.log(selectedIDs);
        });

        db.layer(text, box);

        nextID++;
    }
}

function updateSelected() {
    for (let i = 0; i < textElements.length; i++) {
        diagram.setInput(i + "_selected", selectedIDs.find(id => id === i) !== undefined ? 1 : 0);
    }

    if (selectedIDs.length === 2) {
        document.getElementById("constrain-button").hidden = false;
    } else {
        document.getElementById("constrain-button").hidden = true;
    }
}

const constrainButton = document.createElement("button");
constrainButton.innerHTML = "constrain";
constrainButton.id = "constrain-button";
constrainButton.hidden = true;
document.body.appendChild(constrainButton);

window.addEventListener("keydown", (e) => {
    // escape
    if (e.key === "Escape") {
        while (selectedIDs.length > 0) {
            selectedIDs.pop();
        }
        updateSelected();
    }
});

fetchAndProcessSVG('test.svg', handleElement);



//const diagram = await db.build();

//document.body.appendChild(diagram.getInteractiveElement());
    
