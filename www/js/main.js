"use strict";

/*
 * fetch() wrapper handling common fetch setup.
 */
async function cabinet_fetch(path, json=true) {
    const url = 'https://cabinet.hirth.dev' + path;
    const resp = await fetch(url, {
        method: 'GET',
        mode: 'cors',
    });
    return await (json ? resp.json() : resp.text());
}

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
