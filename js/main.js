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
