function displayPopup( type, text ) {
    if ( !currentPopup() ) {
        var blocker = document.createElement( "div" );
        blocker.id = "popupBlocker";
        var popup = document.createElement( "div" );
        popup.id = "popupDiv";

        if ( type === "success" ) {
            popup.onclick = advanceScenario;            
            popup.innerHTML += "<h1>Success!</h1>";
            popup.innerHTML += text + "<br />";
            popup.innerHTML += "<br /> Click here to proceed.";            
        } else if ( type === "failure" ) {
            popup.onclick = resetScenario;            
            popup.innerHTML += "<h1>Objective failed.</h1>";
            popup.innerHTML += text + "<br />";
            popup.innerHTML += "<br /> Click here to try again.";            
        }

        document.body.appendChild( blocker );
        document.body.appendChild( popup );
    }
}

function removePopup() {
    var popup = currentPopup();
    if ( popup ) {
        var blocker = document.getElementById( "popupBlocker" );
        document.body.removeChild( popup );
        document.body.removeChild( blocker );
    }
}

function currentPopup() {
    return document.getElementById( "popupDiv" );
}

//@ sourceURL=source/popupManager.js