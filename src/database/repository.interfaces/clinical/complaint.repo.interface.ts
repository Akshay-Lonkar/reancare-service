import { ComplaintSearchResults, ComplaintSearchFilters } from "../../../domain.types/clinical/complaint/complaint.search.types";
import { ComplaintDomainModel } from "../../../domain.types/clinical/complaint/complaint.domain.model";
import { ComplaintDto } from "../../../domain.types/clinical/complaint/complaint.dto";

export interface IComplaintRepo {

    create(complaintDomainModel: ComplaintDomainModel): Promise<ComplaintDto>;

    getById(id: string): Promise<ComplaintDto>;

    search(filters: ComplaintSearchFilters): Promise<ComplaintSearchResults>;

    update(id: string, complaintDomainModel: ComplaintDomainModel): Promise<ComplaintDto>;

    delete(id: string): Promise<boolean>;

}
