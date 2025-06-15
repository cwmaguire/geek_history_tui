// interaction.js

let hoverTimeout;
let hoveredNodeId = null;

/**
 * Handles keyboard events for scrolling, zooming, and node selection.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleKeyDown(event) {
    const scrollAmount = window.innerWidth * 0.5; // 50% of screen width

    switch (event.key) {
        case 'ArrowUp': // Scroll left (back in time)
            window.scrollTimeline(scrollAmount);
            break;
        case 'ArrowDown': // Scroll right (forward in time)
            window.scrollTimeline(-scrollAmount);
            break;
        case 'PageUp': // Zoom in
            window.zoomTimeline(1);
            break;
        case 'PageDown': // Zoom out
            window.zoomTimeline(-1);
            break;
        case 'ArrowLeft': // Select previous node
            event.preventDefault(); // Prevent default browser scroll
            navigateNodes(-1);
            break;
        case 'ArrowRight': // Select next node
            event.preventDefault(); // Prevent default browser scroll
            navigateNodes(1);
            break;
    }
}

/**
 * Navigates to the next or previous node.
 * @param {number} direction - 1 for next, -1 for previous.
 */
function navigateNodes(direction) {
    let newIndex = -1;
    if (window.selectedNodeIndex === -1) {
        // If no node selected, select the first/last or closest
        if (direction === 1) { // Right arrow, select chronologically first
            newIndex = window.timelineData.length > 0 ? 0 : -1;
        } else { // Left arrow, select chronologically last
            newIndex = window.timelineData.length > 0 ? window.timelineData.length - 1 : -1;
        }
        // Alternatively, find the closest node to the current view if preferred for initial selection
        // newIndex = window.findClosestNodeToCenter();
    } else {
        newIndex = window.selectedNodeIndex + direction;
        if (newIndex < 0) newIndex = 0; // Wrap around or clamp
        if (newIndex >= window.timelineData.length) newIndex = window.timelineData.length - 1; // Wrap around or clamp
    }
    window.selectNode(newIndex);
}


/**
 * Handles mouse movement for node hover effects.
 * @param {MouseEvent} event - The mouse event.
 */
function handleMouseMove(event) {
    const canvas = document.getElementById('timelineCanvas');
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let foundNode = null;
    if (window.timelineNodePositions) {
        for (const node of window.timelineNodePositions) {
            // Check if mouse is within the node's clickable area
            if (mouseX >= node.x && mouseX <= (node.x + node.width) &&
                mouseY >= node.y && mouseY <= (node.y + node.height)) {
                foundNode = node;
                break;
            }
        }
    }

    if (foundNode && foundNode.id !== hoveredNodeId) {
        // New node hovered or different node hovered
        hoveredNodeId = foundNode.id;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            // Redraw only the hovered node area with full text
            drawHoveredNodeDetail(foundNode);
        }, 100); // Small delay to prevent flickering
    } else if (!foundNode && hoveredNodeId !== null) {
        // Mouse moved off a node
        hoveredNodeId = null;
        clearTimeout(hoverTimeout);
        window.drawTimeline(); // Redraw entire timeline to revert node text
    }
}

/**
 * Draws the detail of a hovered node (e.g., full title).
 * This function will temporarily override the drawing of a single node.
 * @param {object} nodeInfo - The information of the hovered node from timelineNodePositions.
 */
function drawHoveredNodeDetail(nodeInfo) {
    const canvas = document.getElementById('timelineCanvas');
    const ctx = canvas.getContext('2d');
    const { getFontSize, TILE_SIZE } = window.timelineConfig;

    // Clear the specific node area first to redraw
    const buffer = 5; // A small buffer around the node to clear
    ctx.clearRect(nodeInfo.x - buffer, nodeInfo.y - buffer, nodeInfo.width + buffer * 2, nodeInfo.height + buffer * 2);

    const isSelected = (nodeInfo.index === window.selectedNodeIndex);
    const boxColor = isSelected ? 'yellow' : 'white';
    const textColor = 'white';

    const fullTitleWidth = (nodeInfo.originalTitle.length * TILE_SIZE) + (TILE_SIZE * 4);
    const boxX_hover = nodeInfo.x + (nodeInfo.width / 2) - (fullTitleWidth / 2); // Center the expanded node

    ctx.font = `${getFontSize()}px monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Redraw connecting line
    ctx.strokeStyle = boxColor;
    ctx.beginPath();
    ctx.moveTo(nodeInfo.x + nodeInfo.width / 2, TIMELINE_Y);
    ctx.lineTo(nodeInfo.x + nodeInfo.width / 2, nodeInfo.y + nodeInfo.height / 2);
    ctx.stroke();


    // Redraw box with full text (ASCII style)
    ctx.fillText('+' + '-'.repeat(fullTitleWidth / TILE_SIZE - 2) + '*', boxX_hover, nodeInfo.y);
    ctx.fillText('<-|' + nodeInfo.originalTitle + '|->', boxX_hover, nodeInfo.y + TILE_SIZE);
    ctx.fillText('+' + '-'.repeat(fullTitleWidth / TILE_SIZE - 2) + '*', boxX_hover, nodeInfo.y + TILE_SIZE * 2);
}

// Add event listeners
document.addEventListener('keydown', handleKeyDown);
document.getElementById('timelineCanvas').addEventListener('mousemove', handleMouseMove);
