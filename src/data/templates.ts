import { DocumentTemplate } from '../types';

export const documentTemplates: DocumentTemplate[] = [
  {
    type: 'earned-leave',
    name: 'Earned Leave Letter',
    fields: [
      { id: 'rcNo', label: 'RC NO', type: 'text', required: true },
      { id: 'hodNo', label: 'HOD No', type: 'text', required: true },
      { id: 'pcNo', label: 'PC No, HC No, ARSI No (If present)', type: 'text', required: false },
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'date', label: 'Issuing Date', type: 'text', required: true },
      { id: 'numberOfDays', label: 'Number of Days', type: 'number', required: true },
      { id: 'leaveFromDate', label: 'Leave from Date', type: 'text', required: true },
      { id: 'leaveToDate', label: 'Leave to Date', type: 'text', required: true },
      { id: 'leaveReason', label: 'Leave Reason', type: 'textarea', required: true }
    ]
  },
  {
    type: 'reward-letter',
    name: 'Reward Letter',
    fields: [
      { id: 'rcNo', label: 'Rc. No.', type: 'text', required: true },
      { id: 'hooNo', label: 'H. O. O No.', type: 'text', required: true },
      { id: 'date', label: 'Date', type: 'text', required: true },
      { id: 'issuedBy', label: 'Issued By', type: 'text', required: true },
      { id: 'subject', label: 'Subject', type: 'textarea', required: true },
      { id: 'referenceOrders', label: 'Reference Orders', type: 'textarea', required: true },
      { id: 'rewardDetails', label: 'Reward Details', type: 'textarea', required: true },
      { id: 'reasonForReward', label: 'Reason for Reward', type: 'textarea', required: true }
    ]
  },
  {
    type: 'medical-leave',
    name: 'Medical Leave',
    fields: [
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'dateOfSubmission', label: 'Date of Submission', type: 'text', required: true },
      { id: 'coyBelongsTo', label: 'Coy Belongs to', type: 'text', required: true },
      { id: 'rank', label: 'Rank', type: 'text', required: true },
      { id: 'leaveReason', label: 'Leave Reason', type: 'textarea', required: true },
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
      { id: 'unitAndDistrict', label: 'Unit and District', type: 'text', required: true }
    ]
  },
  {
    type: 'punishment-letter',
    name: 'Punishment Letter',
    fields: [
      { id: 'rcNo', label: 'R.c .No', type: 'text', required: true },
      { id: 'doNo', label: 'D.O No', type: 'text', required: true },
      { id: 'punishmentAwarded', label: 'Punishment_awarded', type: 'textarea', required: true },
      { id: 'deliqueryDescription', label: 'Deliquery_description', type: 'textarea', required: true },
      { id: 'issuedBy', label: 'issued by', type: 'text', required: true },
      { id: 'issuedDate', label: 'issued date', type: 'text', required: true }
    ]
  },
  {
    type: 'probation-letter',
    name: 'Probation Letter',
    fields: [
      { id: 'fieldName', label: 'Field Name', type: 'text', required: true },
      { id: 'serviceClassCategory', label: 'Service Class Category', type: 'text', required: true },
      { id: 'nameOfProbationer', label: 'Name of Probationer', type: 'text', required: true },
      { id: 'dateOfRegularization', label: 'Date of Regularization', type: 'text', required: true },
      { id: 'periodOfProbationPrescribed', label: 'Period of Probation Prescribed', type: 'text', required: true },
      { id: 'leaveTakenDuringProbation', label: 'Leave Taken During Probation', type: 'textarea', required: true },
      { id: 'dateOfCompletionOfProbation', label: 'Date of Completion of Probation', type: 'text', required: true },
      { id: 'testsToBePassedDuringProbation', label: 'Tests to be Passed During Probation', type: 'textarea', required: true },
      { id: 'punishmentsDuringProbation', label: 'Punishments During Probation', type: 'textarea', required: true },
      { id: 'pendingPROE', label: 'Pending PR/OE', type: 'textarea', required: true },
      { id: 'characterAndConduct', label: 'Character and Conduct', type: 'select', required: true, options: ['Satisfactory', 'Good', 'Excellent'] },
      { id: 'firingPracticeCompleted', label: 'Firing Practice Completed', type: 'select', required: true, options: ['YES', 'NO'] },
      { id: 'remarksOfICOfficer', label: 'Remarks of I/C Officer', type: 'textarea', required: true },
      { id: 'remarksOfCommandant', label: 'Remarks of Commandant', type: 'textarea', required: true },
      { id: 'remarksOfDIG', label: 'Remarks of DIG', type: 'textarea', required: true },
      { id: 'adgpOrders', label: 'ADGP Orders', type: 'textarea', required: true },
      { id: 'dateOfBirth', label: 'Date of Birth', type: 'text', required: true },
      { id: 'salary', label: 'Salary', type: 'text', required: true },
      { id: 'qualification', label: 'Qualification', type: 'text', required: true },
      { id: 'acceptanceOfSelfAppraisalReport', label: 'Acceptance of Self Appraisal Report', type: 'select', required: true, options: ['Accepted', 'Not Accepted'] },
      { id: 'assessmentOfOfficersPerformanceDuringTheYear', label: 'Assessment of Officer\'s Performance During the Year', type: 'textarea', required: true },
      // Reporting Officer nested fields
      { id: 'reportingOfficerDate', label: 'Reporting Officer – Date', type: 'text', required: true },
      { id: 'reportingOfficerName', label: 'Reporting Officer – Name', type: 'text', required: true },
      { id: 'reportingOfficerDesignation', label: 'Reporting Officer – Designation', type: 'text', required: true },
      // Countersigning Officer nested fields
      { id: 'countersigningOfficerDate', label: 'Countersigning Officer – Date', type: 'text', required: true },
      { id: 'countersigningOfficerName', label: 'Countersigning Officer – Name', type: 'text', required: true },
      { id: 'countersigningOfficerDesignation', label: 'Countersigning Officer – Designation', type: 'text', required: true },
      { id: 'countersigningOfficerRemarks', label: 'Countersigning Officer – Remarks', type: 'textarea', required: true },
      // HOD Opinion nested fields
      { id: 'hodOpinionDate', label: 'HOD Opinion – Date', type: 'text', required: true },
      { id: 'hodOpinionName', label: 'HOD Opinion – Name', type: 'text', required: true },
      { id: 'hodOpinionDesignation', label: 'HOD Opinion – Designation', type: 'text', required: true }
    ]
  }
];