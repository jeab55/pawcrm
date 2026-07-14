import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { createBase55Client } from './base55Client';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
const base44Sdk = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Preserve the existing entity API so pages can migrate incrementally. On Base55,
// Owner/Pet/Visit use the app-scoped MySQL contract; local/Base44 development keeps
// using the original SDK.
export const base44 = globalThis.B55AI?.db ? createBase55Client(base44Sdk) : base44Sdk;
