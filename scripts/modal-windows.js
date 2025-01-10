document.addEventListener('DOMContentLoaded', () => {
    const mapInfoIcon = document.querySelector('.map-container .info-icon');
    const chartInfoIcon = document.querySelector('.chart-container .info-icon');

    const mapModal = document.getElementById('mapInfoModal');
    const chartModal = document.getElementById('chartInfoModal');

    const closeButtons = document.querySelectorAll('.close-btn');

    mapInfoIcon.addEventListener('click', () => {
        mapModal.style.display = 'block';
    });

    chartInfoIcon.addEventListener('click', () => {
        chartModal.style.display = 'block';
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            mapModal.style.display = 'none';
            chartModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === mapModal) {
            mapModal.style.display = 'none';
        }
        if (event.target === chartModal) {
            chartModal.style.display = 'none';
        }
    });
});

