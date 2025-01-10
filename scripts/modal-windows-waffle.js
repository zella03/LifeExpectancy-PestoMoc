document.addEventListener('DOMContentLoaded', () => {
    const mapInfoIcon = document.querySelector('.map-container .info-icon-container');
    const chartInfoIcon = document.querySelector('.chart-container .info-icon-container');
    const chart1InfoIcon = document.querySelector('.waffle-modal .info-icon-container');
    const dataInfoIcon = document.querySelector('.data-sources .info-icon-container');

    const mapModal = document.getElementById('mapInfoModal');
    
    const chartModal = document.getElementById('chartInfoModal');
    const chart1Modal = document.getElementById('chart1InfoModal');
    const dataModal = document.getElementById('dataInfoModal');
    console.log(chart1InfoIcon)
    console.log(chart1Modal)

    const closeButtons = document.querySelectorAll('.close-btn');

    console.log(closeButtons)
    mapInfoIcon.addEventListener('click', () => {
        mapModal.style.display = 'block';
    });

    chartInfoIcon.addEventListener('click', () => {
        chartModal.style.display = 'block';
    });

    chart1InfoIcon.addEventListener('click', () => {
        chart1Modal.style.display = 'block';
    });


    dataInfoIcon.addEventListener('click', () => {
        dataModal.style.display = 'block';
    });


    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            mapModal.style.display = 'none';
            chartModal.style.display = 'none';
            chart1Modal.style.display = 'none';
            dataModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === mapModal) {
            mapModal.style.display = 'none';
        }
        if (event.target === chartModal) {
            chartModal.style.display = 'none';
        }
        if (event.target === chart1Modal) {
            chart1Modal.style.display = 'none';
        }
        if (event.target === dataModal) {
            dataModal.style.display = 'none';
        }
    });
});

