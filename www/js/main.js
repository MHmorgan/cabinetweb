"use strict";

function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

/*
 * Wrapper of AJAX HTTP requests with an async interface.
 */
class Http {
    constructor(host) {
        this.host = host;
    }

    async get(path) {
        let url = encodeURI(this.host + path);
        // console.log('Getting ' + url);
        return new Promise((resolve, reject) => {
            let req = new XMLHttpRequest();
            req.onload = function () {
                resolve(this.responseText);
            };
            req.open('GET', url)
            req.send();
        });
    }
}

const http = new Http('https://cabinet.hirth.dev');

/*
 * Build a partial tree for a tree-view.
 *
 * elements is an iterable of TreeElement
 * 
 * Both dir_callback and file_callback must have the signature:
 *  async function(event, element, parent)
 * 
 * Where parent is the <li> parent element of the element.
 */
async function buildTree(elements, dir_callback=null, file_callback=null) {
    const root = document.createElement('ul');

    for (const e of elements) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.innerText = await e.button_text();
        li.appendChild(btn);
        root.appendChild(li);

        if (e.is_directory()) {
            btn.className = 'dir-btn';
            if (dir_callback) {
                btn.onclick = async (ev) => await dir_callback(ev, e, li);
            }
        } else {
            btn.className = 'file-btn';
            if (file_callback) {
                btn.onclick = async (ev) => await file_callback(ev, e, li);
            }
        }
    }

    return root;
}

class TreeElement {
    async button_text() {
        throw new Error('Not implemented');
    }

    is_directory() {
        return false;
    }
}
