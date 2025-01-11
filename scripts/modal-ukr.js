document.addEventListener('DOMContentLoaded', () => {
    const dataInfoIcon = document.querySelector('.data-sources .info-icon-container');
    const dataModal = document.getElementById('dataInfoModal');
    const closeButtons = document.querySelectorAll('.close-btn');

    dataInfoIcon.addEventListener('click', () => {
        dataModal.style.display = 'block';
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            dataModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === dataModal) {
            dataModal.style.display = 'none';
        }
    });
});
