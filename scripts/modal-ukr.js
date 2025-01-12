document.addEventListener('DOMContentLoaded', () => {
    const dataInfoIcon = document.querySelector('.data-sources .info-icon-container');
    const chartInfoIcon = document.querySelector('.chart-container .info-icon-container');
    const dataModal = document.getElementById('dataInfoModal');
    const chartModal = document.getElementById('chartInfoModal');
    const closeButtons = document.querySelectorAll('.close-btn');

    dataInfoIcon.addEventListener('click', () => {
        dataModal.style.display = 'block';
    });

    chartInfoIcon.addEventListener('click', () => {
        chartModal.style.display = 'block';
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            dataModal.style.display = 'none';
            chartModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === dataModal) {
            dataModal.style.display = 'none';
        }
        if (event.target === chartModal) {
            chartModal.style.display = 'none';
        }
    });
});
