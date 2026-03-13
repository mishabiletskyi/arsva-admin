import type {
  CurrentUserMembership,
  CurrentUserPropertyAccess,
} from "./access";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterManagerPayload = {
  email: string;
  password: string;
  full_name?: string;
  organization_id?: number;
  organization_slug?: string;
  signup_code?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type CurrentOrganizationScope = {
  id: number;
  name: string;
};

export type CurrentPropertyScope = {
  id: number;
  name: string;
  timezone: string;
};

export type RoleUi = "owner" | "manager" | "viewer";

export type CurrentUser = {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_platform_owner: boolean;
  role_ui: RoleUi;
  current_organization: CurrentOrganizationScope | null;
  available_properties: CurrentPropertyScope[];
  current_property_id: number | null;
  memberships: CurrentUserMembership[];
  property_accesses: CurrentUserPropertyAccess[];
};
