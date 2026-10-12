export const SchemeStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CLOSED: 'CLOSED'
});

export const DocumentType = Object.freeze({
  IDENTITY_PROOF: 'IDENTITY_PROOF',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  INCOME_PROOF: 'INCOME_PROOF',
  PASSPORT: 'PASSPORT',
  CASTE_CERTIFICATE: 'CASTE_CERTIFICATE',
  LAND_RECORD: 'LAND_RECORD',
  OTHER: 'OTHER'
});

const CRITERIA_TYPES = new Set([
  'minAge',
  'maxAge',
  'maxAnnualIncome',
  'studentRequired',
  'ruralResidentRequired'
]);

export class Scheme {
  constructor(data) {
    const validation = Scheme.validate(data);
    if (!validation.valid) {
      throw new Error(`Invalid scheme data: ${validation.errors.join('; ')}`);
    }
    Object.assign(this, structuredClone(data));
  }

  static validate(data) {
    const errors = [];
    const required = [
      'schemeId', 'name', 'description', 'ministry', 'department',
      'eligibilityCriteria', 'benefits', 'requiredDocuments',
      'startDate', 'endDate', 'status', 'sourceUrl'
    ];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, errors: ['scheme must be an object'] };
    }
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`${field} is required`);
      }
    }
    for (const field of ['schemeId', 'name', 'description', 'ministry', 'department', 'sourceUrl']) {
      if (data[field] !== undefined && typeof data[field] !== 'string') errors.push(`${field} must be a string`);
    }
    if (!Object.values(SchemeStatus).includes(data.status)) errors.push('status must be ACTIVE, INACTIVE, or CLOSED');
    if (!Array.isArray(data.benefits) || data.benefits.some((item) => typeof item !== 'string')) errors.push('benefits must be an array of strings');
    if (!Array.isArray(data.requiredDocuments) || data.requiredDocuments.some((item) => !Object.values(DocumentType).includes(item))) errors.push('requiredDocuments contains an invalid DocumentType');
    const dates = ['startDate', 'endDate'];
    for (const field of dates) {
      if (typeof data[field] === 'string' && Number.isNaN(Date.parse(data[field]))) errors.push(`${field} must be an ISO-compatible date`);
    }
    if (typeof data.startDate === 'string' && typeof data.endDate === 'string' && data.startDate > data.endDate) errors.push('startDate must not be after endDate');
    if (!data.eligibilityCriteria || typeof data.eligibilityCriteria !== 'object' || Array.isArray(data.eligibilityCriteria)) {
      errors.push('eligibilityCriteria must be an object');
    } else {
      for (const [key, value] of Object.entries(data.eligibilityCriteria)) {
        if (!CRITERIA_TYPES.has(key)) errors.push(`unsupported eligibility criterion: ${key}`);
        else if (['studentRequired', 'ruralResidentRequired'].includes(key) && typeof value !== 'boolean') errors.push(`${key} must be boolean`);
        else if (['minAge', 'maxAge', 'maxAnnualIncome'].includes(key) && (!Number.isFinite(value) || value < 0)) errors.push(`${key} must be a non-negative number`);
      }
      if (data.eligibilityCriteria.minAge !== undefined && data.eligibilityCriteria.maxAge !== undefined && data.eligibilityCriteria.minAge > data.eligibilityCriteria.maxAge) errors.push('minAge must not exceed maxAge');
    }
    return { valid: errors.length === 0, errors };
  }

  static from(data) {
    return new Scheme(data);
  }

  getDetails() {
    return structuredClone(this);
  }

  checkEligibility(Citizen) {
    return this._evaluate(Citizen);
  }

  updateScheme(updatedData) {
    const next = { ...this.getDetails(), ...updatedData };
    const validation = Scheme.validate(next);
    if (!validation.valid) throw new Error(`Invalid scheme data: ${validation.errors.join('; ')}`);
    Object.assign(this, structuredClone(next));
    return this.getDetails();
  }

  _evaluate(Citizen = {}) {
    const criteria = this.eligibilityCriteria;
    const reasons = [];
    const missingInformation = [];
    let failed = false;
    const check = (field, label, predicate, failure) => {
      if (Citizen[field] === undefined || Citizen[field] === null) missingInformation.push(field);
      else if (!predicate(Citizen[field])) {
        failed = true;
        reasons.push(failure);
      } else reasons.push(`${label} criterion passed.`);
    };
    if (this.status !== SchemeStatus.ACTIVE) {
      return { schemeId: this.schemeId, schemeName: this.name, eligibilityStatus: 'NOT_ELIGIBLE', eligible: false, reasons: [`Scheme is ${this.status.toLowerCase()}.`], missingInformation };
    }
    if (criteria.minAge !== undefined) check('age', 'Minimum age', (value) => Number.isFinite(value) && value >= criteria.minAge, `Age must be at least ${criteria.minAge}.`);
    if (criteria.maxAge !== undefined) check('age', 'Maximum age', (value) => Number.isFinite(value) && value <= criteria.maxAge, `Age must be at most ${criteria.maxAge}.`);
    if (criteria.maxAnnualIncome !== undefined) check('annualIncome', 'Income', (value) => Number.isFinite(value) && value <= criteria.maxAnnualIncome, `Annual income must not exceed ${criteria.maxAnnualIncome}.`);
    if (criteria.studentRequired !== undefined) check('isStudent', 'Student status', (value) => value === criteria.studentRequired, `Student status must be ${criteria.studentRequired ? 'true' : 'false'}.`);
    if (criteria.ruralResidentRequired !== undefined) check('isRuralResident', 'Rural residence', (value) => value === criteria.ruralResidentRequired, `Rural residence status must be ${criteria.ruralResidentRequired ? 'true' : 'false'}.`);
    const eligibilityStatus = failed ? 'NOT_ELIGIBLE' : missingInformation.length ? 'NEEDS_INFORMATION' : 'ELIGIBLE';
    return {
      schemeId: this.schemeId,
      schemeName: this.name,
      eligibilityStatus,
      eligible: eligibilityStatus === 'ELIGIBLE' ? true : eligibilityStatus === 'NOT_ELIGIBLE' ? false : null,
      reasons,
      missingInformation: [...new Set(missingInformation)]
    };
  }
}

export { CRITERIA_TYPES };
