import { HealthPriorityType } from "../health.priority.type/health.priority.types";

export interface HealthPriorityDto {
    id?                  : string;
    PatientUserId        : string;
    Source?              : string;
    Provider?            : string;
    ProviderEnrollmentId : string;
    ProviderCareplanCode?: string;
    ProviderCareplanName?: string;
    HealthPriorityType?  : HealthPriorityType;
    StartedAt?           : Date;
    ScheduledEndDate?    : Date;
    IsPrimary?           : boolean;
}
