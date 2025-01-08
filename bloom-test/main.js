import * as bloom from "https://penrose.cs.cmu.edu/bloom.min.js";
let parser = new DOMParser();

const db = new bloom.DiagramBuilder(bloom.canvas(500, 500), "abcd", 1);
const { type, predicate, forall, forallWhere, ensure, circle, line, text, rectangle} = db;


function parseTransform(transform) {
    let translate = [0, 0];
    let rotate = 0;

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
            // extract rotate value
            rotate = parseFloat(rotateMatch[1]);
        }
    }

    return { translate, rotate };
}

function fetchAndProcessSVG(fileName, callback) {
    fetch(`svg/${fileName}`)
        .then(response => response.text())
        .then(async svgText => {
            let doc = parser.parseFromString(svgText, 'image/svg+xml');
            let svgElement = doc.querySelector('svg');
            if (svgElement) {
                
                traverseAndCheck(svgElement, callback);
                const diagram = await db.build();
                document.body.appendChild(diagram.getInteractiveElement());
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
    // todo
}

function handleTextElement(element) {
    console.log(`Handling <text> element: ${element.tagName}`);
    let props = {};
    let y, x = 0;
    let center = [];
    Array.from(element.attributes).forEach(attr => {  
        if (attr.value) {
            switch (attr.name) {
                case 'alignment-baseline':
                    props['alignmentBaseline'] = attr.value;
                    break;
                case 'dominant-baseline':
                    props['dominantBaseline'] = attr.value;
                    break;
                case 'font-family':
                    props['fontFamily'] = attr.value;
                    break;
                case 'font-size':
                    props['fontSize'] = attr.value;
                    break;
                case 'font-size-adjust':
                    props['fontSizeAdjust'] = attr.value;
                    break;
                case 'font-stretch':
                    props['fontStretch'] = attr.value;
                    break;
                case 'font-style':
                    props['fontStyle'] = attr.value;
                    break;
                case 'font-weight':
                    props['fontWeight'] = attr.value;
                    break;
                case 'font-variant':
                    props['fontVariant'] = attr.value;
                    break;
                case 'text-anchor':
                    props['textAnchor'] = attr.value;
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
                case 'transform':
                    const {translate, rotate} = parseTransform(attr.value);
                    center = translate;
            }
            //console.log(`${attr.name}: ${attr.value}`); 
        }
    });
    
    // if transform field is set, use that as the center
    if (center.length > 0) {
        props['center'] = center;
    } else {
        props['center'] = [x, y];
    }
    props['string'] = element.textContent;
    //props['drag'] = true;

    console.log(props);

    db.text(props);
}

function handleCircleElement(element) {
    console.log(`Handling <circle> element: ${element.tagName}`);
    let props = {};
    let cy, cx = 0;
    Array.from(element.attributes).forEach(attr => {  
        if (attr.value) {
            switch (attr.name) {
                case 'r':
                    props['r'] = +attr.value;
                    break;
                case 'cy':
                    cy = attr.value;
                    break;
                case 'cx':
                    cx = attr.value;
                    break;
            }
            //console.log(`${attr.name}: ${attr.value}`); 
        }
    });
    props['center'] = [+cx, +cy];
    //props['drag'] = true;
    console.log(props);

    db.circle(props);
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




fetchAndProcessSVG('test.svg', handleElement);



//const diagram = await db.build();

//document.body.appendChild(diagram.getInteractiveElement());
    
