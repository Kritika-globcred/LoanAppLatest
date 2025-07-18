// src/ai/flows/handlebars-helpers.ts
// Registers custom Handlebars helpers for AI extraction flows

import Handlebars from 'handlebars';

export function registerHandlebarsHelpers() {
  // Register 'eq' helper (strict equality)
  Handlebars.registerHelper('eq', (a, b) => a === b);
  // Register additional helpers here if needed
}
