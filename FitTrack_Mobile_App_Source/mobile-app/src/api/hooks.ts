import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

// ---- Types (mirror the Database Schema Design Document) ----
export interface Subscription {
  id: number;
  gymName: string;
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRING" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT";
}

export interface EnrollmentResult {
  subscription: Subscription | null;
  payment: {
    id: number;
    amount: number;
    paymentDate: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    reference: string;
  };
}

export interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
}

export interface AttendanceRecord {
  id: number;
  checkInAt: string;
  checkOutAt: string | null;
  status: "OPEN" | "CLOSED" | "AUTO_CLOSED";
}

export interface GymDashboard {
  activeMembers: number;
  activeSubscriptions: number;
  expiringWithin7Days: number;
  expired: number;
  revenueThisMonth: number;
  checkInsToday: number;
  activeMemberList: DashboardMembership[];
  expiringMembers: DashboardMembership[];
  expiredMembers: DashboardMembership[];
}

export interface DashboardMembership {
  memberId: number;
  name: string;
  phone: string | null;
  planName: string;
  endDate: string;
}

export interface GymPlan {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  status: "ACTIVE" | "ARCHIVED";
}

export interface GymProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  status: string;
  planTier: string;
}

export interface GymMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
  hasPhoto: boolean;
}

export interface MemberPage {
  content: GymMember[];
  totalElements: number;
}

export interface CreateMemberResult {
  member: GymMember;
  temporaryPassword: string;
}

export type LoginAccountType = "GYM_ADMIN" | "MEMBER" | "PLATFORM_ADMIN";

export type Role = "GYM_OWNER" | "GYM_STAFF" | "MEMBER" | "PLATFORM_ADMIN";

export interface AuthSession {
  user: { id: number; gymId: number | null; name: string; email: string; role: Role };
  accessToken: string;
  refreshToken: string;
}

// ---- Super admin (PLATFORM_ADMIN) types ----
export interface AdminGym {
  gymId: number;
  gymName: string;
  gymPhone: string;
  ownerName: string | null;
  ownerEmail: string | null;
  gymStatus: string;
  feeAmount: number | null;
  feeStatus: string | null;
  periodEnd: string | null;
  approvalStatus: string; // PENDING | APPROVED | REJECTED
  approvalNote: string | null;
  ownerStatus: string | null; // ACTIVE | INACTIVE
}

export interface AdminDashboard {
  totalGyms: number;
  activeGyms: number;
  expiringGyms: number;
  expiredGyms: number;
  monthlyRevenue: number;
  collectedRevenue: number;
}

// GET /api/v1/subscriptions/me
export function useMySubscription() {
  return useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => (await apiClient.get<Subscription>("/subscriptions/me")).data,
    staleTime: 60_000, // status doesn't need to refetch on every screen focus
    retry: false, // 404 when a member has no membership yet — screen handles it
  });
}

// POST /api/v1/subscriptions/me — member selects a plan (cash/online)
export function useEnrollInPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planId: number; paymentMethod: "CASH" | "ONLINE" }) =>
      (await apiClient.post<EnrollmentResult>("/subscriptions/me", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", "me"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "me"] });
    },
  });
}

export function useGymDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await apiClient.get<GymDashboard>("/dashboard")).data,
  });
}

export function useGymPlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await apiClient.get<GymPlan[]>("/plans")).data,
  });
}

export function useCreateGymPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: { name: string; durationDays: number; price: number }) =>
      (await apiClient.post<GymPlan>("/plans", plan)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useGymProfile() {
  return useQuery({
    queryKey: ["gym", "profile"],
    queryFn: async () => (await apiClient.get<GymProfile>("/gym/profile")).data,
  });
}

// GET /api/v1/payments/me
export function useMyPayments() {
  return useQuery({
    queryKey: ["payments", "me"],
    queryFn: async () => (await apiClient.get<Payment[]>("/payments/me")).data,
  });
}

// POST /api/v1/attendance/check-in
export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: "QR_SELF" | "APP_BUTTON") =>
      (await apiClient.post<AttendanceRecord>("/attendance/check-in", { source })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "me"] }),
  });
}

// POST /api/v1/attendance/{id}/check-out
export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendanceId: number) =>
      (await apiClient.post<AttendanceRecord>(`/attendance/${attendanceId}/check-out`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "me"] }),
  });
}

// GET /api/v1/attendance/me
export function useMyAttendance() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => (await apiClient.get<AttendanceRecord[]>("/attendance/me")).data,
  });
}

// POST /api/v1/auth/login
export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; accountType: LoginAccountType }) =>
      (await apiClient.post<AuthSession>("/auth/login", payload)).data,
  });
}

// Result of POST /auth/register-gym: the gym is created PENDING and the owner
// is NOT logged in — no tokens are returned until the super admin approves.
export interface RegisterGymResult {
  status: string; // PENDING
  message: string;
}

export function useRegisterGym() {
  return useMutation({
    mutationFn: async (payload: {
      gymName: string;
      gymPhone: string;
      ownerName: string;
      ownerEmail: string;
      password: string;
    }) => (await apiClient.post<RegisterGymResult>("/auth/register-gym", payload)).data,
  });
}

export interface ForgotPasswordResponse {
  message: string;
  expiresInSeconds: number | null;
}

// POST /api/v1/auth/forgot-password — requests a WhatsApp one-time password.
// Returns the same generic message whether or not the account exists.
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: { email: string; accountType: LoginAccountType }) =>
      (await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", payload)).data,
  });
}

// POST /api/v1/auth/reset-password — exchange the OTP for a new password.
export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      accountType: LoginAccountType;
      otp: string;
      newPassword: string;
    }) => (await apiClient.post<{ message: string }>("/auth/reset-password", payload)).data,
  });
}

export function useGymMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () =>
      (await apiClient.get<MemberPage>("/members?size=50&sort=name,asc")).data,
  });
}

// Owner/staff create a member with just the basics (name, email, phone). The
// member fills in their own profile and profile photo afterwards from the
// Profile tab (see useMyMemberProfile / useUploadMyMemberPhoto below).
export function useCreateGymMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; phone: string }) =>
      (await apiClient.post<CreateMemberResult>("/members", {
        name: input.name,
        email: input.email,
        phone: input.phone.trim() || null,
      })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useMarkMemberAsLeft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: number) => apiClient.put(`/members/${memberId}/status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateGymMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; name: string; phone: string }) =>
      (await apiClient.put<GymMember>(`/members/${input.id}`, { name: input.name, phone: input.phone || null })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useEraseGymMemberData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: number) => apiClient.post(`/members/${memberId}/erase-data`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

// ---- Member self-service profile (the member maintains their own account) ----

// GET /api/v1/members/me — the signed-in member's own profile.
export function useMyMemberProfile() {
  return useQuery({
    queryKey: ["members", "me"],
    queryFn: async () => (await apiClient.get<GymMember>("/members/me")).data,
  });
}

// PUT /api/v1/members/me — the member edits their own name/phone.
export function useUpdateMyMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone: string }) =>
      (await apiClient.put<GymMember>("/members/me", {
        name: input.name,
        phone: input.phone.trim() || null,
      })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", "me"] }),
  });
}

// POST /api/v1/members/me/photo — upload/replace own profile photo (multipart).
export function useUploadMyMemberPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photo: { uri: string; name: string; type: string }) => {
      const form = new FormData();
      form.append("photo", photo as any);
      return (await apiClient.post<GymMember>("/members/me/photo", form)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", "me"] }),
  });
}

// DELETE /api/v1/members/me/photo — remove own profile photo.
export function useDeleteMyMemberPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => apiClient.delete("/members/me/photo"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", "me"] }),
  });
}

// ---- Super admin (PLATFORM_ADMIN) hooks ----
// GET /api/v1/admin/gyms
export function useAdminGyms() {
  return useQuery({
    queryKey: ["admin", "gyms"],
    queryFn: async () => (await apiClient.get<AdminGym[]>("/admin/gyms")).data,
  });
}

// GET /api/v1/admin/dashboard
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => (await apiClient.get<AdminDashboard>("/admin/dashboard")).data,
  });
}

// POST /api/v1/admin/gyms — super admin creates a gym + its owner admin
export function useAdminCreateGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      gymName: string;
      gymPhone: string;
      ownerName: string;
      ownerEmail: string;
      password: string;
    }) => (await apiClient.post<AdminGym>("/admin/gyms", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// PUT /api/v1/admin/gyms/{id}/status
export function useAdminSetGymStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gymId: number; status: string }) =>
      (await apiClient.put<AdminGym>(`/admin/gyms/${input.gymId}/status`, { status: input.status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// PUT /api/v1/admin/gyms/{id}/fee — set this gym's recurring monthly platform fee
export function useAdminSetGymFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gymId: number; amount: number }) =>
      (await apiClient.put<AdminGym>(`/admin/gyms/${input.gymId}/fee`, { amount: input.amount })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// POST /api/v1/admin/gyms/{id}/charge — extend a gym's paid period by one month
export function useAdminChargeGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gymId: number) =>
      (await apiClient.post<AdminGym>(`/admin/gyms/${gymId}/charge`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// GET /api/v1/admin/registrations — pending + rejected self-registration requests
export function useAdminRegistrations() {
  return useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: async () => (await apiClient.get<AdminGym[]>("/admin/registrations")).data,
  });
}

// POST /api/v1/admin/registrations/{id}/approve — let a self-registered admin sign in
export function useAdminApproveRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gymId: number) =>
      (await apiClient.post<AdminGym>(`/admin/registrations/${gymId}/approve`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// POST /api/v1/admin/registrations/{id}/reject — refuse a self-registration (optional note)
export function useAdminRejectRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gymId: number; note?: string }) =>
      (await apiClient.post<AdminGym>(`/admin/registrations/${input.gymId}/reject`, { note: input.note ?? null })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// PUT /api/v1/admin/gyms/{id} — edit an existing gym + its owner's display name
export function useAdminUpdateGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gymId: number; gymName: string; gymPhone: string; ownerName: string }) =>
      (await apiClient.put<AdminGym>(`/admin/gyms/${input.gymId}`, {
        gymName: input.gymName,
        gymPhone: input.gymPhone,
        ownerName: input.ownerName,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// DELETE /api/v1/admin/gyms/{id} — permanently delete a gym workspace and its data
export function useAdminDeleteGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gymId: number) => apiClient.delete(`/admin/gyms/${gymId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}


