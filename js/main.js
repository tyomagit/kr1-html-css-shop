// Шапка закреплена вверху: высота хранится в CSS-переменной для якорей и «липкого» фильтра.
const siteHeader = document.querySelector('.site-header');

if (siteHeader) {
  const root = document.documentElement;
  let scrollTicking = false;

  function syncHeaderHeight() {
    root.style.setProperty('--header-height', `${siteHeader.offsetHeight}px`);
  }

  function syncHeaderShadow() {
    siteHeader.classList.toggle('site-header--stuck', window.scrollY > 8);
    scrollTicking = false;
  }

  syncHeaderHeight();
  syncHeaderShadow();
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(syncHeaderShadow);
    }
  }, { passive: true });
  // Шрифты и перенос пунктов меню меняют высоту шапки.
  if ('ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  if (document.fonts) document.fonts.ready.then(syncHeaderHeight);
}

// Классы отвечают за оформление, data-product — за действие кнопки.
const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const selectedProductInput = document.getElementById('selected-product');
const successMessage = document.getElementById('success-message');
const closeDialogButton = document.getElementById('close-order-dialog');

if (orderDialog) {
  document.querySelectorAll('[data-product]').forEach((button) => {
    button.addEventListener('click', () => {
      orderForm.reset();
      selectedProductInput.value = button.dataset.product;
      document.getElementById('order-topic').value = 'product';
      successMessage.hidden = true;
      orderDialog.showModal();
    });
  });

  closeDialogButton.addEventListener('click', () => {
    orderDialog.close();
  });
}

if (orderForm) {
  // Состояние ошибки получает модификатор того же БЭМ-элемента.
  function setFieldError(field, invalid) {
    field.setAttribute('aria-invalid', String(invalid));
    ['input', 'select', 'textarea', 'checkbox'].forEach((type) => {
      if (field.classList.contains('order-form__' + type)) {
        field.classList.toggle('order-form__' + type + '--error', invalid);
      }
    });
  }

  orderForm.addEventListener('input', (event) => {
    if (event.target.hasAttribute('aria-invalid')) {
      setFieldError(event.target, !event.target.checkValidity());
    }
    successMessage.hidden = true;
  });

  orderForm.addEventListener('reset', () => {
    Array.from(orderForm.elements).forEach((field) => {
      if (field.willValidate) {
        setFieldError(field, false);
        field.removeAttribute('aria-invalid');
      }
    });
    successMessage.hidden = true;
  });

  orderForm.addEventListener('submit', (event) => {
    // Backend не подключён: персональные данные никуда не отправляются.
    event.preventDefault();
    successMessage.hidden = true;
    Array.from(orderForm.elements).forEach((field) => {
      if (field.willValidate) setFieldError(field, !field.checkValidity());
    });

    if (!orderForm.checkValidity()) {
      orderForm.reportValidity();
      return;
    }

    orderForm.reset();
    if (orderDialog) orderDialog.close();
    successMessage.hidden = false;
    // В диалоге браузер возвращает фокус на кнопку открытия.
    if (!orderDialog) successMessage.focus();
  });
}

// Фильтр работает с данными карточек; несколько категорий объединяются по «или».
const catalogFilters = document.querySelector('[data-catalog-filters]');

if (catalogFilters) {
  const catalogGrid = document.querySelector('[data-catalog-grid]');
  const catalogCards = Array.from(catalogGrid.querySelectorAll('[data-category][data-price]'));
  const catalogCount = document.querySelector('[data-catalog-count]');
  const catalogEmpty = document.querySelector('[data-catalog-empty]');
  const catalogSort = document.querySelector('[data-catalog-sort]');
  const priceFrom = catalogFilters.elements.namedItem('price-from');
  const priceTo = catalogFilters.elements.namedItem('price-to');
  const filterError = document.getElementById('filter-error');
  // Сортировка сохраняет уже применённый отбор до следующего нажатия «Применить».
  let activeCategories = [];
  let minimumPrice = 0;
  let maximumPrice = Infinity;

  function clearPriceError() {
    priceTo.setCustomValidity('');
    priceTo.removeAttribute('aria-invalid');
    priceTo.removeAttribute('aria-describedby');
    filterError.hidden = true;
    filterError.textContent = '';
  }

  function renderCatalog() {
    const orderedCards = catalogCards.slice();
    const sort = catalogSort.value;
    if (sort === 'price-asc' || sort === 'price-desc') {
      orderedCards.sort((a, b) => (Number(a.dataset.price) - Number(b.dataset.price)) * (sort === 'price-asc' ? 1 : -1));
    } else if (sort === 'name') {
      orderedCards.sort((a, b) => a.querySelector('.product-card__title').textContent.localeCompare(b.querySelector('.product-card__title').textContent, 'ru'));
    }
    let visibleCount = 0;
    orderedCards.forEach((card) => {
      const price = Number(card.dataset.price);
      const matchesCategory = activeCategories.length === 0 || activeCategories.includes(card.dataset.category);
      const matchesPrice = price >= minimumPrice && price <= maximumPrice;
      card.hidden = !(matchesCategory && matchesPrice);
      if (!card.hidden) visibleCount += 1;
      catalogGrid.append(card);
    });
    catalogCount.textContent = `Показано ${visibleCount} из ${catalogCards.length}`;
    catalogEmpty.hidden = visibleCount !== 0;
    catalogGrid.hidden = visibleCount === 0;
  }

  catalogFilters.addEventListener('input', clearPriceError);
  catalogFilters.addEventListener('submit', (event) => {
    event.preventDefault();
    clearPriceError();
    if (!catalogFilters.reportValidity()) return;
    const from = priceFrom.value === '' ? 0 : Number(priceFrom.value);
    const to = priceTo.value === '' ? Infinity : Number(priceTo.value);
    if (from > to) {
      const message = 'Цена «До» должна быть не меньше цены «От».';
      priceTo.setCustomValidity(message);
      priceTo.setAttribute('aria-invalid', 'true');
      priceTo.setAttribute('aria-describedby', 'filter-error');
      filterError.textContent = message;
      filterError.hidden = false;
      priceTo.reportValidity();
      return;
    }
    activeCategories = Array.from(catalogFilters.querySelectorAll('[name="category"]:checked'), (checkbox) => checkbox.value);
    minimumPrice = from;
    maximumPrice = to;
    renderCatalog();
  });

  catalogSort.addEventListener('change', renderCatalog);
  catalogFilters.addEventListener('reset', () => {
    clearPriceError();
    activeCategories = [];
    minimumPrice = 0;
    maximumPrice = Infinity;
    catalogSort.value = 'default';
    renderCatalog();
  });
  document.querySelector('[data-catalog-reset]').addEventListener('click', () => {
    catalogFilters.reset();
    catalogFilters.querySelector('[type="reset"]').focus();
  });
  renderCatalog();
}
