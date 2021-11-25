import { Severity, uuid } from "../../miscellaneous/system.types";

export interface ComplaintDomainModel {
    id?                       : uuid;
    PatientUserId             : uuid;
    MedicalPractitionerUserId?: uuid;
    VisitId?                  : uuid;
    EhrId?                    : string;
    Complaint                 : string;
    Severity?                 : Severity;
    RecordDate?               : Date;
}
