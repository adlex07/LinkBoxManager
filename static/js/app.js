document.addEventListener('DOMContentLoaded', () => {
    const generateBoxBtn = document.getElementById('generateBox');
    const exportBtn = document.getElementById('exportData');
    const importBtn = document.getElementById('importData');
    const fileInput = document.getElementById('fileInput');
    const boxContainer = document.getElementById('boxContainer');
    let boxCounter = 0;

    generateBoxBtn.addEventListener('click', () => {
        createLinkBox();
    });

    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importData);

    // Load data from localStorage when the page loads
    loadFromLocalStorage();

    function createLinkBox(id = null, label = '', links = '') {
        boxCounter++;
        const boxId = id || `box-${boxCounter}`;
        const box = document.createElement('div');
        box.className = 'link-box bg-white p-6 rounded-lg shadow-md';
        box.id = boxId;
        box.innerHTML = `
            <div class="mb-4">
                <input type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" placeholder="Enter box label" value="${label}">
            </div>
            <div class="mb-4">
                <textarea rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" placeholder="Paste your links here, one per line">${links}</textarea>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="copyLinks('${boxId}')" class="btn-icon bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    <i data-feather="copy"></i>
                    Copy
                </button>
                <button onclick="manipulateAndCopy('${boxId}')" class="btn-icon bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                    <i data-feather="edit-2"></i>
                    Add /r.php
                </button>
                <button onclick="deleteBox('${boxId}')" class="btn-icon bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                    <i data-feather="trash-2"></i>
                    Delete
                </button>
            </div>
        `;
        boxContainer.appendChild(box);
        feather.replace();

        // Add event listeners for input and textarea
        box.querySelector('input').addEventListener('input', saveToLocalStorage);
        box.querySelector('textarea').addEventListener('input', saveToLocalStorage);

        saveToLocalStorage();
    }

    window.copyLinks = (boxId) => {
        const links = document.querySelector(`#${boxId} textarea`).value;
        navigator.clipboard.writeText(links).then(() => {
            alert('Links copied to clipboard!');
        });
    };

    window.manipulateAndCopy = (boxId) => {
        const linksTextarea = document.querySelector(`#${boxId} textarea`);
        const links = linksTextarea.value.split('\n');
        const manipulatedLinks = links.map(link => {
            if (link.includes('redirect.php')) {
                return link.replace('redirect.php', 'r.php');
            } else {
                return link + (link.endsWith('/') ? 'r.php' : '/r.php');
            }
        });
        const result = manipulatedLinks.join('\n');
        navigator.clipboard.writeText(result).then(() => {
            alert('Manipulated links copied to clipboard!');
        });
    };

    window.deleteBox = (boxId) => {
        const box = document.getElementById(boxId);
        if (box) {
            box.remove();
            saveToLocalStorage();
        }
    };

    function exportData() {
        const boxes = document.querySelectorAll('.link-box');
        const data = Array.from(boxes).map(box => ({
            id: box.id,
            label: box.querySelector('input').value,
            links: box.querySelector('textarea').value
        }));
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'link_manager_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    boxContainer.innerHTML = ''; // Clear existing boxes
                    data.forEach(box => createLinkBox(box.id, box.label, box.links));
                    boxCounter = data.length;
                    saveToLocalStorage(); // Save imported data to localStorage
                } catch (error) {
                    alert('Error importing data. Please make sure the file is valid JSON.');
                }
            };
            reader.readAsText(file);
        }
    }

    function saveToLocalStorage() {
        const boxes = document.querySelectorAll('.link-box');
        const data = Array.from(boxes).map(box => ({
            id: box.id,
            label: box.querySelector('input').value,
            links: box.querySelector('textarea').value
        }));
        localStorage.setItem('linkManagerData', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const data = localStorage.getItem('linkManagerData');
        if (data) {
            const parsedData = JSON.parse(data);
            boxContainer.innerHTML = ''; // Clear existing boxes
            parsedData.forEach(box => createLinkBox(box.id, box.label, box.links));
            boxCounter = parsedData.length;
        }
    }
});
