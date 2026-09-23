import { decision } from './decision.mjs';

const role = document.querySelector('#role');
const scenario = document.querySelector('#scenario');
const amount = document.querySelector('#amount');
const allocate = document.querySelector('#allocate');
const receipt = document.querySelector('#receipt');
const keys = { role: 'repro-lab.role', scenario: 'repro-lab.scenario', amount: 'repro-lab.amount' };
let generation = 0;

for (const [name, control] of Object.entries({ role, scenario, amount })) {
  const saved = localStorage.getItem(keys[name]);
  if (saved !== null && (name === 'amount' || [...control.options].some(option => option.value === saved))) control.value = saved;
  control.addEventListener(name === 'amount' ? 'input' : 'change', update);
}

async function update() {
  const current = ++generation;
  allocate.disabled = true;
  receipt.textContent = '';
  document.querySelector('#decision').textContent = 'Loading…';
  for (const [name, control] of Object.entries({ role, scenario, amount })) localStorage.setItem(keys[name], control.value);
  try {
    const response = await fetch(`/api/quota?scenario=${encodeURIComponent(scenario.value)}`);
    if (!response.ok) throw new Error('Fixture request failed');
    const quota = await response.json();
    if (current !== generation) return;
    const result = decision(role.value, Number(amount.value), quota);
    document.querySelector('#payload').textContent = JSON.stringify(quota, null, 2);
    document.querySelector('#available').textContent = result.available;
    document.querySelector('#decision').textContent = result.reason;
    allocate.disabled = !result.allowed;
  } catch {
    if (current !== generation) return;
    document.querySelector('#payload').textContent = 'API unavailable';
    document.querySelector('#available').textContent = '—';
    document.querySelector('#decision').textContent = 'Start the local server and reload.';
  }
}

allocate.addEventListener('click', () => { receipt.textContent = `Simulated allocation of ${amount.value} credits. No server data changed.`; });
document.querySelector('#reset').addEventListener('click', () => {
  for (const key of Object.values(keys)) localStorage.removeItem(key);
  location.reload();
});
await update();
