import { supabase } from './supabaseClient';

/**
 * Writes an immutable audit trail row. Insert-only by design (see admin_schema.sql —
 * no update/delete RLS policy exists for audit_logs, even for super admins).
 */
export async function logAdminAction(
  adminProfileId: number,
  action: string,
  resourceType: string,
  resourceId?: string | number | null,
  description?: string | null
) {
  const { error } = await supabase.from('audit_logs').insert({
    admin_user_id: adminProfileId,
    action,
    resource_type: resourceType,
    resource_id: resourceId != null ? String(resourceId) : null,
    description: description ?? null,
  });
  if (error) {
    // Never block the primary action on a logging failure — just surface it in the console.
    console.error('Failed to write audit log:', error.message);
  }
}
