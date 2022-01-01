"use strict";

async function setup() {
    // console.log('Starting index page setup.')

    let stats_str = await http.get('/status');
    let stats = JSON.parse(stats_str);

    document.getElementById('fileCount').innerText = stats.files;
    document.getElementById('boilerplateCount').innerText = stats.boilerplates;
}

setup();

