let svgEditor = document.getElementById('editor');
let fileInput = document.getElementById('fileInput');
let drawingEnabled = false;
let cropping = false;
let startX, startY, endX, endY;
let currentPath = '';
let drawingTool = '';
let strokeColor = '#000000';
let strokeWidth = 5;
let isDrawing = false; // This will track the drawing state
let currentPathElement = null; // This will reference the current path SVG element

document.getElementById('downloadButton').addEventListener('click', downloadSVG);

function downloadSVG() {
    // Serialize the SVG to a string
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgEditor);

    // Add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    // Convert SVG source to URI data scheme.
    var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    // Create a download link and click it to start the download
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "downloaded_svg.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}



document.getElementById('textButton').addEventListener('click', startTextDrawing);

function startTextDrawing() {
    const textInput = document.getElementById('text-input');
    const text = textInput.value;

    if (text) {
        // Get the center position of the SVG canvas
        const svgRect = svgEditor.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;

        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', centerX);
        textElement.setAttribute('y', centerY);
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('fill', strokeColor);
        textElement.setAttribute('font-size', strokeWidth * 5);
        textElement.textContent = text;
        svgEditor.appendChild(textElement);

        // Clear the text input field
        textInput.value = '';

        // Make the text draggable
        makeDraggable(textElement);
    }
}







svgEditor.addEventListener('dblclick', function (event) {
    // Start drawing only if the double click happens on the SVG editor area
    if (event.target === svgEditor) {
        isDrawing = true; // Enable drawing
        startDrawing(event); // Call the startDrawing function to initialize path
    }
});
fileInput.addEventListener('change', handleFile);

function handleFile(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();

            img.onload = function () {
                // Draw the image on the SVG canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const dataURL = canvas.toDataURL('image/png');
                svgEditor.innerHTML = `<image xlink:href="${dataURL}" width="100%" height="100%"/>`;
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
}

function applyFilter() {
    // Implement filter logic here
    // You can get the SVG content and apply filters using SVG filters
    console.log('Applying Filter');
}

function startcrop() {
    if (!cropping) {
        cropping = true;
        svgEditor.addEventListener('mousedown', handleCropStart);
        svgEditor.addEventListener('mousemove', handleCropMove);
        svgEditor.addEventListener('mouseup', handleCropEnd);
    }
    // Implement crop logic here
    // You can get the SVG content and manipulate the image
    //console.log('Cropping Image');
}

function handleCropStart(event) {
    startX = event.clientX;
    startY = event.clientY;
}

function handleCropMove(event) {
    if (cropping) {
        endX = event.clientX;
        endY = event.clientY;
        drawCropRect();
    }
}

function handleCropEnd() {
    if (cropping) {
        endX = event.clientX;
        endY = event.clientY;
        drawCropRect();
        performCrop();
        resetCrop();
    }
}

function drawCropRect() {
    const rect = document.getElementById('cropRect');

    if (rect) {
        rect.setAttribute('x', Math.min(startX, endX));
        rect.setAttribute('y', Math.min(startY, endY));
        rect.setAttribute('width', Math.abs(endX - startX));
        rect.setAttribute('height', Math.abs(endY - startY));
    } else {
        const newRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        newRect.id = 'cropRect';
        newRect.setAttribute('x', Math.min(startX, endX));
        newRect.setAttribute('y', Math.min(startY, endY));
        newRect.setAttribute('width', Math.abs(endX - startX));
        newRect.setAttribute('height', Math.abs(endY - startY));
        newRect.setAttribute('stroke', 'black');
        newRect.setAttribute('stroke-dasharray', '5,5');
        newRect.setAttribute('fill', 'none');
        svgEditor.appendChild(newRect);
    }
}

function performCrop() {
    const rect = document.getElementById('cropRect');
    const viewBox = `${rect.getAttribute('x')} ${rect.getAttribute('y')} ${rect.getAttribute('width')} ${rect.getAttribute('height')}`;
    svgEditor.setAttribute('viewBox', viewBox);
}

function resetCrop() {
    cropping = false;
    startX = startY = endX = endY = 0;
    svgEditor.removeEventListener('mousedown', handleCropStart);
    svgEditor.removeEventListener('mousemove', handleCropMove);
    svgEditor.removeEventListener('mouseup', handleCropEnd);

    const rect = document.getElementById('cropRect');
    if (rect) {
        svgEditor.removeChild(rect);
    }
}

function toggleDrawing(tool) {
    drawingTool = tool;

    switch (tool) {
        case 'pencil':
            strokeWidth = 1; // Thin line for pencil
            break;
        case 'pen':
            strokeWidth = 5; // Thick line for pen
            break;
        // Add cases for other tools if necessary
        default:
            strokeWidth = 5; // Default stroke width
            break;
    }

    // If we're already drawing, update the current path element with the new stroke width
    if (isDrawing && currentPathElement) {
        finalizePath(); // Finalize the current path
        startDrawingWithNewTool(); // Start a new path with the new tool settings
    }
}
function startDrawingWithNewTool() {
    currentPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    currentPathElement.setAttribute('d', currentPath);
    currentPathElement.setAttribute('stroke', strokeColor);
    currentPathElement.setAttribute('stroke-width', strokeWidth);
    currentPathElement.setAttribute('fill', 'none');
    svgEditor.appendChild(currentPathElement);
}

function startDrawing(event) {
    if (!isDrawing) {
        startX = event.offsetX;
        startY = event.offsetY;
        isDrawing = true;
        currentPath = `M ${startX} ${startY} `;
        startDrawingWithNewTool();
    }
}

svgEditor.addEventListener('mousedown', function (event) {
    // Start a new path or continue the existing one based on the 'isDrawing' flag
    startDrawing(event);
});
function draw(event) {
    if (isDrawing && !isDragging) { // Check if we are drawing and not dragging
        const x = event.offsetX;
        const y = event.offsetY;
        currentPath += `L ${x} ${y} `;
        currentPathElement.setAttribute('d', currentPath);
    }
}

svgEditor.addEventListener('mousemove', function (event) {
    if (isDrawing && !isDragging) { // Don't draw if dragging
        const x = event.offsetX;
        const y = event.offsetY;
        currentPath += `L ${x} ${y} `;
        currentPathElement.setAttribute('d', currentPath);
    }
});

svgEditor.addEventListener('mouseup', function () {
    finalizePath();
});
svgEditor.addEventListener('dblclick', function (event) {
    // If the user double-clicks, check if they want to continue the current path
    if (currentPathElement) {
        // If there's an existing path, finalize it
        finalizePath();
    } else {
        // If there's no existing path, start a new one
        startDrawing(event);
    }
});

// To ensure drawing stops when the cursor leaves the SVG editor area
svgEditor.addEventListener('mouseleave', function () {
    // This function is called whenever the cursor leaves the SVG editor area
    // If we are drawing, disable drawing and remove the 'in-progress' class
    if (isDrawing) {
        isDrawing = false;
        let pathElement = svgEditor.querySelector('path.in-progress');
        if (pathElement) {
            pathElement.removeAttribute('class'); // Finalize the path
        }
    }
});
function finalizePath() {
    if (isDrawing) {
        isDrawing = false; // Stop drawing
        // Remove the 'in-progress' class or any identifying attribute
        currentPathElement = null; // Reset the current path element
        currentPath = ''; // Clear the current path
    }
}



svgEditor.addEventListener('mouseup', finalizePath);
svgEditor.addEventListener('mouseleave', finalizePath);


function stopDrawing(tool) {
    switch (tool) {
        case 'pencil':
        case 'pen':
        case 'paintbrush':
        case 'brush':
        case 'blobBrush':
        case 'freehand':
            // Additional logic when drawing stops for these tools
            break;
        default:
            break;
    }
}

let shouldDrawCircle = false; // Flag to control circle drawing

// Update the drawCircle function
function drawCircle(x, y) {
    if (shouldDrawCircle) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '50');
        circle.setAttribute('stroke', strokeColor);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke-width', strokeWidth);
        svgEditor.appendChild(circle);

        // Make the circle draggable
        makeDraggable(circle);

        shouldDrawCircle = false; // Reset the flag after drawing a circle
    }
}

let isDragging = false; // New flag

function makeDraggable(element) {
    let selectedElement = null;
    let offset = null;

    function startDrag(evt) {
        // Only make text elements draggable
        if (evt.target.tagName === 'text') {
            selectedElement = element;
            isDragging = true; // Set the dragging flag
            offset = getMousePosition(evt);
            offset.x -= parseFloat(selectedElement.getAttributeNS(null, "x"));
            offset.y -= parseFloat(selectedElement.getAttributeNS(null, "y"));

            // Prevent text selection
            evt.preventDefault();
        }
    }

    function drag(evt) {
        if (selectedElement && isDragging) { // Check if we are dragging
            var coord = getMousePosition(evt);
            selectedElement.setAttributeNS(null, "x", coord.x - offset.x);
            selectedElement.setAttributeNS(null, "y", coord.y - offset.y);
        }
    }

    function endDrag(evt) {
        isDragging = false; // Clear the dragging flag
        selectedElement = null;
    }

    // Add event listeners for the element
    element.addEventListener('mousedown', startDrag);
    svgEditor.addEventListener('mousemove', drag);
    svgEditor.addEventListener('mouseup', endDrag);
    svgEditor.addEventListener('mouseleave', endDrag);
}

function getMousePosition(evt) {
    var CTM = svgEditor.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}
svgEditor.addEventListener('click', function (evt) {
    var rect = svgEditor.getBoundingClientRect();
    var x = evt.clientX - rect.left;
    var y = evt.clientY - rect.top;
    drawCircle(x, y);
});
svgEditor.addEventListener('click', function (evt) {
    if (evt.target.id === 'editor') { // Check if the click is on the editor itself, not on an existing shape
        let coord = getMousePosition(evt);
        drawCircle(coord.x - 50, coord.y - 50);
    }
});
function drawSquare() {
    const square = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    square.setAttribute('x', 760);
    square.setAttribute('y', 100);
    square.setAttribute('width', '100');
    square.setAttribute('height', '100');
    square.setAttribute('stroke', strokeColor);
    square.setAttribute('fill', 'none');
    square.setAttribute('stroke-width', strokeWidth);
    svgEditor.appendChild(square);
}

function drawLine() {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', startX + 100);
    line.setAttribute('y2', startY + 100);
    line.setAttribute('stroke', strokeColor);
    line.setAttribute('stroke-width', strokeWidth);
    svgEditor.appendChild(line);
}

function changeColor(event) {
    strokeColor = event.target.value;
}

function changeStrokeWidth(event) {
    strokeWidth = event.target.value;
}
function clearDrawing() {
    while (svgEditor.firstChild) {
        svgEditor.removeChild(svgEditor.firstChild);
    }
    // Reset the drawing state and path
    isDrawing = false;
    currentPath = '';
    currentPathElement = null;
}