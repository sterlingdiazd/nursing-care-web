import type {
  CreateNurseProfileRequest,
  NurseProfileAdminRecord,
  NurseProfileIdentityRequest,
} from "../api/adminNurseProfiles";
import type { NurseProfileFormValues } from "../components/admin/AdminNurseProfileForm";

export function toNurseProfileFormValues(detail: NurseProfileAdminRecord): NurseProfileFormValues {
  return {
    name: detail.name ?? "",
    lastName: detail.lastName ?? "",
    identificationNumber: detail.identificationNumber ?? "",
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    hireDate: detail.hireDate ?? "",
    specialty: detail.specialty ?? "",
    licenseId: detail.licenseId ?? "",
    bankName: detail.bankName ?? "",
    accountNumber: detail.accountNumber ?? "",
    category: detail.category ?? "",
    password: "",
    confirmPassword: "",
    isOperationallyActive: detail.userIsActive && detail.nurseProfileIsActive,
  };
}

export function toNurseIdentityRequest(values: NurseProfileFormValues): NurseProfileIdentityRequest {
  return {
    name: values.name,
    lastName: values.lastName,
    identificationNumber: values.identificationNumber,
    phone: values.phone,
    email: values.email,
    hireDate: values.hireDate,
    specialty: values.specialty,
    licenseId: values.licenseId.trim() || null,
    bankName: values.bankName,
    accountNumber: values.accountNumber.trim() || null,
    category: values.category,
  };
}

export function toCreateNurseRequest(values: NurseProfileFormValues): CreateNurseProfileRequest {
  return {
    ...toNurseIdentityRequest(values),
    password: values.password,
    confirmPassword: values.confirmPassword,
    isOperationallyActive: values.isOperationallyActive,
  };
}
