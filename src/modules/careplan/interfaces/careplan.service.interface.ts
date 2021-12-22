
import { PatientDomainModel } from "../../../domain.types/patient/patient/patient.domain.model";
import { CareplanArtifactDto } from "../domain.types/artifact/careplan.artifact.dto";
import { EnrollmentDomainModel } from "../domain.types/enrollment/enrollment.domain.model";
import { EnrollmentDto } from "../domain.types/enrollment/enrollment.dto";

export interface ICarePlanService {

    init(): Promise<boolean>;

    registerPatient(patientDomainModel: PatientDomainModel): Promise<any>;
    registerPatientToCarePlan
    (patientDomainModel: PatientDomainModel, enrollmentDomainModel: EnrollmentDomainModel): Promise<any>;
    fetchTasks(enrollmentDto: EnrollmentDto): Promise<CareplanArtifactDto[]>;
    fetchTasksDetails(id: string): Promise<any>;
    delete(id: string): Promise<any>;
}
