import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkEligibility,
  checkSchemeEligibility,
  getRequiredDocuments,
  getSchemeById,
  searchSchemes,
  validateSchemeData
} from '../backend/src/services/schemeService.js';

test('search is case-insensitive and scheme filters work', () => {
  assert.equal(searchSchemes('LEARNING').length, 1);
  assert.equal(searchSchemes('', { department: 'Demo Housing Department' }).length, 2);
  assert.equal(searchSchemes('', { status: 'ACTIVE' }).length, 10);
  assert.equal(searchSchemes('', { category: 'AGRICULTURE' }).length, 2);
});

test('finds a scheme by schemeId and returns null for missing ID', () => {
  assert.equal(getSchemeById('SCH001').schemeId, 'SCH001');
  assert.equal(getSchemeById('UNKNOWN'), null);
});

test('evaluates eligible, failed, missing, and boolean criteria', () => {
  assert.equal(checkSchemeEligibility('SCH001', { age: 20, annualIncome: 300000, isStudent: true }).eligibilityStatus, 'ELIGIBLE');
  const failedAge = checkSchemeEligibility('SCH001', { age: 15, annualIncome: 300000, isStudent: true });
  assert.equal(failedAge.eligibilityStatus, 'NOT_ELIGIBLE');
  assert.equal(failedAge.eligible, false);
  assert.ok(failedAge.reasons.includes('Age must be at least 16.'));
  const missingIncome = checkSchemeEligibility('SCH001', { age: 20, isStudent: true });
  assert.equal(missingIncome.eligibilityStatus, 'NEEDS_INFORMATION');
  assert.equal(missingIncome.eligible, null);
  assert.deepEqual(missingIncome.missingInformation, ['annualIncome']);
  const failedIncome = checkSchemeEligibility('SCH001', { age: 20, annualIncome: 700000, isStudent: true });
  assert.equal(failedIncome.eligible, false);
  assert.ok(failedIncome.reasons.includes('Annual income must not exceed 600000.'));
  const failedBoolean = checkSchemeEligibility('SCH002', { age: 30, annualIncome: 100000, isRuralResident: false });
  assert.equal(failedBoolean.eligibilityStatus, 'NOT_ELIGIBLE');
  assert.ok(failedBoolean.reasons.includes('Rural residence status must be true.'));
});

test('handles inclusive boundaries and inactive/closed schemes', () => {
  assert.equal(checkSchemeEligibility('SCH001', { age: 16, annualIncome: 600000, isStudent: true }).eligible, true);
  assert.equal(checkSchemeEligibility('SCH001', { age: 30, annualIncome: 600000, isStudent: true }).eligible, true);
  assert.equal(checkSchemeEligibility('SCH001', { age: 31, annualIncome: 600000, isStudent: true }).eligible, false);
  assert.equal(checkSchemeEligibility('SCH001', { age: 20, annualIncome: 600001, isStudent: true }).eligible, false);
  assert.equal(checkSchemeEligibility('SCH005', { annualIncome: 1 }).eligible, false);
  assert.equal(checkSchemeEligibility('SCH006', { age: 30 }).eligible, false);
});

test('returns required documents and all-scheme results', () => {
  assert.deepEqual(getRequiredDocuments('SCH002'), ['IDENTITY_PROOF', 'ADDRESS_PROOF', 'LAND_RECORD']);
  assert.equal(getRequiredDocuments('UNKNOWN'), null);
  assert.equal(checkEligibility({}).length, 12);
});

test('evaluates imported occupation and land criteria', () => {
  assert.equal(checkSchemeEligibility('PM_KISAN', { age: 42, occupation: 'Student / Part-time Farming', ownsLand: false }).eligibilityStatus, 'NOT_ELIGIBLE');
  assert.equal(checkSchemeEligibility('PM_KISAN', { age: 42, occupation: 'Farmer', ownsLand: true }).eligibilityStatus, 'ELIGIBLE');
  assert.equal(checkSchemeEligibility('POST_MATRIC_SCHOLARSHIP', { age: 22, annualIncome: 150000, occupation: 'Student' }).eligibilityStatus, 'ELIGIBLE');
  assert.equal(checkSchemeEligibility('PMMY', { age: 30, occupation: 'Student' }).eligibilityStatus, 'NOT_ELIGIBLE');
});

test('supports uploaded citizen field aliases through the service contract', () => {
  const result = checkSchemeEligibility('PM_KISAN', { age: 42, annual_income: 95000, occupation: 'Farmer', owns_land: true });
  assert.equal(result.eligibilityStatus, 'ELIGIBLE');
  assert.deepEqual(result.missingInformation, []);
});

test('validates invalid scheme data', () => {
  const result = validateSchemeData({ schemeId: 'X', status: 'WRONG' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('status')));
});
