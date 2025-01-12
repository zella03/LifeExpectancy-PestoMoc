document.addEventListener('DOMContentLoaded', () => {
    const chart1InfoIcon = document.querySelector('.chart1 .info-icon-container');
    const chart2InfoIcon = document.querySelector('.chart2 .info-icon-container');
    const chart3InfoIcon = document.querySelector('.chart3 .info-icon-container');
    const chart4InfoIcon = document.querySelector('.chart4 .info-icon-container');
    const chart5InfoIcon = document.querySelector('.chart5 .info-icon-container');
    const dataInfoIcon = document.querySelector('.data-sources .info-icon-container');

    const chart1Modal = document.getElementById('chart1InfoModal');
    const chart2Modal = document.getElementById('chart2InfoModal');
    const chart3Modal = document.getElementById('chart3InfoModal');
    const chart4Modal = document.getElementById('chart4InfoModal');
    const chart5Modal = document.getElementById('chart5InfoModal');
    const dataModal = document.getElementById('dataInfoModal');

    console.log(chart1InfoIcon)
    console.log(chart1Modal)

    const closeButtons = document.querySelectorAll('.close-btn');

    console.log(closeButtons)
    chart1InfoIcon.addEventListener('click', () => {
        chart1Modal.style.display = 'block';
    });

    chart2InfoIcon.addEventListener('click', () => {
        chart2Modal.style.display = 'block';
    });

    chart3InfoIcon.addEventListener('click', () => {
        chart3Modal.style.display = 'block';
    });

    chart4InfoIcon.addEventListener('click', () => {
        chart4Modal.style.display = 'block';
    });

    chart5InfoIcon.addEventListener('click', () => {
        chart5Modal.style.display = 'block';
    });
    dataInfoIcon.addEventListener('click', () => {
        dataModal.style.display = 'block';
    });


    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {

            chart1Modal.style.display = 'none';
            chart2Modal.style.display = 'none';
            chart3Modal.style.display = 'none';
            chart4Modal.style.display = 'none';
            chart5Modal.style.display = 'none';
            dataModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {

        if (event.target === chart1Modal) {
            chart1Modal.style.display = 'none';
        }
        if (event.target === chart2Modal) {
            chart2Modal.style.display = 'none';
        }
        if (event.target === chart3Modal) {
            chart3Modal.style.display = 'none';
        }
        if (event.target === chart4Modal) {
            chart4Modal.style.display = 'none';
        }
        if (event.target === chart5Modal) {
            chart5Modal.style.display = 'none';
        }
        if (event.target === dataModal) {
            dataModal.style.display = 'none';
        }

    });
});

