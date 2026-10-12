import { Router } from 'express';
import {
  checkEligibility,
  checkSchemeEligibility,
  getAllSchemes,
  getRequiredDocuments,
  getSchemeById,
  searchSchemes
} from '../services/schemeService.js';

const router = Router();
const allowedStatuses = new Set(['ACTIVE', 'INACTIVE', 'CLOSED']);
const positiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;
const citizenFields = new Set(['age', 'annualIncome', 'isStudent', 'isRuralResident']);

function validateCitizen(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['request body must be a Citizen-like object'];
  const errors = [];
  for (const [key, value] of Object.entries(body)) {
    if (!citizenFields.has(key)) errors.push(`unsupported Citizen field: ${key}`);
    if (['age', 'annualIncome'].includes(key) && (!Number.isFinite(value) || value < 0)) errors.push(`${key} must be a non-negative number`);
    if (['isStudent', 'isRuralResident'].includes(key) && typeof value !== 'boolean') errors.push(`${key} must be boolean`);
  }
  return errors;
}

router.get('/', (req, res) => {
  const { search = '', department, status, category, page = '1', limit = '20' } = req.query;
  if (!positiveInteger(String(page)) || !positiveInteger(String(limit)) || Number(limit) > 100) return res.status(400).json({ success: false, message: 'Invalid pagination', errors: ['page and limit must be positive integers; limit must not exceed 100'] });
  if (status && !allowedStatuses.has(String(status).toUpperCase())) return res.status(400).json({ success: false, message: 'Invalid status', errors: ['status must be ACTIVE, INACTIVE, or CLOSED'] });
  const all = searchSchemes(search, { department, status: status?.toUpperCase(), category });
  const start = (Number(page) - 1) * Number(limit);
  return res.json({ success: true, data: all.slice(start, start + Number(limit)).map((scheme) => scheme.getDetails()), pagination: { page: Number(page), limit: Number(limit), total: all.length, totalPages: Math.ceil(all.length / Number(limit)) } });
});

// Keep the collection-level eligibility route before parameterized scheme routes.
router.post('/eligibility', (req, res) => {
  const errors = validateCitizen(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Invalid Citizen input', errors });
  return res.json({ success: true, data: checkEligibility(req.body) });
});

router.get('/:schemeId/documents', (req, res) => {
  const documents = getRequiredDocuments(req.params.schemeId);
  if (!documents) return res.status(404).json({ success: false, message: 'Scheme not found', errors: [`No scheme exists with schemeId ${req.params.schemeId}`] });
  return res.json({ success: true, data: { schemeId: req.params.schemeId, requiredDocuments: documents } });
});

router.post('/:schemeId/eligibility', (req, res) => {
  const errors = validateCitizen(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Invalid Citizen input', errors });
  const result = checkSchemeEligibility(req.params.schemeId, req.body);
  if (!result) return res.status(404).json({ success: false, message: 'Scheme not found', errors: [`No scheme exists with schemeId ${req.params.schemeId}`] });
  return res.json({ success: true, data: result });
});

router.get('/:schemeId', (req, res) => {
  const scheme = getSchemeById(req.params.schemeId);
  if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found', errors: [`No scheme exists with schemeId ${req.params.schemeId}`] });
  return res.json({ success: true, data: scheme.getDetails() });
});

export default router;
