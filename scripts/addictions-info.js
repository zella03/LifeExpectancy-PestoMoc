var modal = document.getElementById("dataInfoModal");
var modal0 = document.getElementById("chart0InfoModal");
var modal1 = document.getElementById("chart1InfoModal");
var modal2 = document.getElementById("chart2InfoModal");
var modal3 = document.getElementById("chart3InfoModal");
var modal4 = document.getElementById("chart4InfoModal");

var btn = document.getElementById("data-sources-link");
var btn0 = document.getElementById("chart0-link");
var btn1 = document.getElementById("chart1-link");
var btn2 = document.getElementById("chart2-link");
var btn3 = document.getElementById("chart3-link");
var btn4 = document.getElementById("chart4-link");

var span = document.getElementsByClassName("close-btn")[0];
var span0 = document.getElementsByClassName("close-btn")[1];
var span1 = document.getElementsByClassName("close-btn")[2];
var span2 = document.getElementsByClassName("close-btn")[3];
var span3 = document.getElementsByClassName("close-btn")[4];
var span4 = document.getElementsByClassName("close-btn")[5];

btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

btn0.onclick = function() {
    modal0.style.display = "block";
}

span0.onclick = function() {
    modal0.style.display = "none";
}

btn1.onclick = function() {
    modal1.style.display = "block";
}

span1.onclick = function() {
    modal1.style.display = "none";
}

btn2.onclick = function() {
    modal2.style.display = "block";
}

span2.onclick = function() {
    modal2.style.display = "none";
}

btn3.onclick = function() {
    modal3.style.display = "block";
}

span3.onclick = function() {
    modal3.style.display = "none";
}

btn4.onclick = function() {
    modal4.style.display = "block";
}

span4.onclick = function() {
    modal4.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    } else if (event.target == modal0) {
        modal0.style.display = "none";
    } else if (event.target == modal1) {
        modal1.style.display = "none";
    } else if (event.target == modal2) {
        modal2.style.display = "none";
    } else if (event.target == modal3) {
        modal3.style.display = "none";
    } else if (event.target == modal4) {
        modal4.style.display = "none";
    }
}
