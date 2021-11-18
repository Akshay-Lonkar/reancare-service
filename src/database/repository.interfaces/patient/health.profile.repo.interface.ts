import { HealthProfileDomainModel } from "../../../domain.types/patient/health.profile/health.profile.domain.model";
import { HealthProfileDto } from "../../../domain.types/patient/health.profile/health.profile.dto";

export interface IHealthProfileRepo {

    create(domainModel: HealthProfileDomainModel)
        : Promise<HealthProfileDto>;

    getById(id: string): Promise<HealthProfileDto>;

    getByPatientUserId(patientUserId: string): Promise<HealthProfileDto>;

    updateByPatientUserId(userId: string, updateModel: HealthProfileDomainModel)
        : Promise<HealthProfileDto>;

    delete(id: string): Promise<boolean>;

}
