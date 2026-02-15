const html5QrCode = new Html5Qrcode("reader");
let isScanning = true;

function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) return;
    // Stop scanning temporarily
    isScanning = false;
    html5QrCode.pause();

    fetchProduct(decodedText);
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // console.warn(`Code scan error = ${error}`);
}

// Start scanner
Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
        const cameraId = devices[0].id;
        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 100 }
            },
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            console.error("Error starting scanner", err);
            document.getElementById('error-msg').innerText = "Camera permission denied or error.";
            document.getElementById('error-msg').style.display = 'block';
        });
    }
}).catch(err => {
    console.error("Error getting cameras", err);
    document.getElementById('error-msg').innerText = "No camera found.";
    document.getElementById('error-msg').style.display = 'block';
});

function handleManualScan() {
    const barcode = document.getElementById('manual-barcode').value;
    if (barcode) {
        isScanning = false;
        fetchProduct(barcode);
    }
}

async function fetchProduct(barcode) {
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('product-card').style.display = 'none';
    document.getElementById('error-msg').style.display = 'none';

    try {
        const response = await fetch(`/api/scan/${barcode}`);
        if (!response.ok) throw new Error('Product not found');

        const data = await response.json();
        displayProduct(data);
    } catch (error) {
        document.getElementById('error-msg').innerText = error.message;
        document.getElementById('error-msg').style.display = 'block';
        isScanning = true;
        try { html5QrCode.resume(); } catch (e) { }
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayProduct(data) {
    // Update basic info
    document.getElementById('p-name').textContent = data.name;
    document.getElementById('p-category').textContent = data.categories.join(', ');

    // Image
    const img = document.getElementById('p-image');
    img.src = data.image_url || 'https://placehold.co/100x100?text=No+Image';

    // Veg Status
    const vegText = document.getElementById('veg-text');
    const vegIcon = document.getElementById('veg-icon');
    const vegContainer = document.getElementById('p-veg');

    vegText.textContent = data.veg_status;
    vegContainer.className = 'veg-status'; // reset
    if (data.veg_status === 'Vegetarian' || data.veg_status === 'Vegan') {
        vegContainer.classList.add('veg-green');
        vegIcon.textContent = '🥬';
    } else if (data.veg_status === 'Non-Vegetarian') {
        vegContainer.classList.add('veg-red');
        vegIcon.textContent = '🍖';
    } else {
        vegContainer.classList.add('veg-unknown');
        vegIcon.textContent = '❓';
    }

    // Nutri-Score Visualization
    updateNutriScoreVisual(data.nutriscore);

    // Lists
    const allergensEl = document.getElementById('p-allergens');
    allergensEl.innerHTML = data.allergens.length
        ? data.allergens.map(a => `<span class='pill'>${a}</span>`).join('')
        : 'None detected';

    const additivesEl = document.getElementById('p-additives');
    additivesEl.innerHTML = data.additives.length
        ? data.additives.map(a => `<span class='pill'>${a}</span>`).join('')
        : 'None detected';

    // Show card
    document.getElementById('product-card').style.display = 'flex';
}

function updateNutriScoreVisual(score) {
    // Score is 'A', 'B', 'C', 'D', 'E' or 'UNKNOWN'
    const indicator = document.getElementById('score-indicator');
    const scoreVal = document.getElementById('score-value');

    scoreVal.textContent = score || '?';

    // Calculate position
    // Scale is divided into 5 segments (0-20%, 20-40%, etc.)
    // A: 10%, B: 30%, C: 50%, D: 70%, E: 90%
    let position = '50%';
    let color = 'white';

    if (score) {
        switch (score.toUpperCase()) {
            case 'A': position = '10%'; color = '#038141'; break;
            case 'B': position = '30%'; color = '#85BB2F'; break;
            case 'C': position = '50%'; color = '#FECB02'; break;
            case 'D': position = '70%'; color = '#EE8100'; break;
            case 'E': position = '90%'; color = '#E63E11'; break;
            default: position = '-10%'; // hide
        }
        indicator.style.left = position;
        indicator.style.borderBottomColor = 'white';
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }

    scoreVal.style.color = color;
}
