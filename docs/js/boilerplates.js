"use strict";

async function setup() {
    // console.log('Starting boilerplates page setup');

    const boilerplates = (await cabinet_fetch('/boilerplates')).map((name) => new Boilerplate(name));
    // console.log(boilerplates);
    const bpList = await buildTree(
        boilerplates,
        null,
        async (event, element, parent) => {
            const view = await element.html();
            boilerplateViewSection.innerHTML = '';
            boilerplateViewSection.appendChild(view);
            showBoilerplateView();
        },
    );
    bpList.className = 'tree-view';
    boilerplateListSection.innerHTML = '';
    boilerplateListSection.appendChild(bpList);
    showBoilerplateList();
}

const boilerplateListSection = document.getElementById('boilerplate-list');
const boilerplateViewSection = document.getElementById('boilerplate-view');

function showBoilerplateList() {
    boilerplateViewSection.style.display = 'none';
    boilerplateListSection.style.display = 'block';
}

function showBoilerplateView() {
    boilerplateListSection.style.display = 'none';
    boilerplateViewSection.style.display = 'block';
}

class Boilerplate extends TreeElement {
    _content = null;

    constructor(name) {
        super();
        this.name = name;
    }

    async button_text() {
        return this.name;
    }

    async content() {
        if (!this._content) {
            this._content = await cabinet_fetch('/boilerplates/' + this.name);
        }
        return this._content;
    }

    async html() {
        const make = document.createElement.bind(document);

        const header = make('div');
        header.id = 'boilerplate-header';
        const name = make('h2');
        name.innerText = this.name;
        header.appendChild(name);

        const close = make('a');
        close.id = 'close-btn';
        close.onclick = (ev) =>  showBoilerplateList();
        header.appendChild(close);


        const table = make('table');
        const row = make('tr');
        const title1 = make('th');
        title1.innerText = 'Client path';
        const title2 = make('th');
        title2.innerText = 'Server path';
        row.append(title1, title2);
        table.appendChild(row);

        const entries = Object.entries(await this.content());
        for (const [client_path, server_path] of entries) {
            const row = make('tr');
            const client_col = make('td');
            client_col.innerText = client_path;
            const server_col = make('td');
            server_col.innerText = server_path;
            row.append(client_col, server_col);
            table.appendChild(row);
        }

        const root = make('div');
        root.append(
            header,
            table,
        );
        return root;
    }
}

setup();
