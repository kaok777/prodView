/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAuth from "../adminAuth.js";
import type * as analytics from "../analytics.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as authInternal from "../authInternal.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as products from "../products.js";
import type * as router from "../router.js";
import type * as security from "../security.js";
import type * as useCases from "../useCases.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAuth: typeof adminAuth;
  analytics: typeof analytics;
  audit: typeof audit;
  auth: typeof auth;
  authActions: typeof authActions;
  authInternal: typeof authInternal;
  categories: typeof categories;
  http: typeof http;
  products: typeof products;
  router: typeof router;
  security: typeof security;
  useCases: typeof useCases;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
