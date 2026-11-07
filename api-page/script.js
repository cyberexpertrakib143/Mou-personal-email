document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await fetch('/src/settings.json').then(res => res.json());

        const setContent = (id, property, value) => {
            const element = document.getElementById(id);
            if (element && value) element[property] = value;
        };

        setContent('versionHeader', 'textContent', (settings.header && settings.header.status) || "Online!");

        const apiContent = document.getElementById('apiContent');
        if (apiContent && Array.isArray(settings.categories)) {
            const deck = [];
            settings.categories.forEach((category) => {
                (category.items || []).sort((a, b) => a.name.localeCompare(b.name))
                    .forEach((item) => deck.push({ category: category.name, item }));
            });
            const pad2 = (n) => String(n).padStart(2, '0');
            apiContent.innerHTML = deck.map(({ category, item }, i) => `
                <div class="api-item" data-name="${item.name}" data-desc="${item.desc}">
                    <div class="api-card">
                        <div>
                            <div class="api-card-top">
                                <span class="api-card-cat">${category}</span>
                                <span class="api-card-count">${pad2(i + 1)} / ${pad2(deck.length)}</span>
                            </div>
                            <h5 class="api-card-title">${item.name}</h5>
                            <p class="api-card-desc">${item.desc}</p>
                        </div>
                        <div class="api-card-foot">
                            <code class="api-card-path">${item.path.split('?')[0]}</code>
                            <button class="get-api-btn" data-api-path="${item.path}" data-api-name="${item.name}" data-api-desc="${item.desc}">GET</button>
                        </div>
                    </div>
                </div>`).join('');
        }

        if (window.renderPortfolio) window.renderPortfolio(settings);

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                const apiItems = document.querySelectorAll('.api-item');
                apiItems.forEach(item => {
                    const name = (item.getAttribute('data-name') || '').toLowerCase();
                    const desc = (item.getAttribute('data-desc') || '').toLowerCase();
                    item.style.display = (name.includes(searchTerm) || desc.includes(searchTerm)) ? '' : 'none';
                });
            });
        }

        document.addEventListener('click', event => {
            const btn = event.target.closest('.get-api-btn');
            if (!btn) return;

            const { apiPath, apiName, apiDesc } = btn.dataset;
            const modalEl = document.getElementById('apiResponseModal');
            if (!modalEl || typeof bootstrap === 'undefined') return;
            const modal = new bootstrap.Modal(modalEl);
            const modalRefs = {
                label: document.getElementById('apiResponseModalLabel'),
                desc: document.getElementById('apiResponseModalDesc'),
                content: document.getElementById('apiResponseContent'),
                endpoint: document.getElementById('apiEndpoint'),
                spinner: document.getElementById('apiResponseLoading'),
                queryInputContainer: document.getElementById('apiQueryInputContainer'),
                submitBtn: document.getElementById('submitQueryBtn')
            };

            modalRefs.label.textContent = apiName;
            modalRefs.desc.textContent = apiDesc;
            modalRefs.content.textContent = '';
            modalRefs.endpoint.textContent = '';
            modalRefs.spinner.classList.add('d-none');
            modalRefs.content.classList.add('d-none');
            modalRefs.endpoint.classList.add('d-none');

            modalRefs.queryInputContainer.innerHTML = '';
            modalRefs.submitBtn.classList.add('d-none');

            let baseApiUrl = `${window.location.origin}${apiPath}`;
            let params = new URLSearchParams(apiPath.split('?')[1]);
            let hasParams = params.toString().length > 0;

            if (hasParams) {
                const paramContainer = document.createElement('div');
                paramContainer.className = 'param-container';

                const paramsArray = Array.from(params.keys());
                paramsArray.forEach((param, index) => {
                    const paramGroup = document.createElement('div');
                    paramGroup.className = index < paramsArray.length - 1 ? 'mb-2' : '';

                    const inputField = document.createElement('input');
                    inputField.type = 'text';
                    inputField.className = 'form-control';
                    inputField.placeholder = `Enter ${param}...`;
                    inputField.dataset.param = param;
                    inputField.required = true;
                    inputField.addEventListener('input', validateInputs);

                    paramGroup.appendChild(inputField);
                    paramContainer.appendChild(paramGroup);
                });

                const currentItem = (settings.categories || [])
                    .flatMap(category => category.items || [])
                    .find(item => item.path === apiPath);

                if (currentItem && currentItem.innerDesc) {
                    const innerDescDiv = document.createElement('div');
                    innerDescDiv.className = 'text-muted mt-2';
                    innerDescDiv.style.fontSize = '13px';
                    innerDescDiv.innerHTML = currentItem.innerDesc.replace(/\n/g, '<br>');
                    paramContainer.appendChild(innerDescDiv);
                }

                modalRefs.queryInputContainer.appendChild(paramContainer);
                modalRefs.submitBtn.classList.remove('d-none');

                modalRefs.submitBtn.onclick = async () => {
                    const inputs = modalRefs.queryInputContainer.querySelectorAll('input');
                    const newParams = new URLSearchParams();
                    let isValid = true;

                    inputs.forEach(input => {
                        if (!input.value.trim()) {
                            isValid = false;
                            input.classList.add('is-invalid');
                        } else {
                            input.classList.remove('is-invalid');
                            newParams.append(input.dataset.param, input.value.trim());
                        }
                    });

                    if (!isValid) {
                        modalRefs.content.textContent = 'Please fill in all required fields.';
                        modalRefs.content.classList.remove('d-none');
                        return;
                    }

                    const apiUrlWithParams = `${window.location.origin}${apiPath.split('?')[0]}?${newParams.toString()}`;
                    modalRefs.queryInputContainer.innerHTML = '';
                    modalRefs.submitBtn.classList.add('d-none');
                    handleApiRequest(apiUrlWithParams, modalRefs, apiName);
                };
            } else {
                handleApiRequest(baseApiUrl, modalRefs, apiName);
            }

            modal.show();
        });

        function validateInputs() {
            const submitBtn = document.getElementById('submitQueryBtn');
            const inputs = document.querySelectorAll('.param-container input');
            const isValid = Array.from(inputs).every(input => input.value.trim() !== '');
            if (submitBtn) submitBtn.disabled = !isValid;
        }

        async function handleApiRequest(apiUrl, modalRefs, apiName) {
            modalRefs.spinner.classList.remove('d-none');
            modalRefs.content.classList.add('d-none');

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.startsWith('image/')) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = apiName;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';

                    modalRefs.content.innerHTML = '';
                    modalRefs.content.appendChild(img);
                } else {
                    const data = await response.json();
                    modalRefs.content.textContent = JSON.stringify(data, null, 2);
                }

                modalRefs.endpoint.textContent = apiUrl;
                modalRefs.endpoint.classList.remove('d-none');
            } catch (error) {
                modalRefs.content.textContent = `Error: ${error.message}`;
            } finally {
                modalRefs.spinner.classList.add('d-none');
                modalRefs.content.classList.remove('d-none');
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
});
