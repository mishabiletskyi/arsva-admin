export type AppRole =
  | "platform_owner"
  | "org_admin"
  | "property_manager"
  | "viewer";

export type CurrentUserMembership = {
  organization_id: number;
  role: AppRole;
  is_active: boolean;
};

export type CurrentUserPropertyAccess = {
  property_id: number;
};

export type UserMembership = {
  id: number;
  organization_id: number;
  role: AppRole;
  is_active: boolean;
  created_at: string;
};

export type UserPropertyAccess = {
  id: number;
  property_id: number;
  created_at: string;
};

export type AuthScopeSelection = {
  organizationId: number | null;
  propertyId: number | null;
};
