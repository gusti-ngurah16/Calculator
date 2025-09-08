; (() => {
    const html = document.documentElement
    const app = document.getElementById('app')
    const expEl = document.getElementById('exp')
    const outEl = document.getElementById('out')
    const copyBtn = document.getElementById('copy')
    const toast = document.getElementById('toast')
    const themeSwitch = document.getElementById('theme')

    const state = {
        a: null,      
        b: null,      
        op: null,     
        overwrite: true, 
    }

    const fmt = (n) => {
        if (!isFinite(n)) return 'Error'
        const s = Number(n)
        
        let str = s.toLocaleString(undefined, {
            maximumFractionDigits: 10,
        })
        return str
    }

    const setOutput = (text) => { outEl.textContent = text }
    const getOutputRaw = () => outEl.textContent.replace(/,/g, '')

    const setExpression = (a, op, b) => {
        const A = (a ?? '') !== '' ? fmt(a) : ''
        const B = (b ?? '') !== '' ? fmt(b) : ''
        expEl.textContent = `${A} ${op ?? ''} ${B}`.trim()
        if (!expEl.textContent) expEl.innerHTML = '&nbsp;'
    }

    const ripple = (btn, e) => {
        const rect = btn.getBoundingClientRect()
        btn.style.setProperty('--x', `${e.clientX - rect.left}px`)
        btn.style.setProperty('--y', `${e.clientY - rect.top}px`)
        btn.classList.add('is-rippling', 'is-press')
        setTimeout(() => btn.classList.remove('is-rippling', 'is-press'), 180)
    }

    const press = (selector) => {
        const btn = document.querySelector(selector)
        if (btn) { btn.classList.add('is-press'); setTimeout(() => btn.classList.remove('is-press'), 100) }
    }

    const clearAll = () => {
        state.a = null; state.b = null; state.op = null; state.overwrite = true
        setOutput('0'); setExpression(null, null, null)
    }

    const inputNum = (digit) => {
        const current = getOutputRaw()
        if (state.overwrite || current === 'Error') {
            setOutput(digit === '.' ? '0.' : digit)
            state.overwrite = false
            return
        }
        if (digit === '.' && current.includes('.')) return
        if (current.replace('-', '').length >= 16) return 
        setOutput(current + digit)
    }

    const chooseOp = (op) => {
        const n = Number(getOutputRaw())
        if (state.a === null) { state.a = n }
        else if (!state.overwrite) { state.b = n; compute() }
        state.op = op
        state.overwrite = true
        setExpression(state.a, state.op, null)
    }

    const compute = () => {
        const a = Number(state.a)
        const b = Number(state.b ?? getOutputRaw())
        if (state.op == null || isNaN(a) || isNaN(b)) return
        let res = 0
        switch (state.op) {
            case '+': res = a + b; break
            case '-': res = a - b; break
            case '*': res = a * b; break
            case '/': res = b === 0 ? NaN : a / b; break
        }
        setOutput(fmt(res))
        state.a = res; state.b = null; state.overwrite = true
        setExpression(state.a, state.op, b)
    }

    const del = () => {
        const s = getOutputRaw()
        if (state.overwrite) return
        if (s.length <= 1 || (s.startsWith('-') && s.length === 2)) { setOutput('0'); state.overwrite = true; return }
        setOutput(s.slice(0, -1))
    }

    const percent = () => {
        const n = Number(getOutputRaw())
        const p = n / 100
        setOutput(fmt(p))
        state.overwrite = true
    }

    const negate = () => {
        const n = Number(getOutputRaw())
        setOutput(fmt(-n))
    }

   
    app.addEventListener('click', (e) => {
        const t = e.target.closest('.btn')
        if (!t) return
        ripple(t, e)
        if (t.dataset.num != null) return inputNum(t.dataset.num)
        if (t.dataset.op) return chooseOp(t.dataset.op)
        const key = t.dataset.key
        if (key === 'equal') return compute()
        if (key === 'clear') return clearAll()
        if (key === 'del') return del()
        if (key === 'percent') return percent()
        if (key === 'neg') return negate()
        if (key === 'dot') return inputNum('.')
    })

    
    const keymap = {
        '+': () => chooseOp('+'),
        '-': () => chooseOp('-'),
        '*': () => chooseOp('*'),
        '/': () => chooseOp('/'),
        'Enter': () => compute(),
        '=': () => compute(),
        'Backspace': () => del(),
        'Delete': () => clearAll(),
        '%': () => percent(),
    }
    window.addEventListener('keydown', (e) => {
        if (e.key.match(/^[0-9]$/)) { inputNum(e.key); press(`.btn[data-num="${e.key}"]`); return }
        if (e.key === '.') { inputNum('.'); press('.btn[data-key="dot"]'); return }
        if (keymap[e.key]) { keymap[e.key](); press(`.btn[title], .btn[data-key], .btn.op`); }
        if (['+', '-', '*', '/'].includes(e.key)) press(`.btn.op[data-op="${e.key}"]`)
        if (e.key === 'Enter' || e.key === '=') press('.btn.primary')
        if (e.key === 'Backspace') press('.btn.danger')
    })

    let holdTimer = null
    document.querySelector('[data-key="del"]').addEventListener('pointerdown', () => {
        holdTimer = setTimeout(() => { clearAll(); press('.btn.util[data-key="clear"]') }, 500)
    })
    window.addEventListener('pointerup', () => { clearTimeout(holdTimer) })

    const applyTheme = (light) => {
        document.body.classList.toggle('theme--light', light)
        themeSwitch.setAttribute('aria-checked', light ? 'true' : 'false')
        localStorage.setItem('calc-theme', light ? 'light' : 'dark')
    }
    themeSwitch.addEventListener('click', () => {
        const on = themeSwitch.getAttribute('aria-checked') !== 'true'
        applyTheme(on)
    })
    const saved = localStorage.getItem('calc-theme')
    applyTheme(saved === 'light')

    clearAll()
})()

