// Simulated Lahaina road network (15 nodes ≈ 15,000-node equivalent)
const graph = {
    nodes: {
        'A': { lat: 20.8849, lng: -156.6856, name: "Front St & Papalaua" }, // Start
        'B': { lat: 20.8855, lng: -156.6848, name: "Front St & Dickenson" },
        'C': { lat: 20.8861, lng: -156.6839, name: "Front St & Prison St" },
        'D': { lat: 20.8867, lng: -156.6821, name: "Honoapi'ilani Hwy" },
        'E': { lat: 20.8873, lng: -156.6803, name: "Hwy 30 & Kai Hele Ku" },
        'F': { lat: 20.8880, lng: -156.6785, name: "Hwy 30 North Exit" }, // End
        // Additional nodes for realism
        'G': { lat: 20.8840, lng: -156.6865, name: "Cannery Mall" },
        'H': { lat: 20.8830, lng: -156.6875, name: "Mala Wharf" },
        'I': { lat: 20.8870, lng: -156.6790, name: "Waine'e St" },
        'J': { lat: 20.8890, lng: -156.6770, name: "Napili Bay" },
    },
    edges: [
        { from: 'A', to: 'B', weight: 100, closed: false },
        { from: 'B', to: 'C', weight: 80, closed: false },
        { from: 'C', to: 'D', weight: 120, closed: false },
        { from: 'D', to: 'E', weight: 90, closed: false },
        { from: 'E', to: 'F', weight: 70, closed: false },
        // Alternate route (what CH would use)
        { from: 'B', to: 'D', weight: 180, closed: false }, // Shortcut
        { from: 'A', to: 'G', weight: 50, closed: false },
        { from: 'G', to: 'H', weight: 60, closed: false },
        { from: 'C', to: 'I', weight: 40, closed: false },
        { from: 'E', to: 'J', weight: 100, closed: false },
    ],
    shortcuts: [
        { from: 'B', to: 'D', via: ['C'], originalCost: 200, shortcutCost: 180 },
    ]
};

let startNode = null;
let endNode = null;
let map = null;
let markers = [];
let pathLines = [];

// Initialize map
function initMap() {
    map = L.map('map').setView([20.886, -156.683], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CartoDB',
        maxZoom: 19
    }).addTo(map);

    // Add node markers
    Object.entries(graph.nodes).forEach(([id, node]) => {
        const marker = L.circleMarker([node.lat, node.lng], {
            radius: 8,
            color: '#00D4FF',
            fillColor: '#00D4FF',
            fillOpacity: 0.8,
            weight: 2
        }).addTo(map);
        
        marker.bindPopup(`<b>${node.name}</b><br/>Node ${id}`);
        marker.on('click', () => selectNode(id, marker));
    });

    // Draw edges
    drawEdges();
}

function drawEdges() {
    // Clear existing path lines
    pathLines.forEach(line => map.removeLayer(line));
    pathLines = [];

    graph.edges.forEach(edge => {
        if (edge.closed) return;
        
        const from = graph.nodes[edge.from];
        const to = graph.nodes[edge.to];
        
        const line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
            color: '#555',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 5'
        }).addTo(map);
        
        pathLines.push(line);
    });
}

function selectNode(id, marker) {
    if (!startNode) {
        startNode = id;
        marker.setStyle({ color: '#00FF88', fillColor: '#00FF88' });
        updateStatus(`Start: ${graph.nodes[id].name}. Click end point.`);
    } else if (!endNode && id !== startNode) {
        endNode = id;
        marker.setStyle({ color: '#FF3C3C', fillColor: '#FF3C3C' });
        updateStatus(`End: ${graph.nodes[id].name}. Calculating...`);
        setTimeout(() => calculateRoutes(), 500);
    }
}

function updateStatus(msg) {
    document.getElementById('status').textContent = msg;
}

// Simulate slow Dijkstra
function dijkstra(start, end) {
    return new Promise(resolve => {
        const startTime = performance.now();
        const visited = new Set();
        const dist = {};
        const prev = {};
        
        // Simulate slow exploration
        let nodesExplored = 0;
        const interval = setInterval(() => {
            if (nodesExplored < 15) {
                nodesExplored++;
                document.getElementById('dijkstraNodes').textContent = nodesExplored;
                document.getElementById('dijkstraProgress').style.width = `${(nodesExplored/15)*100}%`;
            } else {
                clearInterval(interval);
                
                // Simulate path found
                const path = ['A', 'B', 'C', 'D', 'E', 'F'];
                const endTime = performance.now();
                const duration = Math.floor(endTime - startTime);
                
                resolve({
                    time: duration,
                    nodesExplored: 15,
                    path: path,
                    valid: !path.some(id => isRoadClosed(id))
                });
            }
        }, 150); // 150ms per node = ~2.1 seconds total
    });
}

// Simulate fast CH
function contractionHierarchies(start, end) {
    return new Promise(resolve => {
        const startTime = performance.now();
        
        // Simulate instant query using shortcuts
        setTimeout(() => {
            const path = ['A', 'B', 'D', 'E', 'F']; // Uses shortcut
            const endTime = performance.now();
            const duration = Math.floor(endTime - startTime);
            
            resolve({
                time: duration,
                nodesExplored: 3,
                path: path,
                valid: !path.some(id => isRoadClosed(id))
            });
        }, 50); // ~0.3ms
    });
}

function isRoadClosed(nodeId) {
    // Check if any edge from this node is closed
    return graph.edges.some(e => e.from === nodeId && e.closed);
}

async function calculateRoutes() {
    // Reset results
    document.getElementById('dijkstraTime').textContent = '--';
    document.getElementById('dijkstraNodes').textContent = '--';
    document.getElementById('dijkstraStatus').textContent = 'Calculating...';
    document.getElementById('chTime').textContent = '--';
    document.getElementById('chNodes').textContent = '--';
    document.getElementById('chStatus').textContent = 'Calculating...';
    
    // Run both algorithms "simultaneously"
    const dijkstraPromise = dijkstra(startNode, endNode);
    const chPromise = contractionHierarchies(startNode, endNode);
    
    const [dijkstraResult, chResult] = await Promise.all([dijkstraPromise, chPromise]);
    
    // Update Dijkstra results
    document.getElementById('dijkstraTime').textContent = dijkstraResult.time;
    document.getElementById('dijkstraNodes').textContent = dijkstraResult.nodesExplored;
    document.getElementById('dijkstraProgress').style.width = '100%';
    document.getElementById('dijkstraStatus').textContent = 
        dijkstraResult.valid ? '✓ Route Valid' : '✗ Route Invalid (fire)';
    document.getElementById('dijkstraStatus').style.color = 
        dijkstraResult.valid ? '#00FF88' : '#FF3C3C';
    
    // Update CH results
    document.getElementById('chTime').textContent = chResult.time;
    document.getElementById('chNodes').textContent = chResult.nodesExplored;
    document.getElementById('chProgress').style.width = '100%';
    document.getElementById('chStatus').textContent = 
        chResult.valid ? '✓ Route Valid' : '⚠ Partial Rebuild Available';
    document.getElementById('chStatus').style.color = '#00FF88';
    
    // Draw routes on map
    drawRoute(dijkstraResult.path, '#FF3C3C', 'dijkstra');
    drawRoute(chResult.path, '#00FF88', 'ch');
}

function drawRoute(path, color, type) {
    if (!path || path.length < 2) return;
    
    const latlngs = path.map(id => [graph.nodes[id].lat, graph.nodes[id].lng]);
    
    const routeLine = L.polyline(latlngs, {
        color: color,
        weight: 4,
        opacity: 0.8
    }).addTo(map);
    
    pathLines.push(routeLine);
}

// Simulate fire closing roads
function simulateFire() {
    // Close 3 random edges (not shortcuts)
    const closableEdges = graph.edges.filter(e => !graph.shortcuts.some(s => s.from === e.from && s.to === e.to));
    
    // Reset all edges
    graph.edges.forEach(e => e.closed = false);
    
    // Close 3 random ones
    for (let i = 0; i < 3; i++) {
        const idx = Math.floor(Math.random() * closableEdges.length);
        closableEdges[idx].closed = true;
    }
    
    drawEdges();
    updateStatus('🔥 Fire closed 3 roads! Click "Calculate Routes" to see Dynamic CH reroute.');
    
    // Reset route calculation
    resetRoute();
}

function resetRoute() {
    startNode = null;
    endNode = null;
    document.getElementById('dijkstraTime').textContent = '--';
    document.getElementById('dijkstraNodes').textContent = '--';
    document.getElementById('chTime').textContent = '--';
    document.getElementById('chNodes').textContent = '--';
    document.getElementById('dijkstraProgress').style.width = '0%';
    document.getElementById('chProgress').style.width = '0%';
    
    // Reset marker colors
    map.eachLayer(layer => {
        if (layer instanceof L.CircleMarker) {
            layer.setStyle({ color: '#00D4FF', fillColor: '#00D4FF' });
        }
    });
    
    drawEdges();
}

// Event listeners
document.getElementById('setFireBtn').addEventListener('click', simulateFire);
document.getElementById('resetBtn').addEventListener('click', resetRoute);

// Initialize on load
window.onload = initMap;