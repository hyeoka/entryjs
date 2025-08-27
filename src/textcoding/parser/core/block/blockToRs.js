/*
 * Rust code generator for EntryJS blocks
 */
'use strict';

import _includes from 'lodash/includes';

Entry.BlockToRsParser = class {
    constructor() {
        this._type = 'BlockToRsParser';
        this._funcParamMap = new Entry.Map();
        this.funcDefMap = {};

        this.globalCommentList = [];

        this._variableDeclaration = null;
        this._listDeclaration = null;
        this._forIdCharIndex = 0;
    }

    Code(code, parseMode) {
        this._parseMode = parseMode;
        if (!code) {
            return;
        }
        if (code instanceof Entry.Thread) {
            return this.Thread(code);
        }
        if (code instanceof Entry.Block) {
            return this.Block(code);
        }

        const resultTextCode = [];
        const threads = code.getThreads();

        for (let i = 0; i < threads.length; i++) {
            this._forIdCharIndex = 0;
            const thread = threads[i];

            if (thread) {
                resultTextCode.push(this.Thread(thread));
            }
        }

        return resultTextCode.join('\n').trim();
    }

    Thread(thread) {
        if (thread instanceof Entry.Block) {
            return this.Block(thread);
        }

        const blocks = thread.getBlocks();
        const textBlock = [];

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block) {
                textBlock.push(this.Block(block));
            }
        }

        return textBlock.join('\n');
    }

    Block(block) {
        const schema = Entry.block[block.type];
        if (!schema) {
            return '';
        }

        // Get Rust syntax from block schema
        let syntax = '';
        if (schema.syntax && schema.syntax.rust) {
            syntax = schema.syntax.rust[0] || '';
        }

        if (!syntax) {
            return `// TODO: Implement Rust syntax for ${block.type}`;
        }

        // Replace parameters
        return this._processSyntax(syntax, block);
    }

    _processSyntax(syntax, block) {
        // Replace parameter placeholders %1, %2, etc. with actual values
        return syntax.replace(/%(\d+)/g, (match, paramIndex) => {
            const paramIdx = parseInt(paramIndex) - 1;
            const param = block.params[paramIdx];
            if (param) {
                return this._getParamValue(param);
            }
            return match;
        });
    }

    _getParamValue(param) {
        if (param instanceof Entry.Block) {
            return this.Block(param);
        }
        if (typeof param === 'string') {
            return `"${param}"`;
        }
        if (typeof param === 'number') {
            return param.toString();
        }
        return param ? param.toString() : '0';
    }
};