import { uuid } from "../../../../domain.types/miscellaneous/system.types";

export interface BodyHeightDomainModel {
    id?              : uuid;
    EhrId?           : string;
    PatientUserId    : uuid;
    BodyHeight       : number;
    Unit             : string;
    RecordDate?      : Date;
    RecordedByUserId?: uuid;
}
