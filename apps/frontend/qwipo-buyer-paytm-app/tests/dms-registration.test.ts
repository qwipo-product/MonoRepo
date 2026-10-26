import { describe, expect, test } from 'bun:test';
import { DEMO_FAILED_LINK, REGISTERED_MOBILE, dmsCompanyById, replyTo } from '../src/data/dmsPartners';

describe('HUL reply to a Customer ID or mobile number (simulated)', () => {
  const hul = dmsCompanyById('hul')!;

  test('finds the shop by a known customer ID, whatever its case', () => {
    expect(replyTo(hul, { by: 'customerId', value: 'HUL12345' })).toBe('registered');
    expect(replyTo(hul, { by: 'customerId', value: 'hul12345' })).toBe('registered');
  });

  test('rejects any other customer ID, so it shows Failed with Retry', () => {
    expect(replyTo(hul, { by: 'customerId', value: 'HUL99999' })).toBe('rejected');
    expect(replyTo(hul, DEMO_FAILED_LINK)).toBe('rejected');
  });

  test('finds the shop by the mobile number registered on Qwipo', () => {
    expect(replyTo(hul, { by: 'mobile', value: REGISTERED_MOBILE })).toBe('registered');
  });
});
