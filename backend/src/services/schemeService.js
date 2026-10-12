import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Scheme, SchemeStatus } from '../models/Scheme.js';

const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'schemes.json');
const importedDataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'importedSchemes.json');
const schemes = [
  ...JSON.parse(fs.readFileSync(dataPath, 'utf8')),
  ...JSON.parse(fs.readFileSync(importedDataPath, 'utf8'))
].map((data) => new Scheme(data));

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const normalizeCitizen = (citizen = {}) => ({
  ...citizen,
  annualIncome: citizen.annualIncome ?? citizen.annual_income,
  ownsLand: citizen.ownsLand ?? citizen.owns_land,
  documents: citizen.documents ?? citizen.available_documents ?? citizen.documents_uploaded
});

export function validateSchemeData(data) {
  return Scheme.validate(data);
}

export function searchSchemes(query = '', filters = {}) {
  const needle = normalize(query);
  return getAllSchemes(filters).filter((scheme) => !needle || ['name', 'description', 'ministry', 'department'].some((field) => normalize(scheme[field]).includes(needle)));
}

export function getAllSchemes(filters = {}) {
  return schemes.filter((scheme) => Object.entries(filters).every(([key, value]) => value === undefined || value === '' || normalize(scheme[key]) === normalize(value)));
}

export function getSchemeById(schemeId) {
  return schemes.find((scheme) => scheme.schemeId === schemeId) ?? null;
}

export function checkEligibility(Citizen = {}) {
  return schemes.map((scheme) => scheme.checkEligibility(normalizeCitizen(Citizen)));
}

export function checkSchemeEligibility(schemeId, Citizen = {}) {
  const scheme = getSchemeById(schemeId);
  if (!scheme) return null;
  return scheme.checkEligibility(normalizeCitizen(Citizen));
}

export function getRequiredDocuments(schemeId) {
  const scheme = getSchemeById(schemeId);
  return scheme ? scheme.requiredDocuments.slice() : null;
}

export function getSchemeSource() {
  return {
    sourceId: 'LOCAL-DEMO-JSON',
    name: 'Local demo JSON',
    type: 'LOCAL_JSON',
    url: 'local://backend/src/data/schemes.json',
    lastFetchedAt: null,
    status: 'DEMO_ONLY',
    fetchSchemes: () => schemes.map((scheme) => scheme.getDetails()),
    parseAndUpdate: () => {
      throw new Error('External data ingestion is not implemented; replace local demo data with verified sources.');
    }
  };
}

export { SchemeStatus };
