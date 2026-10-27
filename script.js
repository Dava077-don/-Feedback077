/*jslint browser*/
(function () {
    "use strict";

    var storageKey = "feedback-form-data";
    var modal;
    var form;
    var openButton;
    var closeButton;
    var submitButton;
    var statusElement;
    var lastFocusedElement;
    var modalIsOpen = false;

    function getSavedData() {
        var saved = localStorage.getItem(storageKey);

        if (saved === null) {
            return null;
        }

        try {
            return JSON.parse(saved);
        } catch (error) {
            localStorage.removeItem(storageKey);
            return null;
        }
    }

    function collectFormDataForStorage() {
        return {
            full_name: form.elements.full_name.value,
            email: form.elements.email.value,
            phone: form.elements.phone.value,
            organization: form.elements.organization.value,
            message: form.elements.message.value,
            consent: form.elements.consent.checked
        };
    }

    function saveFormData() {
        localStorage.setItem(
            storageKey,
            JSON.stringify(collectFormDataForStorage())
        );
    }

    function restoreFormData() {
        var data = getSavedData();

        if (data === null) {
            return;
        }

        form.elements.full_name.value = data.full_name || "";
        form.elements.email.value = data.email || "";
        form.elements.phone.value = data.phone || "";
        form.elements.organization.value = data.organization || "";
        form.elements.message.value = data.message || "";
        form.elements.consent.checked = data.consent === true;
    }

    function clearStatus() {
        statusElement.textContent = "";
        statusElement.className = "form-status";
    }

    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = "form-status " + type;
    }

    function setModalVisible(visible) {
        modal.hidden = !visible;
        document.body.classList.toggle("modal-open", visible);
        modalIsOpen = visible;

        if (visible) {
            lastFocusedElement = document.activeElement;
            closeButton.focus();
        } else if (lastFocusedElement !== null) {
            lastFocusedElement.focus();
        }
    }

    function openModal() {
        if (modalIsOpen) {
            return;
        }

        clearStatus();
        setModalVisible(true);

        if (window.location.hash !== "#feedback") {
            history.pushState(
                {feedback: true},
                "",
                window.location.pathname + window.location.search + "#feedback"
            );
        }
    }

    function closeModalFromInterface() {
        if (!modalIsOpen) {
            return;
        }

        if (window.location.hash === "#feedback") {
            history.back();
        } else {
            setModalVisible(false);
        }
    }

    function handlePopState() {
        if (window.location.hash === "#feedback") {
            setModalVisible(true);
        } else {
            setModalVisible(false);
        }
    }

    function handleEscape(event) {
        if (event.key === "Escape" && modalIsOpen) {
            closeModalFromInterface();
        }
    }

    function endpointIsConfigured() {
        return form.action.indexOf("YOUR_FORM_ID") === -1;
    }

    function submitForm(event) {
        var request;

        event.preventDefault();
        clearStatus();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        localStorage.removeItem(storageKey);

        if (!endpointIsConfigured()) {
            showStatus(
                "Укажите свой Formcarry Form ID в index.html перед отправкой.",
                "error"
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Отправка...";

        request = fetch(form.action, {
            method: "POST",
            headers: {
                Accept: "application/json"
            },
            body: new FormData(form)
        });

        request.then(function (response) {
            return response.json().then(function (result) {
                if (response.ok && result.code === 200) {
                    showStatus("Сообщение успешно отправлено.", "success");
                    form.reset();
                    localStorage.removeItem(storageKey);
                } else {
                    showStatus(
                        result.message || "Не удалось отправить сообщение.",
                        "error"
                    );
                }
            });
        }).catch(function () {
            showStatus(
                "Ошибка отправки. Проверьте подключение и попробуйте снова.",
                "error"
            );
        }).finally(function () {
            submitButton.disabled = false;
            submitButton.textContent = "Отправить";
        });
    }

    window.addEventListener("DOMContentLoaded", function () {
        modal = document.getElementById("feedback-modal");
        form = document.getElementById("feedback-form");
        openButton = document.getElementById("open-feedback");
        closeButton = document.getElementById("close-feedback");
        submitButton = document.getElementById("submit-button");
        statusElement = document.getElementById("form-status");

        restoreFormData();

        openButton.addEventListener("click", openModal);
        closeButton.addEventListener("click", closeModalFromInterface);
        form.addEventListener("input", saveFormData);
        form.addEventListener("change", saveFormData);
        form.addEventListener("submit", submitForm);
        window.addEventListener("popstate", handlePopState);
        document.addEventListener("keydown", handleEscape);

        modal.addEventListener("click", function (event) {
            if (event.target.hasAttribute("data-close-modal")) {
                closeModalFromInterface();
            }
        });

        if (window.location.hash === "#feedback") {
            setModalVisible(true);
        }
    });
}());
