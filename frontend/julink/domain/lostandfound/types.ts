export enum CollegeEnum {
  SCIENCE = "SCIENCE",
  AGRICULTURE = "AGRICULTURE",
  ENGINEERING = "ENGINEERING",
  KING_ABDULLAH_II_IT = "KING_ABDULLAH_II_IT",
  ARTS = "ARTS",
  BUSINESS = "BUSINESS",
  SHARIA = "SHARIA",
  EDUCATIONAL_SCIENCES = "EDUCATIONAL_SCIENCES",
  LAW = "LAW",
  PHYSICAL_EDUCATION = "PHYSICAL_EDUCATION",
  INTERNATIONAL_STUDIES = "INTERNATIONAL_STUDIES",
  FOREIGN_LANGUAGES = "FOREIGN_LANGUAGES",
  MEDICINE = "MEDICINE",
  PHARMACY = "PHARMACY",
  DENTISTRY = "DENTISTRY",
  NURSING = "NURSING",
  REHABILITATION_SCIENCES = "REHABILITATION_SCIENCES",
  TOURISM_AND_HOSPITALITY = "TOURISM_AND_HOSPITALITY",
}

export type TypeEnum = "LOST" | "FOUND";

export interface LostAndFoundResponse {
  id: string;
  ownerId: number;
  ownerUsername: string;
  description: string;
  college: CollegeEnum;
  imageURL: string;
  phoneNumber?: string;
  type: TypeEnum;
  isResolved: boolean;
  createdAt: string;
}

export interface CreateLostAndFoundRequest {
  description: string;
  college: CollegeEnum;
  imageURL: string;
  phoneNumber?: string;
  type: TypeEnum;
}
