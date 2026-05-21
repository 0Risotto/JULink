export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: "success" | "fail" | "error";
  token?: string;
  isFirstLogin?: boolean;
  message?: string;
}

export interface RegisterUserDTO {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  college: College;
  password: string;
}

// For createUser and OTP endpoints that return simple strings
export type SimpleResponse = string;

export interface OtpVerificationDTO {
  email: string;
  otp: string;
}

export interface SendOtpDTO {
  email: string;
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