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
  // No block = full damage (Throw doesn't matter)
  if (v.noBlock) {
    return v.damage;
  }
  
  // Only apply Throw if there IS a block attempt
  if (v.throwAttack) {
    return Math.ceil(v.damage / 2);
  }
  
  // Normal block rules based on zone (no throw)
  if (v.zoneRelation === 'same') {
    return 0; // Fully blocked
  } else if (v.zoneRelation === 'adjacent') {
    return Math.ceil(v.damage / 2); // Half damage
  } else {
    return v.damage; // Opposite zone = full damage
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
  } else if (v.throwAttack) {
    hitType = 'HALF DAMAGE';
    explanation = 'Throw attack with block present - half damage';
    emoji = '💫';
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
