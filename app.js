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

function updateActionButtons() {
  const noBlock = document.getElementById('noBlock').checked;
  const blockBtn = document.querySelector('.btn-block');
  const halfBtn = document.querySelector('.btn-half');
  
  if (noBlock) {
    blockBtn.style.display = 'none';
    halfBtn.style.display = 'none';
  } else {
    blockBtn.style.display = 'block';
    halfBtn.style.display = 'block';
  }
}

function applyDamage(dmg) {
  if (currentTurn === 1) p2HP = Math.max(0, p2HP - dmg);
  else p1HP = Math.max(0, p1HP - dmg);
  updateHP();
}

function calculateFinalDamage(v) {
  // Throw overrides everything - always half damage (rounded up)
  if (v.throwAttack) {
    return Math.ceil(v.damage / 2);
  }
  
  // No block = full damage
  if (v.noBlock) {
    return v.damage;
  }
  
  // Normal block rules based on zone
  if (v.zoneRelation === 'same') {
    return 0; // Fully blocked
  } else if (v.zoneRelation === 'adjacent') {
    return Math.ceil(v.damage / 2); // Half damage
  } else {
    return v.damage; // Opposite zone = full damage
  }
}

function resolveBlock() {
  const v = getValues();
  const requiredCheck = v.cardPool + v.speed + (v.noBlock ? 0 : v.blockMod);
  const zoneWarning = v.zoneRelation !== 'same' ? 
    '<span class="result-warning">⚠ Zone ' + v.zoneRelation + '</span>' : '';
  
  document.getElementById('result').innerHTML =
    '<span class="result-blocked">BLOCK CHECK</span>' +
    ' — Need: <span class="result-check">' + requiredCheck + '+</span>' +
    (zoneWarning ? ' ' + zoneWarning : '');
}

function resolveHalf() {
  const v = getValues();
  const half = Math.ceil(v.damage / 2);
  applyDamage(half);
  const defender = currentTurn === 1 ? 2 : 1;
  
  let reason = '';
  if (v.throwAttack) reason = ' (Throw)';
  else if (v.zoneRelation === 'adjacent') reason = ' (Adjacent zone)';
  else reason = ' (Manual half)';
  
  document.getElementById('result').innerHTML =
    '<span class="result-hit">HALF DAMAGE: ' + half + '</span>' +
    ' dealt to Player ' + defender + reason;
}

function resolveHit() {
  const v = getValues();
  
  // Calculate final damage based on all rules
  const finalDamage = calculateFinalDamage(v);
  const defender = currentTurn === 1 ? 2 : 1;
  
  // Build result message with explanation
  let hitType = '';
  let explanation = '';
  
  if (v.throwAttack) {
    hitType = 'HALF DAMAGE';
    explanation = ' (Throw attack)';
  } else if (v.noBlock) {
    hitType = 'FULL HIT';
    explanation = ' (No block)';
  } else if (v.zoneRelation === 'same') {
    hitType = 'BLOCKED';
    explanation = ' (Same zone - fully blocked)';
  } else if (v.zoneRelation === 'adjacent') {
    hitType = 'HALF DAMAGE';
    explanation = ' (Adjacent zone)';
  } else {
    hitType = 'FULL HIT';
    explanation = ' (Opposite zone)';
  }
  
  if (finalDamage > 0) {
    applyDamage(finalDamage);
    document.getElementById('result').innerHTML =
      '<span class="result-hit">' + hitType + ': ' + finalDamage + ' damage</span>' +
      ' dealt to Player ' + defender + explanation;
  } else {
    document.getElementById('result').innerHTML =
      '<span class="result-blocked">' + hitType + '</span>' +
      ' — Attack fully blocked' + explanation;
  }
}

function nextTurn() {
  currentTurn = currentTurn === 1 ? 2 : 1;
  document.getElementById('result').innerHTML =
    '<span class="result-placeholder">— Set attack &amp; defense, then resolve —</span>';
  updateHP();
  updateSanityCheck();
}

function resetGame() {
  p1HP = 30;
  p2HP = 30;
  currentTurn = 1;
  document.getElementById('winOverlay').style.display = 'none';
  document.getElementById('result').innerHTML =
    '<span class="result-placeholder">— Set attack &amp; defense, then resolve —</span>';
  document.getElementById('diceResult').textContent = '—';
  document.getElementById('cardPool').value = 0;
  document.getElementById('speed').value = 4;
  document.getElementById('damage').value = 4;
  document.getElementById('blockMod').value = 0;
  document.getElementById('noBlock').checked = false;
  document.getElementById('throw').checked = false;
  updateSanityCheck();
  updateHP();
  updateActionButtons();
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
updateActionButtons();

// Add event listeners for real-time updates
document.getElementById('attackZone').addEventListener('change', updateZoneColors);
document.getElementById('blockZone').addEventListener('change', updateZoneColors);
document.getElementById('speed').addEventListener('input', updateSanityCheck);
document.getElementById('blockMod').addEventListener('input', updateSanityCheck);
document.getElementById('cardPool').addEventListener('input', updateSanityCheck);
document.getElementById('noBlock').addEventListener('change', updateSanityCheck);
