document.addEventListener('DOMContentLoaded', () => {
    const generateBoxBtn = document.getElementById('generateBox');
    const exportBtn = document.getElementById('exportData');
    const importBtn = document.getElementById('importData');
    const fileInput = document.getElementById('fileInput');
    const boxContainer = document.getElementById('boxContainer');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchResultsList = document.getElementById('searchResultsList');
    let boxCounter = 0;

    generateBoxBtn.addEventListener('click', () => {
        createLinkBox();
    });

    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importData);

    // Initialize Sortable
    new Sortable(boxContainer, {
        animation: 150,
        ghostClass: 'bg-gray-100',
        onEnd: () => {
            saveToLocalStorage();
        }
    });

    // Load data from localStorage when the page loads
    loadFromLocalStorage();

    // Add search functionality
    searchInput.addEventListener('input', debounce(performSearch, 300));

    function createLinkBox(id = null, label = '', links = '') {
        boxCounter++;
        const boxId = id || `box-${boxCounter}`;
        const box = document.createElement('div');
        box.className = 'link-box bg-white p-6 rounded-lg shadow-md cursor-move';
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
        box.querySelector('input').addEventListener('input', () => saveToLocalStorage(true));
        box.querySelector('textarea').addEventListener('input', () => saveToLocalStorage(true));

        saveToLocalStorage();
    }

    window.copyLinks = (boxId) => {
        const links = document.querySelector(`#${boxId} textarea`).value;
        navigator.clipboard.writeText(links).then(() => {
            showNotification('Links copied to clipboard!');
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
            showNotification('Manipulated links copied to clipboard!');
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
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `link_manager_data_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!');
    }

    function importData(event) {
        const file = event.target.files[0];
        if (file) {
            if (confirm('Importing data will replace your current link collections. Are you sure you want to proceed?')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        boxContainer.innerHTML = ''; // Clear existing boxes
                        data.forEach(box => createLinkBox(box.id, box.label, box.links));
                        boxCounter = data.length;
                        saveToLocalStorage(); // Save imported data to localStorage
                        showNotification('Data imported successfully!');
                    } catch (error) {
                        console.error('Error importing data:', error);
                        showNotification('Error importing data. Please make sure the file is valid JSON.', 'error');
                    }
                };
                reader.readAsText(file);
            } else {
                // Reset the file input if import is cancelled
                event.target.value = '';
            }
        }
    }

    function saveToLocalStorage(debounce = false) {
        const saveData = () => {
            try {
                const boxes = document.querySelectorAll('.link-box');
                const data = Array.from(boxes).map(box => ({
                    id: box.id,
                    label: box.querySelector('input').value,
                    links: box.querySelector('textarea').value
                }));
                localStorage.setItem('linkManagerData', JSON.stringify(data));
                showNotification('Data saved successfully!');
            } catch (error) {
                console.error('Error saving data to localStorage:', error);
                showNotification('Error saving data. Please try again.', 'error');
            }
        };

        if (debounce) {
            clearTimeout(window.saveTimeout);
            window.saveTimeout = setTimeout(saveData, 1000); // Debounce for 1 second
        } else {
            saveData();
        }
    }

    function loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('linkManagerData');
            if (data) {
                const parsedData = JSON.parse(data);
                boxContainer.innerHTML = ''; // Clear existing boxes
                parsedData.forEach(box => createLinkBox(box.id, box.label, box.links));
                boxCounter = parsedData.length;
                showNotification('Data loaded successfully!');
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            showNotification('Error loading saved data. Starting with empty state.', 'error');
        }
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add clear all data functionality
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Clear All Data';
    clearAllBtn.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded inline-flex items-center ml-4';
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.removeItem('linkManagerData');
            boxContainer.innerHTML = '';
            boxCounter = 0;
            showNotification('All data cleared successfully!');
        }
    });
    document.querySelector('.flex.justify-center.mb-8.space-x-4').appendChild(clearAllBtn);

    // Implement search functionality
    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query === '') {
            searchResults.classList.add('hidden');
            return;
        }

        const boxes = document.querySelectorAll('.link-box');
        const results = [];

        boxes.forEach(box => {
            const label = box.querySelector('input').value.toLowerCase();
            const links = box.querySelector('textarea').value.toLowerCase();
            const boxId = box.id;

            if (label.includes(query) || links.includes(query)) {
                const matchedLinks = links.split('\n').filter(link => link.includes(query));
                results.push({ boxId, label, matchedLinks });
            }
        });

        displaySearchResults(results);
    }

    function displaySearchResults(results) {
        searchResultsList.innerHTML = '';
        if (results.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        results.forEach(result => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="bg-white p-4 rounded-lg shadow">
                    <h3 class="font-semibold text-lg mb-2">${result.label || 'Untitled Box'}</h3>
                    <ul class="list-disc list-inside">
                        ${result.matchedLinks.map(link => `<li>${link}</li>`).join('')}
                    </ul>
                    <button onclick="scrollToBox('${result.boxId}')" class="mt-2 text-blue-500 hover:text-blue-700">Go to Box</button>
                </div>
            `;
            searchResultsList.appendChild(li);
        });

        searchResults.classList.remove('hidden');
    }

    window.scrollToBox = (boxId) => {
        const box = document.getElementById(boxId);
        if (box) {
            box.scrollIntoView({ behavior: 'smooth', block: 'start' });
            box.classList.add('bg-yellow-100');
            setTimeout(() => {
                box.classList.remove('bg-yellow-100');
            }, 2000);
        }
    };

    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
});
