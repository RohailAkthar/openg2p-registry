document.addEventListener("DOMContentLoaded", function () {
    const alltable = document.getElementById("newreimbursements");
    if (!alltable) return;

    const allheadercells = alltable.querySelectorAll("th");
    const allRows = Array.from(alltable.querySelectorAll("tbody tr"));
    const tbody = alltable.getElementsByTagName("tbody");
    const itemsPerPage = 7;
    const maxVisiblePages = 5;
    let currentPage = 1;
    let filteredRows = allRows;

    function isSwahili() {
        const lang = document.documentElement.lang || "";
        const cookie = document.cookie || "";
        const navbarText = document.body.innerText || "";
        
        return lang.includes('sw') || 
               window.location.pathname.includes('/sw/') ||
               cookie.includes('frontend_lang=sw') ||
               navbarText.includes('SWAHILI');
    }

    function showPage(page) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const rows = filteredRows.slice(startIndex, endIndex);

        // Hide all rows
        allRows.forEach((row) => (row.style.display = "none"));
        // Show rows for current page
        rows.forEach((row) => (row.style.display = ""));
    }

    function updatePaginationButtons() {
        const pageButtonsContainer = document.getElementById("page-buttons");
        if (!pageButtonsContainer) return;

        const buttons = pageButtonsContainer.querySelectorAll("button");
        buttons.forEach((button) => {
            button.classList.remove("active");
            if (Number(button.textContent) === currentPage) {
                button.classList.add("active");
            }
        });

        const prevButton = pageButtonsContainer.querySelector("button:first-child");
        const nextButton = pageButtonsContainer.querySelector(".next-button");

        if (prevButton) prevButton.disabled = currentPage === 1;
        if (nextButton) nextButton.disabled = currentPage === Math.ceil(filteredRows.length / itemsPerPage);
    }

    function applySearchFilter(searchValue) {
        const searchLower = searchValue.toLowerCase().trim();

        filteredRows = allRows.filter((row) => {
            // Collect all cell values by data-search-field attribute
            const nameCells = Array.from(row.querySelectorAll('[data-search-field="name"]'));
            const nameValue = nameCells.map(c => c.innerText.toLowerCase()).join(' ').trim();

            const zanIdCell = row.querySelector('[data-search-field="zanid"]');
            const zanIdValue = zanIdCell ? zanIdCell.innerText.toLowerCase().trim() : "";

            const genderCell = row.querySelector('[data-search-field="gender"]');
            const genderValue = genderCell ? genderCell.innerText.toLowerCase().trim() : "";

            const lastUpdateCell = row.querySelector('[data-search-field="last_update"]');
            const lastUpdateValue = lastUpdateCell ? lastUpdateCell.innerText.toLowerCase().trim() : "";

            // Logic for exact match on gender to prevent "male" matching "female"
            let isGenderMatch = false;
            if (searchLower === 'male' || searchLower === 'female') {
                isGenderMatch = (genderValue === searchLower);
            } else if (searchLower) {
                isGenderMatch = genderValue.includes(searchLower);
            }

            return (
                (nameValue && nameValue.includes(searchLower)) ||
                (zanIdValue && zanIdValue.includes(searchLower)) ||
                isGenderMatch ||
                (lastUpdateValue && lastUpdateValue.includes(searchLower))
            );
        });
    }

    function renderPageButtons() {
        const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
        const pageButtonsContainer = document.getElementById("page-buttons");
        if (!pageButtonsContainer) return;

        pageButtonsContainer.innerHTML = "";

        // Add previous page button
        const prevButton = document.createElement("button");
        prevButton.innerHTML = '<i class="fa fa-angle-left"></i>';
        prevButton.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
                updatePaginationButtons();
                renderPageButtons();
            }
        });
        pageButtonsContainer.appendChild(prevButton);

        // Add page buttons with limited visibility
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement("button");
            button.textContent = i;
            if (i === currentPage) {
                button.classList.add("active");
            }

            button.addEventListener("click", function () {
                currentPage = i;
                showPage(currentPage);
                updatePaginationButtons();
                renderPageButtons();
            });

            pageButtonsContainer.appendChild(button);
        }

        // Add next page button
        const nextButton = document.createElement("button");
        nextButton.innerHTML = '<i class="fa fa-angle-right"></i>';
        nextButton.classList.add("next-button");
        nextButton.addEventListener("click", function () {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
                updatePaginationButtons();
                renderPageButtons();
            }
        });
        pageButtonsContainer.appendChild(nextButton);

        updatePaginationButtons();
    }

    function compareCellValues(a, b, columnIndex) {
        const aCellValue = a.cells[columnIndex].textContent.trim().replace(/,/g, "");
        const bCellValue = b.cells[columnIndex].textContent.trim().replace(/,/g, "");
        const aNumber = parseFloat(aCellValue);
        const bNumber = parseFloat(bCellValue);

        if (!isNaN(aNumber) && !isNaN(bNumber)) {
            return aNumber - bNumber;
        }

        return aCellValue.localeCompare(bCellValue);
    }

    allheadercells.forEach(function (th) {
        let sortOrder = "asc";
        th.addEventListener("click", function () {
            const columnIndex = th.cellIndex;
            allRows.sort(function (a, b) {
                let comparison = compareCellValues(a, b, columnIndex);

                if (sortOrder === "desc") {
                    comparison *= -1;
                }
                return comparison;
            });

            sortOrder = sortOrder === "asc" ? "desc" : "asc";
            allRows.forEach((row) => {
                alltable.tBodies[0].appendChild(row);
            });
            currentPage = 1;
            showPage(currentPage);
            renderPageButtons();
        });
    });

    const searchResultCount = document.getElementById("search-result-count");
    const searchInputText = document.getElementById("search-text");
    const searchClearText = document.getElementById("search-text-clear");
    const totalRecordsDisplay = document.getElementById("total-records-count");
    const initialTotalCount = allRows.length;

    if (searchClearText) searchClearText.style.display = "none";

    function handleSearch() {
        if (!searchInputText) return;
        var searchValue = searchInputText.value;

        if (typeof searchValue === "string") {
            searchValue = searchValue.toLowerCase();
        }

        if (searchValue) {
            applySearchFilter(searchValue);
            currentPage = 1;
            showPage(currentPage);
            renderPageButtons();
            // Update search result count feedback
            if (totalRecordsDisplay) {
                totalRecordsDisplay.textContent = isSwahili() ? `Imepatikana ${filteredRows.length} kati ya ${initialTotalCount} Rekodi` : `Found ${filteredRows.length} of ${initialTotalCount} Records`;
            }
        } else {
            filteredRows = allRows;
            currentPage = 1;
            showPage(currentPage);
            renderPageButtons();
            // Clear search result count feedback
            if (searchResultCount) searchResultCount.textContent = "";
            if (totalRecordsDisplay) {
                totalRecordsDisplay.textContent = isSwahili() ? `${initialTotalCount} Rekodi` : `${initialTotalCount} Records`;
            }
        }

        if (searchClearText) searchClearText.style.display = searchValue ? "block" : "none";
    }

    if (searchInputText) searchInputText.addEventListener("input", handleSearch);

    if (searchClearText) {
        searchClearText.addEventListener("click", function () {
            searchInputText.value = "";
            handleSearch();
        });
    }

    document.addEventListener("click", function (event) {
        if (searchInputText && searchClearText) {
            if (event.target !== searchInputText && event.target !== searchClearText) {
                searchClearText.style.display = searchInputText.value ? "block" : "none";
            }
        }
    });

    // Initial setup
    if (totalRecordsDisplay) {
        totalRecordsDisplay.textContent = isSwahili() ? `${initialTotalCount} Rekodi` : `${initialTotalCount} Records`;
    }
    showPage(currentPage);
    renderPageButtons();
});
