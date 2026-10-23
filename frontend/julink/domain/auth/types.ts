export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  email_verified: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  college: string | null;
  theme_preference: string;
  first_login: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface RegisterUserDTO {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  college: College;
  password: string;
}

export interface SimpleResponse {
  status: string;
  message?: string;
  email?: string;
  dev_code?: string;
}

export interface OtpVerificationDTO {
  email: string;
  otp: string;
}

export interface SendOtpDTO {
  email: string;
}

export interface ForgotPasswordOtpDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
}

export interface DeleteAccountOtpDTO {
  otp: string;
}

export const Colleges = {
  SCIENCE: "Faculty of Science",
  AGRICULTURE: "Faculty of Agriculture",
  ENGINEERING: "Faculty of Engineering",
  KING_ABDULLAH_II_IT: "King Abdullah II School of IT",
  ARTS: "Faculty of Arts",
  BUSINESS: "Faculty of Business",
  SHARIA: "Faculty of Sharia",
  EDUCATIONAL_SCIENCES: "Faculty of Educational Sciences",
  LAW: "Faculty of Law",
  PHYSICAL_EDUCATION: "Faculty of Physical Education",
  INTERNATIONAL_STUDIES: "Faculty of International Studies",
  FOREIGN_LANGUAGES: "Faculty of Languages",
  MEDICINE: "Faculty of Medicine",
  PHARMACY: "Faculty of Pharmacy",
  DENTISTRY: "Faculty of Dentistry",
  NURSING: "Faculty of Nursing",
  REHABILITATION_SCIENCES: "Faculty of Rehabilitation Sciences",
  TOURISM_AND_HOSPITALITY: "Faculty of Tourism and Hospitality",
} as const;

export type College = (typeof Colleges)[keyof typeof Colleges];
