export const UIManager = {
    show(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex';
            el.classList.remove('hidden');
        }
    },
    hide(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    },
    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },
    setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    },

};
