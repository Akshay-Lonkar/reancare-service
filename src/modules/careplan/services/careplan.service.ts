import { inject, injectable } from "tsyringe";
import { IPersonRepo } from "../../../database/repository.interfaces/person.repo.interface";
import { IUserTaskRepo } from "../../../database/repository.interfaces/user/user.task.repo.interface";
import { ICarePlanService } from "../interfaces/careplan.service.interface";
import { AhaCarePlanService } from "../providers/aha/aha.careplan.service";
import { PatientDomainModel } from "../../../domain.types/patient/patient/patient.domain.model";
import { CareplanArtifactDto } from "../domain.types/artifact/careplan.artifact.dto";
import { EnrollmentDomainModel } from "../domain.types/enrollment/enrollment.domain.model";
import { EnrollmentDto } from "../domain.types/enrollment/enrollment.dto";

////////////////////////////////////////////////////////////////////////

@injectable()
export class CarePlanService {

    _services: ICarePlanService[] = [];

    constructor(
        @inject('IPersonRepo') private personRepo: IPersonRepo,
        @inject('IUserTaskRepo') private userTaskRepo: IUserTaskRepo
    ) {
        this._services.push(new AhaCarePlanService(personRepo, userTaskRepo));
        //add any other care plan service ...
        //
    }
    
    init = async (): Promise<boolean> => {
        //Initialize all provider specific services
        for await (var service of this._services) {
            return await service.init();
        }
    };

    registerPatient = async (patientDomainModel: PatientDomainModel): Promise<any> => {
        return await this._services[0].registerPatient(patientDomainModel);
    }

    registerPatientToCarePlan =
    async (patientDomainModel: PatientDomainModel, enrollmentDomainModel: EnrollmentDomainModel): Promise<any> => {
        return await this._services[0].registerPatientToCarePlan(patientDomainModel, enrollmentDomainModel);
    }

    fetchTasks = async (enrollmentDto: EnrollmentDto): Promise<CareplanArtifactDto[]> => {
        return await this._services[0].fetchTasks(enrollmentDto);
    }

    fetchTasksDetails = async (id: string): Promise<any> => {
        return await this._services[0].fetchTasksDetails(id);
    }

    delete = async (id: string): Promise<any> => {
        return await this._services[0].delete(id);
    }

}
