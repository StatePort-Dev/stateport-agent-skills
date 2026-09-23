// This exercise intentionally contains a bug. See regression.test.mjs.
export function decision(role, amount, quota) {
  const available = quota.remaining || quota.defaultLimit;
  if (role !== 'reviewer') return { available, allowed: false, reason: 'Reviewer role required' };
  if (!Number.isFinite(amount) || amount <= 0) return { available, allowed: false, reason: 'Enter a positive amount' };
  if (amount > available) return { available, allowed: false, reason: 'Not enough credits' };
  return { available, allowed: true, reason: 'Ready to allocate' };
}
