import { BaseSearchResults, BaseSearchFilters } from "../../../domain.types/miscellaneous/base.search.types";
import { Severity } from "../../../domain.types/miscellaneous/system.types";
import { ComplaintDto } from "./complaint.dto";

//////////////////////////////////////////////////////////////////////

export interface ComplaintSearchFilters extends BaseSearchFilters{
    PatientUserId?            : string;
    MedicalPractitionerUserId?: string;
    VisitId?                  : string;
    Complaint?                : string;
    Severity?                 : Severity;
    DateFrom                  : Date;
    DateTo                    : Date;
}

export interface ComplaintSearchResults extends BaseSearchResults{
    Items: ComplaintDto[];
}
