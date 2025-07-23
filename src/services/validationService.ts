import { DocumentType } from '../types';

// Validation constants
const SECTION_CODES = new Set([
  "A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", 
  "C1", "C2", "C3", "C4", "C5", "D1", "D2", "D3", "D4", "D5", 
  "E1", "E2", "E3", "E4", "E5", "E6", "F1", "F2", "F3", "F4", "F5"
]);

const VALID_RANKS = new Set([
  "PC", "HC", "ASI", "SI", "CI", "RI", "RSI", "ARSI", "DSP", "ACP", "ASP", "Addl. SP",
  "SP", "DIG", "IGP", "ADGP", "DGP", "Police Constable", "Head Constable", "Assistant Sub Inspector",
  "Sub Inspector", "Circle Inspector", "Reserved Inspector", "Reserved Sub Inspector",
  "Armed Reserved Sub Inspector", "Deputy Superintendent of Police", "Assistant Commissioner of Police",
  "Assistant Superintendent of Police", "Additional Superintendent of Police", "Superintendent of Police",
  "Deputy Inspector General of Police", "Inspector General of Police", "Additional Director General of Police",
  "Director General of Police"
]);

const VALID_COYS = new Set([
  "A Coy", "B Coy", "C Coy", "D Coy", "E Coy", "F Coy",
  "HQ Coy", "QRT Coy", "RI Coy"
]);

const VALID_UNIT_DISTRICTS: Record<string, string> = {
  "1st": "Srikakulam",
  "2nd": "Kurnool", 
  "3rd": "Kakinada",
  "4th": "Rajamahendravaram",
  "5th": "Vizianagaram",
  "6th": "Mangalagiri",
  "7th": "Ongole",
  "8th": "Chittoor",
  "9th": "Venkatagiri",
  "11th": "Kadapa",
  "14th": "Ananthapuram",
  "16th": "Vishakapatnam"
};

const VALID_CHARACTER_CONDUCT = new Set(["Satisfactory", "Good", "Excellent"]);
const VALID_ACCEPTANCE_VALUES = new Set(["Accepted", "Not Accepted"]);
const VALID_FIRING_PRACTICE = new Set(["YES", "NO"]);
const VALID_PERFORMANCE = new Set(["Satisfactory", "Good", "Excellent"]);

// Helper functions
const validateDate = (value: string): boolean => {
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(value)) return false;
  
  const [day, month, year] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

const validateRcNo = (value: string): boolean => {
  const parts = value.trim().split("/");
  if (parts.length !== 3) return false;

  const [section, serial, year] = parts;
  if (!SECTION_CODES.has(section)) return false;
  if (!/^\d{1,4}$/.test(serial)) return false;
  if (!/^\d{4}$/.test(year)) return false;

  return true;
};

const validateHooNo = (value: string): boolean => {
  return /^\d{1,5}\/\d{4}$/.test(value);
};

const validateHodNo = (value: string): boolean => {
  return /^\d{1,4}\/\d{4}$/.test(value);
};

const validateName = (value: string): boolean => {
  return /^[A-Za-z .]+$/.test(value.trim());
};

const validatePhone = (value: string): boolean => {
  return /^[6-9]\d{9}$/.test(value);
};

const validateCoy = (value: string): boolean => {
  return VALID_COYS.has(value.trim());
};

const validateRank = (value: string): boolean => {
  return Array.from(VALID_RANKS).some(rank => 
    rank.toLowerCase() === value.trim().toLowerCase()
  );
};

const validateUnitAndDistrict = (value: string): boolean => {
  const trimmedValue = value.trim();
  return Object.entries(VALID_UNIT_DISTRICTS).some(([unit, district]) => 
    trimmedValue === `${unit} Bn. APSP, ${district}`
  );
};

const validatePcHcArsiNo = (value: string): boolean => {
  return /^(PC|HC|ARSI)-\d{1,4}$/.test(value.trim());
};

const validateRcNoPunishment = (value: string): boolean => {
  const pattern = new RegExp(`^\\d+/(${Array.from(SECTION_CODES).join('|')})/PR-\\d{1,4}/\\d{2}-\\d{2}$`);
  return pattern.test(value);
};

const validateDoNo = (value: string): boolean => {
  return /^\d+\/\d{4}$/.test(value);
};

const validatePunishmentAwarded = (value: string): boolean => {
  return /^PP\s+(I|II).*/i.test(value.trim());
};

const validateDelinquencyDescription = (value: string): boolean => {
  return Boolean(value && value.toLowerCase().includes("w.e.f"));
};

const validateIssuedBy = (value: string): boolean => {
  const valueLower = value.toLowerCase();
  const hasRank = Array.from(VALID_RANKS).some(rank => 
    rank.toLowerCase().includes(valueLower) || valueLower.includes(rank.toLowerCase())
  );
  const hasOffice = ["unit", "battalion", "district", "apsp", "police", "office", "commandant"]
    .some(word => valueLower.includes(word));
  return hasRank && hasOffice;
};

const validateSubject = (value: string): boolean => {
  return typeof value === 'string' && value.trim().split(' ').length >= 3;
};

const validateReferenceOrders = (refs: any[]): boolean => {
  if (!Array.isArray(refs) || refs.length === 0) return false;
  return refs.every(ref => /(GO|Memo|Order|Circular|No\.?)/i.test(ref));
};

const validateRewardDetails = (entries: any[]): boolean => {
  if (!Array.isArray(entries) || entries.length === 0) return false;
  
  return entries.every(entry => {
    if (!entry.Rank || !entry.Name || !entry.Reward) return false;
    if (!validateRank(entry.Rank)) return false;
    if (!/^[A-Za-z .]+$/.test(entry.Name.trim())) return false;
    return typeof entry.Reward === 'string' && entry.Reward.trim().length > 0;
  });
};

const validateDays = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
};

const validateNilOrDateRange = (value: string): boolean => {
  if (value.trim().toUpperCase() === "NIL") return true;
  return /^From: \d{2}-\d{2}-\d{4} To: \d{2}-\d{2}-\d{4}$/.test(value.trim());
};

const validateString = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

const validateCharacterConduct = (value: string): boolean => {
  return VALID_CHARACTER_CONDUCT.has(value.trim());
};

const validateFiringPractice = (value: string): boolean => {
  return VALID_FIRING_PRACTICE.has(value.trim().toUpperCase());
};

const validateFloat = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
};

const validateAcceptance = (value: string): boolean => {
  return VALID_ACCEPTANCE_VALUES.has(value.trim());
};

const validatePerformance = (value: string): boolean => {
  return VALID_PERFORMANCE.has(value.trim());
};

const validateReportingOfficer = (obj: any): boolean => {
  if (!obj.Name || !obj.Designation) return false;
  if (!validateString(obj.Name) || !validateString(obj.Designation)) return false;
  if (obj.Date && obj.Date.trim().toUpperCase() !== "NOT FOUND") {
    if (!validateDate(obj.Date)) return false;
  }
  return true;
};

const validateCountersigningOfficer = (obj: any): boolean => {
  if (!obj.Name || !obj.Designation || !obj.Remarks) return false;
  if (!validateString(obj.Name) || !validateString(obj.Designation) || !validateString(obj.Remarks)) return false;
  if (obj.Date && obj.Date.trim().toUpperCase() !== "NOT FOUND") {
    if (!validateDate(obj.Date)) return false;
  }
  return true;
};

const validateHodOpinion = (obj: any): boolean => {
  if (!obj.Opinion || !obj.Name || !obj.Designation) return false;
  if (!validateString(obj.Opinion) || !validateString(obj.Name) || !validateString(obj.Designation)) return false;
  if (obj.Date && !validateDate(obj.Date)) return false;
  return true;
};

// Validation functions for each document type
export const validateRewardLetter = (data: any, hasStamp: boolean, hasSignature: boolean) => {
  const validators: Record<string, (value: any) => boolean> = {
    "R c No": validateRcNo,
    "H. O. O No": validateHooNo,
    "Date": validateDate,
    "Issued By": validateIssuedBy,
    "Subject": validateSubject,
    "Reference Orders": validateReferenceOrders,
    "Reward Details": validateRewardDetails,
    "Reason for Reward": (value: string) => typeof value === 'string' && value.trim().split(' ').length >= 3,
    "Stamp": (value: boolean) => typeof value === 'boolean',
    "Signatures": (value: boolean) => typeof value === 'boolean'
  };

  const result = {
    status: "Approved" as "Approved" | "Disapproved",
    errors: {} as Record<string, string>
  };

  // Validate each field
  for (const [field, validator] of Object.entries(validators)) {
    if (field === "Stamp") {
      if (!validator(hasStamp)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid stamp status";
      }
    } else if (field === "Signatures") {
      if (!validator(hasSignature)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid signature status";
      }
    } else if (!(field in data)) {
      result.status = "Disapproved";
      result.errors[field] = "Missing field";
    } else if (!validator(data[field])) {
      result.status = "Disapproved";
      result.errors[field] = "Invalid format or value";
    }
  }

  return result;
};

export const validateEarnedLeave = (data: any, hasStamp: boolean, hasSignature: boolean) => {
  const validators: Record<string, (value: any) => boolean> = {
    "R c No.": validateRcNo,
    "H.O.D No.": validateHodNo,
    "Name": validateName,
    "Date": validateDate,
    "Number of Days": validateDays,
    "Leave From Date": validateDate,
    "Leave To Date": validateDate,
    "Leave Reason": validateString,
    "Stamp": (value: boolean) => typeof value === 'boolean',
    "Signatures": (value: boolean) => typeof value === 'boolean'
  };

  const result = {
    status: "Approved" as "Approved" | "Disapproved",
    errors: {} as Record<string, string>
  };

  // Validate each field
  for (const [field, validator] of Object.entries(validators)) {
    if (field === "Stamp") {
      if (!validator(hasStamp)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid stamp status";
      }
    } else if (field === "Signatures") {
      if (!validator(hasSignature)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid signature status";
      }
    } else if (!(field in data)) {
      result.status = "Disapproved";
      result.errors[field] = "Missing field";
    } else if (!validator(data[field])) {
      result.status = "Disapproved";
      result.errors[field] = "Invalid format or value";
    }
  }

  // Validate PC/HC/ARSI number if rank is applicable
  const rank = data["Rank"];
  if (["PC", "HC", "ARSI"].includes(rank)) {
    const field = "PC No. or HC No or ARSI No";
    if (!(field in data)) {
      result.status = "Disapproved";
      result.errors[field] = `Missing field for rank ${rank}`;
    } else if (!validatePcHcArsiNo(data[field])) {
      result.status = "Disapproved";
      result.errors[field] = "Invalid PC/HC/ARSI No format";
    }
  }

  // Validate date logic
  if (data["Leave From Date"] && data["Leave To Date"]) {
    try {
      const fromDate = new Date(data["Leave From Date"].split('-').reverse().join('-'));
      const toDate = new Date(data["Leave To Date"].split('-').reverse().join('-'));
      if (toDate < fromDate) {
        result.status = "Disapproved";
        result.errors["Leave To Date"] = "Leave To Date is earlier than Leave From Date";
      }
    } catch (e) {
      // Date parsing error already handled by date validator
    }
  }

  return result;
};

export const validatePunishmentLetter = (data: any, hasStamp: boolean, hasSignature: boolean) => {
  const validators: Record<string, (value: any) => boolean> = {
    "R c. No": validateRcNoPunishment,
    "D. O No": validateDoNo,
    "Order_date": validateDate,
    "Punishment_awarded": validatePunishmentAwarded,
    "Deliquency_Description": validateDelinquencyDescription,
    "Issued By": validateIssuedBy,
    "Issued Date": validateDate,
    "Stamp": (value: boolean) => typeof value === 'boolean',
    "Signature": (value: boolean) => typeof value === 'boolean'
  };

  const result = {
    status: "Approved" as "Approved" | "Disapproved",
    errors: {} as Record<string, string>
  };

  // Validate each field
  for (const [field, validator] of Object.entries(validators)) {
    if (field === "Stamp") {
      if (!validator(hasStamp)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid stamp status";
      }
    } else if (field === "Signature") {
      if (!validator(hasSignature)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid signature status";
      }
    } else if (!(field in data)) {
      result.status = "Disapproved";
      result.errors[field] = "Missing field";
    } else if (!validator(data[field])) {
      result.status = "Disapproved";
      result.errors[field] = "Invalid format or value";
    }
  }

  return result;
};

export const validateMedicalLeave = (data: any, hasStamp: boolean, hasSignature: boolean) => {
  const validators: Record<string, (value: any) => boolean> = {
    "Name": validateName,
    "Date of Submission": validateDate,
    "Coy Belongs to": validateCoy,
    "Rank": validateRank,
    "Leave Reason": validateString,
    "Phone Number": validatePhone,
    "Unit and District": validateUnitAndDistrict,
    "Stamp": (value: boolean) => typeof value === 'boolean',
    "Signature": (value: boolean) => typeof value === 'boolean'
  };

  const result = {
    status: "Approved" as "Approved" | "Disapproved",
    errors: {} as Record<string, string>
  };

  // Validate each field
  for (const [field, validator] of Object.entries(validators)) {
    if (field === "Stamp") {
      if (!validator(hasStamp)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid stamp status";
      }
    } else if (field === "Signature") {
      if (!validator(hasSignature)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid signature status";
      }
    } else if (!(field in data)) {
      result.status = "Disapproved";
      result.errors[field] = "Missing field";
    } else if (!validator(data[field])) {
      result.status = "Disapproved";
      result.errors[field] = "Invalid format or value";
    }
  }

  return result;
};

export const validateProbationLetter = (data: any, hasStamp: boolean, hasSignature: boolean) => {
  const validators: Record<string, (value: any) => boolean> = {
    "Service Class Category": validateString,
    "Name of Probationer": validateName,
    "Date of Regularization": validateDate,
    "Period of Probation Prescribed": validateString,
    "Leave Taken During Probation": validateNilOrDateRange,
    "Date of Completion of Probation": validateDate,
    "Tests to be Passed During Probation": validateString,
    "Punishments During Probation": validateString,
    "Pending PR/OE": validateString,
    "Character and Conduct": validateCharacterConduct,
    "Firing Practice Completed": validateFiringPractice,
    "Remarks of I/C Officer": validateString,
    "Remarks of Commandant": validateString,
    "Remarks of DIG": validateString,
    "ADGP Orders": validateString,
    "Date of Birth": validateDate,
    "Salary": validateFloat,
    "Qualification": validateString,
    "Acceptance of Self Appraisal Report – Part-I": validateAcceptance,
    "Assessment of Officer's Performance During the Year": validatePerformance,
    "Reporting Officer": validateReportingOfficer,
    "Countersigning Officer": validateCountersigningOfficer,
    "Head of Department Opinion": validateHodOpinion,
    "Stamp": (value: boolean) => typeof value === 'boolean',
    "Signature": (value: boolean) => typeof value === 'boolean'
  };

  const result = {
    status: "Approved" as "Approved" | "Disapproved",
    errors: {} as Record<string, string>
  };

  // Validate each field
  for (const [field, validator] of Object.entries(validators)) {
    if (field === "Stamp") {
      if (!validator(hasStamp)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid stamp status";
      }
    } else if (field === "Signature") {
      if (!validator(hasSignature)) {
        result.status = "Disapproved";
        result.errors[field] = "Invalid signature status";
      }
    } else if (!(field in data)) {
      result.status = "Disapproved";
      result.errors[field] = "Missing field";
    } else if (!validator(data[field])) {
      result.status = "Disapproved";
      result.errors[field] = "Invalid format or value";
    }
  }

  return result;
};

// Main validation function
export const validateDocument = (data: any, type: DocumentType, hasStamp: boolean, hasSignature: boolean) => {
  switch (type) {
    case 'reward-letter':
      return validateRewardLetter(data, hasStamp, hasSignature);
    case 'earned-leave':
      return validateEarnedLeave(data, hasStamp, hasSignature);
    case 'punishment-letter':
      return validatePunishmentLetter(data, hasStamp, hasSignature);
    case 'medical-leave':
      return validateMedicalLeave(data, hasStamp, hasSignature);
    case 'probation-letter':
      return validateProbationLetter(data, hasStamp, hasSignature);
    default:
      return {
        status: "Disapproved" as "Approved" | "Disapproved",
        errors: { "type": "Unknown document type" }
      };
  }
}; 