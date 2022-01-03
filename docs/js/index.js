"use strict";

async function setup() {
    // console.log('Starting index page setup.')
    let stats = await cabinet_fetch('/status');
    document.getElementById('fileCount').innerText = stats.files;
    document.getElementById('boilerplateCount').innerText = stats.boilerplates;
}

setup();

