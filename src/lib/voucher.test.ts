import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTokenAmount,
  formatTokenAmount,
  deriveVoucherStatus,
  canSpendVoucher,
  canReclaimVoucher,
  needsTokenApproval,
  validateCreateVoucherInput,
  validateSpendInput,
  buildGiftLink,
  formatExpiryRemaining,
  normalizeRawVoucher,
  type VoucherRecord,
} from './voucher';
import {
  GIFTSTORE_DEFAULT_ABI,
  buildCreateArgs,
  buildSpendArgs,
  resolveContractAbi,
} from './abi';
import type { Abi } from 'viem';

const SENDER = '0x1111111111111111111111111111111111111111' as const;
const RECIPIENT = '0x2222222222222222222222222222222222222222' as const;
const STRANGER = '0x3333333333333333333333333333333333333333' as const;
const USDC = '0x3600000000000000000000000000000000000000' as const;

function makeVoucher(overrides: Partial<VoucherRecord> = {}): VoucherRecord {
  return {
    id: 1n,
    sender: SENDER,
    recipient: RECIPIENT,
    token: USDC,
    tokenSymbol: 'USDC',
    decimals: 6,
    initialAmount: 100_000_000n,
    remainingAmount: 100_000_000n,
    createdAt: 1_700_000_000,
    expiry: 1_700_864_000,
    message: 'Happy birthday',
    reclaimed: false,
    ...overrides,
  };
}

test('parseTokenAmount respects token decimals accurately', () => {
  assert.equal(parseTokenAmount('25', 6), 25_000_000n);
  assert.equal(parseTokenAmount('25.5', 6), 25_500_000n);
  assert.equal(parseTokenAmount('0.000001', 6), 1n);
  assert.equal(parseTokenAmount('0.0000001', 6), null);
  assert.equal(parseTokenAmount('-5', 6), null);
  assert.equal(parseTokenAmount('', 6), null);
  assert.equal(parseTokenAmount('1.5', 18), 1_500_000_000_000_000_000n);
});

test('formatTokenAmount formats integer and fractional amounts cleanly', () => {
  assert.equal(formatTokenAmount(25_000_000n, 6), '25.00');
  assert.equal(formatTokenAmount(1250_500_000n, 6), '1,250.50');
  assert.equal(formatTokenAmount(100n, 6), '0.0001');
  assert.equal(formatTokenAmount(0n, 6), '0.00');
});

test('deriveVoucherStatus computes all lifecycle states', () => {
  const now = 1_700_100_000;
  assert.equal(deriveVoucherStatus(makeVoucher(), now), 'active');
  assert.equal(
    deriveVoucherStatus(makeVoucher({ remainingAmount: 40_000_000n }), now),
    'partially-spent'
  );
  assert.equal(
    deriveVoucherStatus(makeVoucher({ remainingAmount: 0n }), now),
    'spent'
  );
  assert.equal(
    deriveVoucherStatus(makeVoucher({ expiry: now - 1 }), now),
    'expired'
  );
  assert.equal(
    deriveVoucherStatus(makeVoucher({ reclaimed: true, remainingAmount: 0n }), now),
    'reclaimed'
  );
});

test('canSpendVoucher restricts spending strictly to active recipient', () => {
  const now = 1_700_100_000;
  const active = makeVoucher();
  assert.equal(canSpendVoucher(active, RECIPIENT, now), true);
  assert.equal(canSpendVoucher(active, RECIPIENT.toUpperCase(), now), true);
  assert.equal(canSpendVoucher(active, SENDER, now), false);
  assert.equal(canSpendVoucher(active, STRANGER, now), false);
  assert.equal(canSpendVoucher(active, undefined, now), false);

  const expired = makeVoucher({ expiry: now - 10 });
  assert.equal(canSpendVoucher(expired, RECIPIENT, now), false);

  const spent = makeVoucher({ remainingAmount: 0n });
  assert.equal(canSpendVoucher(spent, RECIPIENT, now), false);
});

test('canReclaimVoucher restricts reclaiming strictly to sender after expiry', () => {
  const now = 1_700_100_000;
  const active = makeVoucher({ expiry: now + 1000 });
  assert.equal(canReclaimVoucher(active, SENDER, now), false);

  const expired = makeVoucher({ expiry: now - 1 });
  assert.equal(canReclaimVoucher(expired, SENDER, now), true);
  assert.equal(canReclaimVoucher(expired, RECIPIENT, now), false);
  assert.equal(canReclaimVoucher(expired, STRANGER, now), false);

  const alreadyReclaimed = makeVoucher({ expiry: now - 1, reclaimed: true });
  assert.equal(canReclaimVoucher(alreadyReclaimed, SENDER, now), false);
});

test('needsTokenApproval checks allowance against required amount', () => {
  assert.equal(needsTokenApproval(undefined, 10_000_000n), true);
  assert.equal(needsTokenApproval(5_000_000n, 10_000_000n), true);
  assert.equal(needsTokenApproval(10_000_000n, 10_000_000n), false);
  assert.equal(needsTokenApproval(20_000_000n, 10_000_000n), false);
  assert.equal(needsTokenApproval(0n, null), false);
});

test('validateCreateVoucherInput validates address, balance, decimals, and expiry', () => {
  const now = 1_700_000_000;
  const ok = validateCreateVoucherInput({
    recipient: RECIPIENT,
    amount: '50',
    decimals: 6,
    balance: 100_000_000n,
    expiryTimestamp: now + 86400,
    nowSeconds: now,
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.parsedAmount, 50_000_000n);

  const badBalance = validateCreateVoucherInput({
    recipient: RECIPIENT,
    amount: '150',
    decimals: 6,
    balance: 100_000_000n,
    expiryTimestamp: now + 86400,
    nowSeconds: now,
  });
  assert.equal(badBalance.valid, false);
  assert.ok(badBalance.amountError);

  const badRecipient = validateCreateVoucherInput({
    recipient: '0x123',
    amount: '10',
    decimals: 6,
    expiryTimestamp: now + 86400,
    nowSeconds: now,
  });
  assert.equal(badRecipient.valid, false);
  assert.ok(badRecipient.recipientError);
});

test('validateSpendInput enforces destination and remaining balance', () => {
  const ok = validateSpendInput({
    destination: STRANGER,
    amount: '25.5',
    decimals: 6,
    remainingAmount: 50_000_000n,
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.parsedAmount, 25_500_000n);

  const over = validateSpendInput({
    destination: STRANGER,
    amount: '60',
    decimals: 6,
    remainingAmount: 50_000_000n,
  });
  assert.equal(over.valid, false);
  assert.ok(over.amountError);
});

test('buildGiftLink and formatExpiryRemaining produce expected output', () => {
  assert.equal(buildGiftLink('https://giftstore.app/', 42n), 'https://giftstore.app/gift/42');
  assert.equal(formatExpiryRemaining(1_700_000_000, 1_700_000_001), 'Expired');
  assert.equal(formatExpiryRemaining(1_700_090_000, 1_700_000_000), '1d 1h left');
});

test('normalizeRawVoucher parses tuple and object contract responses', () => {
  const tupleRaw = [
    7n,
    SENDER,
    RECIPIENT,
    USDC,
    50_000_000n,
    25_000_000n,
    1_700_000_000n,
    1_700_864_000n,
    'Enjoy dinner',
    false,
  ];
  const parsed = normalizeRawVoucher(tupleRaw, 7n, () => ({ symbol: 'USDC', decimals: 6 }));
  assert.ok(parsed);
  assert.equal(parsed.id, 7n);
  assert.equal(parsed.remainingAmount, 25_000_000n);
  assert.equal(parsed.message, 'Enjoy dinner');
});

test('resolveContractAbi maps actions and argument order dynamically', () => {
  const resolved = resolveContractAbi(GIFTSTORE_DEFAULT_ABI as unknown as Abi, 'fallback');
  assert.equal(resolved.createFn?.name, 'createVoucher');
  assert.equal(resolved.spendFn?.name, 'spendVoucher');
  assert.equal(resolved.reclaimFn?.name, 'reclaimVoucher');

  const createArgs = buildCreateArgs(resolved.createFn!, {
    recipient: RECIPIENT,
    token: USDC,
    amount: 25_000_000n,
    expiry: 1_700_864_000n,
    message: 'Cheers',
  });
  assert.deepEqual(createArgs, [RECIPIENT, USDC, 25_000_000n, 1_700_864_000n, 'Cheers']);

  const spendArgs = buildSpendArgs(resolved.spendFn!, {
    voucherId: 3n,
    amount: 10_000_000n,
    to: STRANGER,
  });
  assert.deepEqual(spendArgs, [3n, 10_000_000n, STRANGER]);
});
