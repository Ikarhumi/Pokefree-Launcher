function showLoad() {
    if (document.getElementById('loading-msg').innerHTML == "Chargement .") {
        document.getElementById('loading-msg').innerHTML = 'Chargement ..';
    } else if (document.getElementById('loading-msg').innerHTML == "Chargement ..") {
        document.getElementById('loading-msg').innerHTML = 'Chargement ...';
    } else if (document.getElementById('loading-msg').innerHTML == "Chargement ...") {
        document.getElementById('loading-msg').innerHTML = 'Chargement .';
    }
    setTimeout(showLoad, 250);
}

showLoad();