// timeline.js

const TILE_SIZE = 10; // Base unit for drawing, representing character width/height
const NODE_HEIGHT = TILE_SIZE * 5; // Height of the node box + connecting line
const TIMELINE_Y = 200; // Y-coordinate for the main horizontal timeline line

let currentZoomLevel = 1; // 1: Month, 2: Year, 3: Decade
let canvas;
let ctx;
let timelineData = [];
let timelineOffsetX = 0; // Current scroll position
let selectedNodeIndex = -1;

// Simulated Data (replace with your actual data structure as needed)
// Date objects are used for easier chronological sorting
timelineData = [
    { id: 'st_tng', title: 'Star Trek: The Next Generation', date: new Date('1987-09-28') },
    { id: 'st_ds9', title: 'Star Trek: Deep Space Nine', date: new Date('1993-01-03') },
    { id: 'st_voy', title: 'Star Trek: Voyager', date: new Date('1995-01-16') },
    { id: 'st_ent', title: 'Star Trek: Enterprise', date: new Date('2001-09-26') },
    { id: 'st_dsc', title: 'Star Trek: Discovery', date: new Date('2017-09-24') },
    { id: 'st_pic', title: 'Star Trek: Picard', date: new Date('2020-01-23') },
    { id: 'st_low', title: 'Star Trek: Lower Decks', date: new Date('2020-08-06') },
    { id: 'st_pro', title: 'Star Trek: Prodigy', date: new Date('2021-10-28') },
    { id: 'st_snw', title: 'Star Trek: Strange New Worlds', date: new Date('2022-05-05') },
];

// Sort timeline data chronologically and then alphabetically for same-month events
timelineData.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
    }
    return a.title.localeCompare(b.title);
});


/**
 * Initializes the canvas context.
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element.
 */
function initTimeline(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

/**
 * Resizes the canvas to fill the window.
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawTimeline(); // Redraw on resize
}

/**
 * Gets the font size based on the current zoom level.
 * @returns {number} The font size in pixels.
 */
function getFontSize() {
    switch (currentZoomLevel) {
        case 1: return 12; // Month View
        case 2: return 10; // Year View
        case 3: return 8;  // Decade View
        default: return 12;
    }
}

/**
 * Gets the character limit for node titles based on the current zoom level.
 * @returns {number} The maximum number of characters for a node title.
 */
function getNodeCharLimit() {
    switch (currentZoomLevel) {
        case 1: return 15; // Month View: Full title, 15 chars + 3 for ellipsis
        case 2: return 10; // Year View: Shorter title
        case 3: return 3;  // Decade View: Very short abbreviation
        default: return 15;
    }
}

/**
 * Truncates text with ellipsis if it exceeds the limit.
 * @param {string} text - The original text.
 * @param {number} limit - The character limit (excluding ellipsis).
 * @returns {string} The truncated text.
 */
function truncateText(text, limit) {
    if (text.length > limit) {
        return text.substring(0, limit) + '...';
    }
    return text;
}

/**
 * Calculates the X position for a given date.
 * This is a simplified linear mapping for demonstration.
 * In a real application, you'd use a more sophisticated scale.
 * @param {Date} date - The date to position.
 * @returns {number} The X coordinate on the virtual timeline.
 */
function getDateX(date) {
    // For simplicity, let's assume a fixed number of pixels per day
    // This will need refinement for true chronological scaling
    const minDate = timelineData[0].date;
    const diffTime = Math.abs(date.getTime() - minDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let scaleFactor;
    switch (currentZoomLevel) {
        case 1: scaleFactor = 3; break; // Pixels per day for Month View
        case 2: scaleFactor = 0.8; break; // Pixels per day for Year View
        case 3: scaleFactor = 0.2; break; // Pixels per day for Decade View
        default: scaleFactor = 3;
    }
    return diffDays * scaleFactor;
}

/**
 * Draws a single ASCII box node.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} x - The X coordinate of the node's center line.
 * @param {number} y - The Y coordinate where the node branches off the timeline.
 * @param {string} title - The node title.
 * @param {boolean} isSelected - Whether the node is currently selected.
 */
function drawNode(x, y, title, isSelected) {
    const charLimit = getNodeCharLimit();
    const displayTitle = truncateText(title, charLimit);
    const nodeWidth = (displayTitle.length * TILE_SIZE) + (TILE_SIZE * 4); // Text width + padding

    const boxColor = isSelected ? 'yellow' : 'white';
    const textColor = 'white';

    // Node box coordinates
    const boxX = x - nodeWidth / 2;
    const boxY = y - NODE_HEIGHT;

    ctx.font = `${getFontSize()}px monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw connecting line
    ctx.strokeStyle = boxColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, boxY + NODE_HEIGHT / 2); // Connect to middle of the box
    ctx.stroke();

    // Draw box (ASCII style)
    // Top line
    ctx.fillText('+' + '-'.repeat(nodeWidth / TILE_SIZE - 2) + '*', boxX, boxY);
    // Middle line with text
    ctx.fillText('<-|' + displayTitle + '|->', boxX, boxY + TILE_SIZE);
    // Bottom line
    ctx.fillText('+' + '-'.repeat(nodeWidth / TILE_SIZE - 2) + '*', boxX, boxY + TILE_SIZE * 2);
}


/**
 * Draws the main timeline and all nodes.
 */
function drawTimeline() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; // For dates and main line
    ctx.strokeStyle = 'white';
    ctx.font = `${getFontSize()}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw main horizontal line
    ctx.beginPath();
    ctx.moveTo(0, TIMELINE_Y);
    ctx.lineTo(canvas.width, TIMELINE_Y);
    ctx.stroke();

    const drawnDates = new Set();
    const processedNodePositions = []; // To store x,y,width for hit detection and selection

    // Draw nodes
    timelineData.forEach((node, index) => {
        const nodeX = getDateX(node.date) + timelineOffsetX;

        // Only draw if within visible canvas area
        if (nodeX > -200 && nodeX < canvas.width + 200) { // Add some buffer
            const isSelected = (index === selectedNodeIndex);
            drawNode(nodeX, TIMELINE_Y, node.title, isSelected);

            const charLimit = getNodeCharLimit();
            const displayTitle = truncateText(node.title, charLimit);
            const nodeWidth = (displayTitle.length * TILE_SIZE) + (TILE_SIZE * 4);

            processedNodePositions.push({
                id: node.id,
                x: nodeX - nodeWidth / 2,
                y: TIMELINE_Y - NODE_HEIGHT,
                width: nodeWidth,
                height: TILE_SIZE * 3, // Height of the ASCII box
                index: index,
                originalTitle: node.title // Store original title for hover
            });
        }

        // Draw dates
        let dateString;
        let dateKey; // Used to prevent drawing duplicate dates at the same interval
        let dateX = nodeX; // Position date relative to the node's date

        // Adjust date display based on zoom level
        switch (currentZoomLevel) {
            case 1: // Month View: YYYY-MM
                dateString = `${node.date.getFullYear()}-${(node.date.getMonth() + 1).toString().padStart(2, '0')}`;
                dateKey = dateString;
                break;
            case 2: // Year View: YYYY
                dateString = `${node.date.getFullYear()}`;
                dateKey = dateString;
                break;
            case 3: // Decade View: 'YY
                dateString = `'${node.date.getFullYear().toString().substring(2)}`;
                dateKey = dateString.substring(0, 3) + '0'; // Group by decade
                dateX = getDateX(new Date(node.date.getFullYear() - (node.date.getFullYear() % 10), 0, 1)) + timelineOffsetX; // Align to start of decade
                break;
        }

        if (!drawnDates.has(dateKey)) {
            const dateTextWidth = ctx.measureText(dateString).width;
            const dashLength = 30; // Length of dashes on either side of the date

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';

            // Draw left dashes
            ctx.fillText('-'.repeat(dashLength / TILE_SIZE), dateX - dateTextWidth / 2 - dashLength, TIMELINE_Y);
            // Draw date
            ctx.fillText(dateString, dateX, TIMELINE_Y);
            // Draw right dashes
            ctx.fillText('-'.repeat(dashLength / TILE_SIZE), dateX + dateTextWidth / 2 + dashLength, TIMELINE_Y);

            drawnDates.add(dateKey);
        }
    });

    // Store processed node positions globally for interaction.js
    window.timelineNodePositions = processedNodePositions;
}

/**
 * Scrolls the timeline horizontally.
 * @param {number} deltaX - The amount to scroll (positive for right, negative for left).
 */
function scrollTimeline(deltaX) {
    timelineOffsetX += deltaX;
    // Add boundaries to prevent scrolling too far, if needed
    // For now, allow infinite scroll for demo
    drawTimeline();
}

/**
 * Zooms the timeline in or out.
 * @param {number} direction - 1 to zoom in (Page Up), -1 to zoom out (Page Down).
 */
function zoomTimeline(direction) {
    currentZoomLevel += direction;
    if (currentZoomLevel < 1) currentZoomLevel = 1; // Min zoom: Month View
    if (currentZoomLevel > 3) currentZoomLevel = 3; // Max zoom: Decade View
    drawTimeline();
}

/**
 * Selects a node by its index.
 * @param {number} index - The index of the node to select.
 */
function selectNode(index) {
    if (index >= 0 && index < timelineData.length) {
        selectedNodeIndex = index;
        // Adjust scroll to keep selected node in view
        const nodeX = getDateX(timelineData[selectedNodeIndex].date) + timelineOffsetX;
        const screenCenterX = canvas.width / 2;
        const scrollDelta = screenCenterX - nodeX;
        scrollTimeline(scrollDelta); // This will call drawTimeline()
    } else {
        selectedNodeIndex = -1; // Deselect if invalid index
        drawTimeline();
    }
}

/**
 * Finds the node closest to the center of the viewport.
 * @returns {number} The index of the closest node, or -1 if none.
 */
function findClosestNodeToCenter() {
    let closestIndex = -1;
    let minDistance = Infinity;
    const viewportCenterX = -timelineOffsetX + canvas.width / 2; // X position on the virtual timeline

    timelineData.forEach((node, index) => {
        const nodeX = getDateX(node.date); // Virtual X position of the node
        const distance = Math.abs(nodeX - viewportCenterX);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });
    return closestIndex;
}

// Expose functions to global scope for interaction.js
window.initTimeline = initTimeline;
window.drawTimeline = drawTimeline;
window.scrollTimeline = scrollTimeline;
window.zoomTimeline = zoomTimeline;
window.selectNode = selectNode;
window.findClosestNodeToCenter = findClosestNodeToCenter;
window.timelineData = timelineData; // Expose data for easier navigation in interaction.js
window.timelineConfig = {
    getFontSize,
    getNodeCharLimit,
    truncateText,
    TILE_SIZE
};
