import { ComplaintSearchFilters, ComplaintSearchResults } from "../../domain.types/clinical/complaint/complaint.search.types";
import { inject, injectable } from "tsyringe";
import { IComplaintRepo } from "../../database/repository.interfaces/clinical/complaint.repo.interface";
import { ComplaintDomainModel } from '../../domain.types/clinical/complaint/complaint.domain.model';
import { ComplaintDto } from '../../domain.types/clinical/complaint/complaint.dto';
import { uuid } from "../../domain.types/miscellaneous/system.types";

////////////////////////////////////////////////////////////////////////////////////////////////////////

@injectable()
export class ComplaintService {

    constructor(
        @inject('IComplaintRepo') private _complaintRepo: IComplaintRepo,
    ) {}

    create = async (complaintDomainModel: ComplaintDomainModel): Promise<ComplaintDto> => {
        return await this._complaintRepo.create(complaintDomainModel);
    };

    getById = async (id: uuid): Promise<ComplaintDto> => {
        return await this._complaintRepo.getById(id);
    };

    search = async (filters: ComplaintSearchFilters): Promise<ComplaintSearchResults> => {
        return await this._complaintRepo.search(filters);
    };

    update = async (id: uuid, complaintDomainModel: ComplaintDomainModel): Promise<ComplaintDto> => {
        return await this._complaintRepo.update(id, complaintDomainModel);
    };

    delete = async (id: uuid): Promise<boolean> => {
        return await this._complaintRepo.delete(id);
    };

}
