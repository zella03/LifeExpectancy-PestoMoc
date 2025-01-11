document.addEventListener('DOMContentLoaded', () => {
    const chartInfoIcon = document.querySelector('.chart-container .info-icon-container');
    const dataInfoIcon = document.querySelector('.data-sources .info-icon-container');

    
    const chartModal = document.getElementById('chartInfoModal');
    const dataModal = document.getElementById('dataInfoModal');

    console.log(dataModal)

    const closeButtons = document.querySelectorAll('.close-btn');

    console.log(closeButtons)
    chartInfoIcon.addEventListener('click', () => {
        chartModal.style.display = 'block';
    });

    dataInfoIcon.addEventListener('click', () => {
        dataModal.style.display = 'block';
    });


    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            chartModal.style.display = 'none';
            dataModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === chartModal) {
            chartModal.style.display = 'none';
        }
        if (event.target === dataModal) {
            dataModal.style.display = 'none';
        }
    });
});

