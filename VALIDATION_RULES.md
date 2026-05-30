# Validation Rules Reference

This document serves as the single source of truth for all validation rules in ProdView. It addresses the duplicate validation logic between frontend (Zod schemas) and backend (class-validator DTOs).

## ⚠️ Important: Keeping Validations in Sync

**Current Architecture:**
- **Frontend**: Zod schemas in `src/lib/validationSchemas.ts` (client-side validation)
- **Backend**: class-validator decorators in `backend/src/*/dto/*.dto.ts` (server-side validation)

**Why we have duplicate validation:**
- Client-side validation provides immediate user feedback (UX)
- Server-side validation prevents malicious/bypassed requests (security)
- Different libraries (Zod vs class-validator) due to framework constraints

**When changing a validation rule:**
1. Update the **backend DTO first** (authoritative source for security)
2. Update the **frontend Zod schema** to match
3. Update this document to reflect the change
4. Test both frontend form submission and direct API calls

## Validation Rules by Entity

### Product Validation

**Name:**
- **Min length**: 3 characters
- **Max length**: 200 characters
- **Pattern** (backend only): `^[a-zA-Z0-9\s\-_&().,]+$`
- **Required**: Yes
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`

**Description:**
- **Min length**: 10 characters
- **Max length**: ⚠️ **INCONSISTENCY** - Backend: 10,000 / Frontend: 5,000
- **Required**: Yes
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`
- **Fix needed**: Align both to 5,000 characters (or update frontend to 10,000 if needed)

**Affiliate URL:**
- **Format**: Valid URL with http:// or https:// protocol
- **Max length**: 500 characters
- **Required**: Yes
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`

**Category IDs:**
- **Type**: Array of UUID v4 strings
- **Min items**: 1
- **Max items**: 10
- **Required**: Yes
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`

**Use Case IDs:**
- **Type**: Array of UUID v4 strings
- **Min items**: 1
- **Max items**: 10
- **Required**: Yes
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`

**Images:**
- **Type**: Array of strings (file paths or URLs)
- **Min items**: 1
- **Max items**: ⚠️ **INCONSISTENCY** - Backend: 20 / Frontend: 10
- **Required**: Yes
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`
- **Fix needed**: Align both to 10 images (or update frontend to 20 if storage supports it)

**Status:**
- **Type**: Enum - 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
- **Required**: No (defaults to DRAFT on backend)
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`

**Source URL** (Smart URL Preview):
- **Format**: Valid URL with http:// or https:// protocol
- **Max length**: 500 characters
- **Required**: No (optional feature)
- **Source**: `backend/src/products/dto/create-product.dto.ts`, `src/lib/validationSchemas.ts`

---

### Category Validation

**Name:**
- **Min length**: 2 characters
- **Max length**: 100 characters
- **Pattern**: Cannot start or end with spaces
- **Required**: Yes
- **Source**: `backend/src/categories/dto/create-category.dto.ts`, `src/lib/validationSchemas.ts`

**Parent Category ID:**
- **Type**: UUID v4 string or null
- **Required**: No
- **Source**: `backend/src/categories/dto/create-category.dto.ts`, `src/lib/validationSchemas.ts`

---

### Use Case Validation

**Name:**
- **Min length**: 2 characters
- **Max length**: 100 characters
- **Pattern**: Cannot start or end with spaces
- **Required**: Yes
- **Source**: `backend/src/use-cases/dto/create-use-case.dto.ts`, `src/lib/validationSchemas.ts`

---

### Authentication Validation

**Email:**
- **Format**: Valid email address (RFC 5322)
- **Max length**: ⚠️ **INCONSISTENCY** - Backend: 254 / Frontend: 255
- **Transform**: Converted to lowercase
- **Required**: Yes
- **Source**: `backend/src/auth/dto/login.dto.ts`, `src/lib/validationSchemas.ts`
- **Note**: RFC 5322 maximum is 254 characters, so backend is correct

**Password:**
- **Min length**: 8 characters
- **Max length**: 128 characters
- **Complexity** (backend only): ⚠️ **INCONSISTENCY**
  - Backend enforces: uppercase + lowercase + number + special character
  - Frontend: No complexity validation
- **Required**: Yes
- **Source**: `backend/src/auth/dto/login.dto.ts`, `src/lib/validationSchemas.ts`
- **Fix needed**: Add password complexity validation to frontend Zod schema

---

## Known Inconsistencies (Requires Fixing)

### 🔴 High Priority

1. **Password Complexity (Auth)**
   - Backend: Requires uppercase, lowercase, number, and special character
   - Frontend: No complexity validation
   - **Impact**: Users can create weak passwords in the UI, but they'll fail on the backend
   - **Fix**: Add complexity validation to `loginSchema` in `validationSchemas.ts`

### 🟡 Medium Priority

2. **Product Description Max Length**
   - Backend: 10,000 characters
   - Frontend: 5,000 characters
   - **Impact**: Users see 5,000 limit but backend accepts 10,000
   - **Fix**: Decide on limit and align both (recommend 5,000 for UX)

3. **Product Images Max Count**
   - Backend: 20 images
   - Frontend: 10 images
   - **Impact**: UI limits to 10 but backend could accept 20
   - **Fix**: Align to 10 images (or increase frontend if storage supports)

4. **Email Max Length**
   - Backend: 254 characters (RFC 5322 compliant)
   - Frontend: 255 characters
   - **Impact**: Minor, but frontend should match backend
   - **Fix**: Change frontend to 254 characters

---

## Future Improvements

### Option 1: Shared Validation Package
Create a shared npm package with validation constants:

```typescript
// shared-validations/product.ts
export const PRODUCT_VALIDATION = {
  name: {
    minLength: 3,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-_&().,]+$/,
  },
  description: {
    minLength: 10,
    maxLength: 5000,
  },
  // ...
} as const;
```

Then import in both frontend and backend to ensure consistency.

### Option 2: Generate DTOs from Zod Schemas
Use tools like `zod-to-ts` or `nestjs-zod` to auto-generate backend DTOs from Zod schemas.

### Option 3: Validation Testing
Add integration tests that verify frontend and backend validation rules match:

```typescript
// test: ensure Zod and class-validator have same rules
it('should reject product name < 3 characters on both frontend and backend', () => {
  // Test Zod schema
  // Test backend DTO via API call
  // Assert both reject
});
```

---

## Validation Error Messages

**Best Practices:**
- Keep error messages user-friendly and actionable
- Don't expose internal implementation details
- Be specific about requirements (e.g., "Must be at least 8 characters" not "Too short")
- Match error message tone between frontend and backend

**Current Approach:**
- Frontend: Detailed, user-friendly messages in Zod schemas
- Backend: Security-focused, less detailed (due to `disableErrorMessages: true` in `main.ts`)

---

## Checklist: Adding New Validation Rule

When adding a new validation rule:

- [ ] Define the rule in this document first
- [ ] Implement in backend DTO (`backend/src/*/dto/*.dto.ts`)
- [ ] Implement in frontend Zod schema (`src/lib/validationSchemas.ts`)
- [ ] Verify both implementations match exactly
- [ ] Test with valid data (should pass both)
- [ ] Test with invalid data (should fail both with clear errors)
- [ ] Update Swagger docs with `@ApiProperty()` decorator (backend)
- [ ] Update this document with the new rule

---

**Last Updated:** 2026-05-30
**Maintained By:** Development Team

For questions about validation rules, refer to this document first. If inconsistencies are found, open an issue and update this document.
