(function () {
    var display = document.getElementById('calc-display');
    var expression = '';

    function render() {
        display.value = expression === '' ? '0' : expression;
    }

    function isOperator(ch) {
        return ch === '+' || ch === '-' || ch === '*' || ch === '/';
    }

    function tokenize(input) {
        var tokens = [];
        var i = 0;
        while (i < input.length) {
            var ch = input[i];
            if (/[0-9.]/.test(ch)) {
                var start = i;
                while (i < input.length && /[0-9.]/.test(input[i])) i++;
                var numStr = input.slice(start, i);
                if ((numStr.match(/\./g) || []).length > 1 || numStr === '.') return null;
                tokens.push({ type: 'num', value: parseFloat(numStr) });
            } else if (isOperator(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
            } else {
                return null;
            }
        }
        return tokens;
    }

    // Recursive-descent parser: expr := term (('+'|'-') term)*, term := unary (('*'|'/') unary)*
    function evaluate(input) {
        var tokens = tokenize(input);
        if (!tokens || tokens.length === 0) throw new Error('Invalid');
        var pos = 0;

        function peek() { return tokens[pos]; }
        function next() { return tokens[pos++]; }

        function parseUnary() {
            var t = peek();
            if (!t) throw new Error('Invalid');
            if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
                next();
                var v = parseUnary();
                return t.value === '-' ? -v : v;
            }
            if (t.type === 'num') {
                next();
                return t.value;
            }
            throw new Error('Invalid');
        }

        function parseTerm() {
            var left = parseUnary();
            while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
                var op = next().value;
                var right = parseUnary();
                if (op === '*') {
                    left = left * right;
                } else {
                    if (right === 0) throw new Error('Divide by zero');
                    left = left / right;
                }
            }
            return left;
        }

        function parseExpr() {
            var left = parseTerm();
            while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
                var op = next().value;
                var right = parseTerm();
                left = op === '+' ? left + right : left - right;
            }
            return left;
        }

        var result = parseExpr();
        if (pos !== tokens.length || !isFinite(result)) throw new Error('Invalid');
        return result;
    }

    function formatResult(n) {
        var rounded = parseFloat(n.toPrecision(12));
        return String(rounded);
    }

    window.calcAppend = function (value) {
        if (expression === 'Error') expression = '';
        var last = expression[expression.length - 1];
        var unaryMinus = value === '-' && last !== '-';
        if (isOperator(value) && isOperator(last) && !unaryMinus) {
            expression = expression.slice(0, -1);
        }
        expression += value;
        render();
    };

    window.calcClear = function () {
        expression = '';
        render();
    };

    window.calcDelete = function () {
        if (expression === 'Error') {
            expression = '';
        } else {
            expression = expression.slice(0, -1);
        }
        render();
    };

    window.calcEvaluate = function () {
        if (expression === '' || expression === 'Error') return;
        try {
            expression = formatResult(evaluate(expression));
        } catch (e) {
            expression = 'Error';
        }
        render();
    };

    document.addEventListener('keydown', function (e) {
        if (/^[0-9.+\-*/]$/.test(e.key)) {
            window.calcAppend(e.key);
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            window.calcEvaluate();
        } else if (e.key === 'Backspace') {
            window.calcDelete();
        } else if (e.key === 'Escape') {
            window.calcClear();
        }
    });

    render();
})();
