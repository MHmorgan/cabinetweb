"use strict";

async function setup() {
    // console.log('Starting files page setup.')

    const dir = new Directory('/', '/');
    const files = await dir.html();
    files.className = 'tree-view';
    fileListSection.innerHTML = '';
    fileListSection.appendChild(files);

    showFileList();
}

const fileListSection = document.getElementById('file-list');
const fileViewSection = document.getElementById('file-view');

function showFileList() {
    fileViewSection.style.display = 'none';
    fileListSection.style.display = 'block';
}

function showFileView() {
    fileListSection.style.display = 'none';
    fileViewSection.style.display = 'block';
}

/********************************************************************************
 *                                                                              *
 * Entry types
 *                                                                              *
 ********************************************************************************/

class Entry extends TreeElement {
    _content = null;

    constructor(path, name) {
        super();
        this.path = path;
        this.name = name;
    }

    async button_text() {
        return this.name;
    }

    async html() {
        throw new Error('html() not implemented');
    }

    async content() {
        return this._content;
    }
}

class File extends Entry {
    constructor(path, name) {
        super(path, name);
    }

    async content() {
        if (!this._content) {
            this._content = await cabinet_fetch('/files'+this.path, false);
        }
        return this._content;
    }

    async* lines() {
        for (const line of (await this.content()).split('\n')) {
            yield line;
        }
    }

    /*
     * Get the file content formatted as plain text.
     */
    async raw_content_html() {
        const pre = document.createElement('pre');
        pre.className = 'raw-text-container';
        pre.innerText = await this.content();
        return pre;
    }

    /*
     * Get the file content formatted as code.
     */
    async code_content_html() {
        const div = document.createElement('pre');
        div.className = 'code-text-container';

        let first = true;
        for await (const line of this.lines()) {
            if (first) {
                first = false;
            } else {
                const br = document.createElement('br');
                div.appendChild(br);
            }
            const span = document.createElement('span');
            span.innerText = line;
            div.appendChild(span);
        }

        return div;
    }

    /*
     * Build and return the view for this file.
     */
    async html() {
        const make = document.createElement.bind(document);
        const root = make('div');

        /*
         * File header
         */
        const header = make('div');
        header.id = 'file-header';
        const path = make('p');
        path.id = 'file-path';
        path.innerText = this.path.replace(/\/[^/]*?$/, '');
        header.appendChild(path);
        const name = make('h2');
        name.id = 'file-name';
        name.innerText = this.name;
        header.appendChild(name);
        root.appendChild(header);

        const close = make('a');
        close.id = 'close-btn';
        close.onclick = (ev) => showFileList();
        root.appendChild(close);

        /*
         * File content elements
         */
        const file_content = make('div');
        file_content.className = 'text-container';
        const menu = make('ul');
        menu.id = 'style-menu';
        const text = make('div');
        file_content.append(menu, text);
        root.appendChild(file_content);

        /*
         * Style menu buttons
         */
        var code = make('li');
        code.innerText = 'Code';
        menu.appendChild(code);
        var raw = make('li');
        raw.innerText = 'Plain';
        menu.appendChild(raw);

        /*
         * Set default text style and add text
         */
        if (this.name.endsWith('.txt')) {
            raw.toggleAttribute('active');
            text.appendChild(await this.raw_content_html());
        } else {
            code.toggleAttribute('active');
            text.appendChild(await this.code_content_html());
        }

        /*
         * Style menu actions
         */
        code.onclick = async (ev) => {
            code.toggleAttribute('active', true);
            raw.removeAttribute('active');
            text.innerHTML = '';
            text.appendChild(await this.code_content_html());
        };
        raw.onclick = async (ev) => {
            raw.toggleAttribute('active', true);
            code.removeAttribute('active');
            text.innerHTML = '';
            text.appendChild(await this.raw_content_html());
        };

        return root;
    }
}

class Directory extends Entry {
    constructor(path, name) {
        super(path, name);
    }

    is_directory() {
        return true;
    }

    /*
     * Fetches directory content from the cabinet server.
     * Recursively fetches the content for child directories
     * without waiting for the result.
     */
    async _fetch_content() {
        const entries = await cabinet_fetch('/dirs'+this.path);
        if (!Array.isArray(entries)) {
            throw new Error('Server didnt return directory content as an array.');
        }
        const is_dir = /.*\/$/;
        this._content = entries.map((entry) => {
            const path = this.path + entry;
            if (is_dir.test(entry)) {
                const dir = new Directory(path, entry);
                /*
                 * Prefetch content of child directories.
                 * This won't run right away since we don't wait.
                 */
                dir._fetch_content();
                return dir;
            } else {
                return new File(path, entry);
            }
        });
        // console.log('Content of '+this.path+': '+this._content);
    }

    /*
     * Get the entries of this directory. Handles caching of data
     * fetched from the cabinet server.
     */
    async content() {
        if (!this._content) {
            await this._fetch_content();
        }
        return this._content;
    }

    /*
     * Build and return tree view for this directory.
     */
    async html() {
        if (!this._content) {
            await this._fetch_content();
        }
        return buildTree(
            this,
            /*
             * Directory button callback
             */
            async (event, element, parent) => {
                const ul = await element.html();
                ul.style.display = 'block';
                parent.appendChild(ul);
                // Only build the child directory once.
                // After that we hide/show the subtree.
                event.currentTarget.onclick = (ev) => {
                    const hidden = ul.style.display === 'none';
                    ul.style.display = hidden ? '' : 'none';
                }
            },
            /*
             * File button callback
             */
            async (event, element, parent) => {
                const view = await element.html();
                fileViewSection.innerHTML = '';
                fileViewSection.appendChild(view);
                showFileView();
            },
        );
    }

    /*
     * Iterate over the entries of the directory.
     */
    *[Symbol.iterator]() {
        if (!this._content) {
            throw new Error('Cannot iterate over uninitialized directory content.');
        }
        for (const e of this._content) {
            yield e;
        }
    }
}

setup();
