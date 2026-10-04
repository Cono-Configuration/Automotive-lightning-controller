// Inputs
const state = {
    headlight: false,
    leftInd: false,
    rightInd: false,
    hazard: false,
    brake: false,
    clock: false
};

// UI Elements mapping
const els = {
    switches: {
        headlight: document.getElementById('sw-headlight'),
        leftInd: document.getElementById('sw-left'),
        rightInd: document.getElementById('sw-right'),
        hazard: document.getElementById('sw-hazard'),
        brake: document.getElementById('sw-brake')
    },
    statusBadges: {
        headlight: document.getElementById('st-headlight'),
        leftInd: document.getElementById('st-left'),
        rightInd: document.getElementById('st-right'),
        hazard: document.getElementById('st-hazard'),
        brake: document.getElementById('st-brake')
    },
    leds: {
        hlL: document.getElementById('led-hl-l'),
        hlR: document.getElementById('led-hl-r'),
        indL: document.getElementById('led-ind-l'),
        indR: document.getElementById('led-ind-r'),
        brL: document.getElementById('led-br-l'),
        brR: document.getElementById('led-br-r')
    },
    sysStatus: {
        clock: document.getElementById('sys-clock'),
        hl: document.getElementById('sys-hl'),
        il: document.getElementById('sys-il'),
        ir: document.getElementById('sys-ir'),
        haz: document.getElementById('sys-haz'),
        br: document.getElementById('sys-br'),
        exp: document.getElementById('sys-explanation')
    },
    waves: {
        clk: document.getElementById('wave-clk'),
        lind: document.getElementById('wave-lind'),
        rind: document.getElementById('wave-rind'),
        haz: document.getElementById('wave-haz')
    }
};

// Initialize event listeners
Object.keys(els.switches).forEach(key => {
    els.switches[key].addEventListener('change', (e) => {
        state[key] = e.target.checked;
        updateLogic();
    });
});

document.getElementById('btn-reset').addEventListener('click', () => {
    Object.keys(els.switches).forEach(key => {
        els.switches[key].checked = false;
        state[key] = false;
    });
    updateLogic();
});

let demoInterval;
document.getElementById('btn-demo').addEventListener('click', () => {
    runAutoDemo();
});

// Clock logic (1 Hz = 500ms ON, 500ms OFF)
setInterval(() => {
    state.clock = !state.clock;
    if (state.clock) {
        els.sysStatus.clock.classList.add('tick');
    } else {
        els.sysStatus.clock.classList.remove('tick');
    }
    updateLogic();
    updateWaveforms();
}, 500);

// Main Logic & UI Update
function updateLogic() {
    // 1. Digital Logic Equations
    const hlOut = state.headlight;
    const brOut = state.brake;
    
    // Priority logic: Hazard overrides individual indicators
    // L_OUT = (HAZARD OR L_IND) AND CLOCK
    // R_OUT = (HAZARD OR R_IND) AND CLOCK
    
    let lIndLogical = state.hazard || state.leftInd;
    let rIndLogical = state.hazard || state.rightInd;
    
    const lIndOut = lIndLogical && state.clock;
    const rIndOut = rIndLogical && state.clock;

    // 2. Update Virtual LEDs
    updateLed(els.leds.hlL, hlOut);
    updateLed(els.leds.hlR, hlOut);
    updateLed(els.leds.indL, lIndOut);
    updateLed(els.leds.indR, rIndOut);
    updateLed(els.leds.brL, brOut);
    updateLed(els.leds.brR, brOut);

    // 3. Update Status Badges (Inputs)
    updateBadge(els.statusBadges.headlight, state.headlight);
    updateBadge(els.statusBadges.leftInd, state.leftInd);
    updateBadge(els.statusBadges.rightInd, state.rightInd);
    updateBadge(els.statusBadges.hazard, state.hazard);
    updateBadge(els.statusBadges.brake, state.brake);

    // 4. Update System Status Text
    els.sysStatus.hl.textContent = state.headlight ? 'ON' : 'OFF';
    els.sysStatus.br.textContent = state.brake ? 'ON' : 'OFF';
    els.sysStatus.haz.textContent = state.hazard ? (state.clock ? 'ON' : 'OFF') : 'OFF';
    
    if (state.hazard) {
        els.sysStatus.il.textContent = state.clock ? 'ON (HAZ)' : 'OFF';
        els.sysStatus.ir.textContent = state.clock ? 'ON (HAZ)' : 'OFF';
    } else {
        els.sysStatus.il.textContent = state.leftInd ? (state.clock ? 'ON' : 'OFF') : 'OFF';
        els.sysStatus.ir.textContent = state.rightInd ? (state.clock ? 'ON' : 'OFF') : 'OFF';
    }

    // 5. Generate Explanation
    let exp = [];
    if (state.hazard) {
        exp.push("Hazard is ACTIVE. Both indicators are blinking synchronously via the clock, overriding individual controls.");
    } else if (state.leftInd && state.rightInd) {
        exp.push("Both Left and Right indicators are ACTIVE, blinking via the clock.");
    } else if (state.leftInd) {
        exp.push("Left indicator is ACTIVE. The clock signal alternates it ON/OFF.");
    } else if (state.rightInd) {
        exp.push("Right indicator is ACTIVE. The clock signal alternates it ON/OFF.");
    }
    
    if (state.headlight) exp.push("Headlights are ON.");
    if (state.brake) exp.push("Brake lights are ON.");
    
    if (exp.length === 0) {
        els.sysStatus.exp.innerHTML = "System is idle. All lights OFF.";
    } else {
        els.sysStatus.exp.innerHTML = exp.join('<br>');
    }
}

function updateLed(element, isOn) {
    if (isOn) element.classList.add('on');
    else element.classList.remove('on');
}

function updateBadge(element, isOn) {
    element.textContent = isOn ? 'ON' : 'OFF';
    if (isOn) element.classList.add('on');
    else element.classList.remove('on');
}

// Waveform recording
const MAX_WAVE_SEGMENTS = 25; // How many ticks to keep in history
let waveHistory = {
    clk: [], lind: [], rind: [], haz: []
};

function updateWaveforms() {
    // Record current logical state
    let lIndLogical = state.hazard || state.leftInd;
    let rIndLogical = state.hazard || state.rightInd;
    
    const curState = {
        clk: state.clock,
        lind: lIndLogical && state.clock,
        rind: rIndLogical && state.clock,
        haz: state.hazard && state.clock
    };

    ['clk', 'lind', 'rind', 'haz'].forEach(key => {
        waveHistory[key].push(curState[key]);
        if (waveHistory[key].length > MAX_WAVE_SEGMENTS) {
            waveHistory[key].shift();
        }
        renderWaveform(key);
    });
}

function renderWaveform(key) {
    const container = els.waves[key];
    container.innerHTML = ''; // Clear
    waveHistory[key].forEach((val, i) => {
        const seg = document.createElement('div');
        seg.className = 'wave-segment ' + (val ? 'high' : 'low');
        
        // Draw vertical rising/falling edge if needed
        if (i > 0) {
            const prev = waveHistory[key][i-1];
            if (prev !== val) {
                seg.style.borderLeft = '2px solid var(--accent)';
            }
        }
        
        container.appendChild(seg);
    });
}

// Auto Demo Sequence
function runAutoDemo() {
    // Reset first
    Object.keys(els.switches).forEach(key => {
        els.switches[key].checked = false;
        state[key] = false;
    });
    
    const steps = [
        { msg: "Demo: Turning on Headlights", state: { headlight: true }, time: 2000 },
        { msg: "Demo: Left Indicator", state: { headlight: true, leftInd: true }, time: 4000 },
        { msg: "Demo: Right Indicator", state: { headlight: true, rightInd: true }, time: 4000 },
        { msg: "Demo: Braking", state: { headlight: true, brake: true }, time: 3000 },
        { msg: "Demo: Hazard Lights (Priority Override)", state: { headlight: true, brake: true, hazard: true, leftInd: true }, time: 5000 },
        { msg: "Demo: All OFF", state: {}, time: 2000 }
    ];

    let currentStep = 0;
    
    function nextStep() {
        if (currentStep >= steps.length) return;
        
        const step = steps[currentStep];
        
        // Apply state
        Object.keys(state).forEach(key => {
            if (key !== 'clock') state[key] = false; // reset all inputs
        });
        
        if (step.state) {
            Object.keys(step.state).forEach(k => {
                state[k] = step.state[k];
            });
        }
        
        // Sync checkboxes
        Object.keys(els.switches).forEach(key => {
            els.switches[key].checked = state[key];
        });
        
        els.sysStatus.exp.innerHTML = `<strong>${step.msg}</strong>`;
        updateLogic();
        
        currentStep++;
        setTimeout(nextStep, step.time);
    }
    
    nextStep();
}

// Initial draw
updateLogic();
