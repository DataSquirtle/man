let currentTurn = 1;
let p1HP = 30;
let p2HP = 30;

// Zone adjacency mapping
function getZoneRelation(attackZone, blockZone) {
  if (attackZone === blockZone) return 'same';
  
  if (attackZone === 'High' && blockZone === 'Mid') return 'adjacent';
  if (attackZone === 'Mid' && (blockZone === 'High' || blockZone === 'Low')) return 'adjacent';
  if (attackZone === 'Low' && blockZone === 'Mid') return 'adjacent';
  
  return 'opposite';
}

function updateHP() {
  const p1El = document.getElementById('p1hp');
  const p2El = document.getElementById('p2hp');

  p1El.textContent = p1HP;
  p2El.textContent = p2HP;

  p1El.className = 'hp-display' + (p1HP <= 8 ? ' low' : '');
  p2El.className = 'hp-display' + (p2HP <= 8 ? ' low' : '');

  document.getElementById('turnBanner').textContent =
    'Player ' + currentTurn + ' Attacks';

  checkWin();
}

function checkWin() {
  if (p1HP <= 0 || p2HP <= 0) {
    const winner = p1HP <= 0 ? 'Player 2' : 'Player 1';
    document.getElementById('winText').textContent = winner + ' Wins!';
    document.getElementById('winOverlay').style.display = 'flex';
  }
}

function changeHP(player, amount) {
  if (player === 1) p1HP = Math.max(0, p1HP + amount);
  else p2HP = Math.max(0, p2HP + amount);
  updateHP();
}

function getValues() {
  const cardPool = parseInt(document.getElementById('cardPool').value) || 0;
  const speed = parseInt(document.getElementById('speed').value) || 0;
  const damage = parseInt(document.getElementById('damage').value) || 0;
  const blockMod = parseInt(document.getElementById('blockMod').value) || 0;
  const noBlock = document.getElementById('noBlock').checked;
  const throwAttack = document.getElementById('throw').checked;
  const attackZone = document.getElementById('attackZone').value;
  const blockZone = document.getElementById('blockZone').value;
  
  const zoneRelation = getZoneRelation(attackZone, blockZone);
  
  return { cardPool, speed, damage, blockMod, noBlock, throwAttack, attackZone, blockZone, zoneRelation };
}

function updateSanityCheck() {
  const v = getValues();
  let requiredCheck = v.cardPool + v.speed;
  if (!v.noBlock) {
    requiredCheck += v.blockMod;
  }
  
  const sanityEl = document.getElementById('sanityValue');
  sanityEl.textContent = requiredCheck + '+';
  
  // Color code based on difficulty
  sanityEl.className = 'sanity-value';
  if (requiredCheck >= 10) {
    sanityEl.classList.add('high');
  } else if (requiredCheck >= 7) {
    sanityEl.classList.add('medium');
  }
}

function updateZoneColors() {
  const attackZone = document.getElementById('attackZone');
  const blockZone = document.getElementById('blockZone');
  
  // Visual feedback for zones
  attackZone.style.borderColor = attackZone.value === 'High' ? '#ff4444' : 
                                   attackZone.value === 'Mid' ? '#ff8844' : '#ffdd44';
  blockZone.style.borderColor = blockZone.value === 'High' ? '#ff4444' : 
                                  blockZone.value === 'Mid' ? '#ff8844' : '#ffdd44';
}

function applyDamage(dmg) {
  if (currentTurn === 1) p2HP = Math.max(0, p2HP - dmg);
  else p1HP = Math.max(0, p1HP - dmg);
  updateHP();
}

function calculateFinalDamage(v) {
  // No block = full damage
  if (v.noBlock) {
    return v.damage;
  }
  
  // If Throw is checked with a block attempt (same or adjacent)
  if (v.throwAttack && (v.zoneRelation === 'same' || v.zoneRelation === 'adjacent')) {
    return Math.ceil(v.damage / 2); // Half damage
  }
  
  // Normal block rules (no Throw, or opposite zone with Throw)
  if (v.zoneRelation === 'same') {
    return 0; // Fully blocked
  } else if (v.zoneRelation === 'adjacent') {
    return Math.ceil(v.damage / 2); // Half damage
  } else { // opposite
    return v.damage; // Full damage
  }
}

function resolveHit() {
  const v = getValues();
  
  // Calculate final damage based on all rules
  const finalDamage = calculateFinalDamage(v);
  const requiredCheck = v.cardPool + v.speed + (v.noBlock ? 0 : v.blockMod);
  const defender = currentTurn === 1 ? 2 : 1;
  
  // Build result message with explanation
  let hitType = '';
  let explanation = '';
  let emoji = '';
  
  if (v.noBlock) {
    hitType = 'FULL HIT';
    explanation = 'No block attempted - full damage';
    emoji = '🚫';
  } else if (v.throwAttack && v.zoneRelation === 'same') {
    hitType = 'HALF DAMAGE';
    explanation = `Throw turned same zone block (${v.attackZone}) into half damage`;
    emoji = '💫';
  } else if (v.throwAttack && v.zoneRelation === 'adjacent') {
    hitType = 'HALF DAMAGE';
    explanation = `Throw attack on adjacent zone (${v.attackZone} → ${v.blockZone}) - half damage`;
    emoji = '💫';
  } else if (v.throwAttack && v.zoneRelation === 'opposite') {
    hitType = 'FULL HIT';
    explanation = `Opposite zone (${v.attackZone} → ${v.blockZone}) - full damage (Throw already full)`;
    emoji = '⚡';
  } else if (v.zoneRelation === 'same') {
    hitType = 'BLOCKED';
    explanation = `Same zone (${v.attackZone}) - fully blocked`;
    emoji = '🛡️';
  } else if (v.zoneRelation === 'adjacent') {
    hitType = 'HALF DAMAGE';
    explanation = `Adjacent zone (${v.attackZone} → ${v.blockZone}) - half damage`;
    emoji = '⚠️';
  } else {
    hitType = 'FULL HIT';
    explanation = `Opposite zone (${v.attackZone} → ${v.blockZone}) - full damage`;
    emoji = '⚡';
  }
  
  // Show the check required
  const checkInfo = !v.noBlock ? ` | Check needed: ${requiredCheck}+` : '';
  
  if (finalDamage > 0) {
    applyDamage(finalDamage);
    document.getElementById('result').innerHTML =
      `<span class="result-hit">${emoji} ${hitType}: ${finalDamage} damage ${emoji}</span><br>` +
      `<span style="font-size:12px;">→ ${explanation}${checkInfo}</span><br>` +
      `<span style="font-size:12px;">→ ${finalDamage} damage dealt to Player ${defender}</span>`;
  } else {
    document.getElementById('result').innerHTML =
      `<span class="result-blocked">🛡️ ${hitType} 🛡️</span><br>` +
      `<span style="font-size:12px;">→ ${explanation}${checkInfo}</span><br>` +
      `<span style="font-size:12px;">→ 0 damage dealt</span>`;
  }
}
function nextTurn() {
  currentTurn = currentTurn === 1 ? 2 : 1;
  document.getElementById('result').innerHTML =
    '<span class="result-placeholder">— Set attack & defense, then press HIT —</span>';
  updateHP();
  updateSanityCheck();
}

function resetGame() {
  p1HP = 30;
  p2HP = 30;
  currentTurn = 1;
  document.getElementById('winOverlay').style.display = 'none';
  document.getElementById('result').innerHTML =
    '<span class="result-placeholder">— Set attack & defense, then press HIT —</span>';
  document.getElementById('diceResult').textContent = '—';
  document.getElementById('cardPool').value = 0;
  document.getElementById('speed').value = 4;
  document.getElementById('damage').value = 4;
  document.getElementById('blockMod').value = 0;
  document.getElementById('noBlock').checked = false;
  document.getElementById('throw').checked = false;
  updateSanityCheck();
  updateHP();
}

function rollDice() {
  const el = document.getElementById('diceResult');
  let count = 0;
  el.style.color = '#fff';
  const interval = setInterval(() => {
    el.textContent = Math.ceil(Math.random() * 6);
    count++;
    if (count >= 12) {
      clearInterval(interval);
      el.style.color = '#e8a020';
    }
  }, 55);
}

// Adjustment functions
function adjustCardPool(amount) {
  const input = document.getElementById('cardPool');
  let newVal = parseInt(input.value) + amount;
  newVal = Math.max(0, Math.min(10, newVal));
  input.value = newVal;
  updateSanityCheck();
}

function adjustSpeed(amount) {
  const input = document.getElementById('speed');
  let newVal = parseInt(input.value) + amount;
  newVal = Math.max(0, newVal);
  input.value = newVal;
  updateSanityCheck();
}

function adjustDamage(amount) {
  const input = document.getElementById('damage');
  let newVal = parseInt(input.value) + amount;
  newVal = Math.max(0, newVal);
  input.value = newVal;
}

function adjustBlockMod(amount) {
  const input = document.getElementById('blockMod');
  let newVal = parseInt(input.value) + amount;
  input.value = newVal;
  updateSanityCheck();
}

// Initialize
updateHP();
updateSanityCheck();
updateZoneColors();

// Add event listeners for real-time updates
document.getElementById('attackZone').addEventListener('change', updateZoneColors);
document.getElementById('blockZone').addEventListener('change', updateZoneColors);
document.getElementById('speed').addEventListener('input', updateSanityCheck);
document.getElementById('blockMod').addEventListener('input', updateSanityCheck);
document.getElementById('cardPool').addEventListener('input', updateSanityCheck);
document.getElementById('noBlock').addEventListener('change', updateSanityCheck);
document.getElementById('throw').addEventListener('change', updateSanityCheck);

// Zone selector initialization
function initZoneSelectors() {
  // Attack zone selector
  const attackSelector = document.getElementById('attackZoneSelector');
  const attackInput = document.getElementById('attackZone');
  
  if (attackSelector) {
    const attackOptions = attackSelector.querySelectorAll('.zone-option');
    attackOptions.forEach(option => {
      option.addEventListener('click', () => {
        const zone = option.dataset.zone;
        attackInput.value = zone;
        
        // Update selected styling
        attackOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        updateZoneColors();
        updateSanityCheck();
      });
    });
  }
  
  // Block zone selector
  const blockSelector = document.getElementById('blockZoneSelector');
  const blockInput = document.getElementById('blockZone');
  
  if (blockSelector) {
    const blockOptions = blockSelector.querySelectorAll('.zone-option');
    blockOptions.forEach(option => {
      option.addEventListener('click', () => {
        const zone = option.dataset.zone;
        blockInput.value = zone;
        
        // Update selected styling
        blockOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        updateZoneColors();
        updateSanityCheck();
      });
    });
  }
  
  // Set initial selected states
  updateZoneColors();
}

// Replace the existing updateZoneColors function with this updated version
function updateZoneColors() {
  const attackZone = document.getElementById('attackZone').value;
  const blockZone = document.getElementById('blockZone').value;
  
  // Update attack selector visual
  const attackOptions = document.querySelectorAll('#attackZoneSelector .zone-option');
  attackOptions.forEach(opt => {
    if (opt.dataset.zone === attackZone) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
  
  // Update block selector visual
  const blockOptions = document.querySelectorAll('#blockZoneSelector .zone-option');
  blockOptions.forEach(opt => {
    if (opt.dataset.zone === blockZone) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
}

// Call init when page loads
document.addEventListener('DOMContentLoaded', initZoneSelectors);

// Zone cycling functionality
const zoneOrder = ['High', 'Mid', 'Low'];

function setupZoneCycling() {
  // Attack zone cycling
  const attackBtn = document.getElementById('attackCycleBtn');
  const attackInput = document.getElementById('attackZone');
  const attackIcon = document.getElementById('attackIcon');
  const attackText = document.getElementById('attackZoneText');
  
  if (attackBtn) {
    attackBtn.addEventListener('click', () => {
      let currentZone = attackInput.value;
      let currentIndex = zoneOrder.indexOf(currentZone);
      let nextIndex = (currentIndex + 1) % zoneOrder.length;
      let nextZone = zoneOrder[nextIndex];
      
      attackInput.value = nextZone;
      attackBtn.setAttribute('data-zone', nextZone);
      attackIcon.setAttribute('data-zone', nextZone);
      attackText.textContent = nextZone;
      
      updateZoneColors();
      updateSanityCheck();
    });
  }
  
  // Block zone cycling
  const blockBtn = document.getElementById('blockCycleBtn');
  const blockInput = document.getElementById('blockZone');
  const shieldIcon = document.getElementById('shieldIcon');
  const blockText = document.getElementById('blockZoneText');
  
  if (blockBtn) {
    blockBtn.addEventListener('click', () => {
      let currentZone = blockInput.value;
      let currentIndex = zoneOrder.indexOf(currentZone);
      let nextIndex = (currentIndex + 1) % zoneOrder.length;
      let nextZone = zoneOrder[nextIndex];
      
      blockInput.value = nextZone;
      blockBtn.setAttribute('data-zone', nextZone);
      shieldIcon.setAttribute('data-zone', nextZone);
      blockText.textContent = nextZone;
      
      updateZoneColors();
      updateSanityCheck();
    });
  }
  
  // Set initial data attributes
  if (attackBtn) {
    attackBtn.setAttribute('data-zone', attackInput.value);
    attackIcon.setAttribute('data-zone', attackInput.value);
  }
  if (blockBtn) {
    blockBtn.setAttribute('data-zone', blockInput.value);
    shieldIcon.setAttribute('data-zone', blockInput.value);
  }
}

// Update the updateZoneColors function for the new cycle interface
function updateZoneColors() {
  const attackZone = document.getElementById('attackZone').value;
  const blockZone = document.getElementById('blockZone').value;
  
  // Update attack button
  const attackBtn = document.getElementById('attackCycleBtn');
  const attackIcon = document.getElementById('attackIcon');
  const attackText = document.getElementById('attackZoneText');
  if (attackBtn) {
    attackBtn.setAttribute('data-zone', attackZone);
    attackIcon.setAttribute('data-zone', attackZone);
    attackText.textContent = attackZone;
  }
  
  // Update block button
  const blockBtn = document.getElementById('blockCycleBtn');
  const shieldIcon = document.getElementById('shieldIcon');
  const blockText = document.getElementById('blockZoneText');
  if (blockBtn) {
    blockBtn.setAttribute('data-zone', blockZone);
    shieldIcon.setAttribute('data-zone', blockZone);
    blockText.textContent = blockZone;
  }
}

// Call setupZoneCycling in your initialization
// Add this line where you initialize other functions:
document.addEventListener('DOMContentLoaded', () => {
  setupZoneCycling();
  initZoneSelectors(); // If you still have this, otherwise remove it
});

// Theme Toggle
function toggleTheme() {
  const body = document.body;
  const toggleBtn = document.getElementById('themeToggle');
  
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    toggleBtn.textContent = '🌙';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.add('light-mode');
    toggleBtn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('theme', 'light');
  }
}

// Load saved theme on startup
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  const toggleBtn = document.getElementById('themeToggle');
  
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (toggleBtn) toggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    if (toggleBtn) toggleBtn.textContent = '🌙';
  }
}

// Call loadTheme when page loads
// Add this line to your initialization section or DOMContentLoaded event
document.addEventListener('DOMContentLoaded', loadTheme);
