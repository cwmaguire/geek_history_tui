// main.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('timelineCanvas');
    if (canvas) {
        window.initTimeline(canvas);
        window.drawTimeline(); // Initial draw
    } else {
        console.error('Canvas element not found!');
    }
});
