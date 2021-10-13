import ApiClient from '../models/api.client.model';
<<<<<<< HEAD:src/data/database/sequelize/mappers/client.mapper.ts
import { ApiClientDto, ClientApiKeyDto } from "../../../domain.types/api.client.domain.types";
=======
import { ApiClientDto, ClientApiKeyDto } from '../../../../domain.types/api.client/api.client.dto';
>>>>>>> main:src/database/sql/sequelize/mappers/client.mapper.ts

///////////////////////////////////////////////////////////////////////////////////

export class ClientMapper {

    static toDto = (client: ApiClient): ApiClientDto => {
        if (client == null){
            return null;
        }
        let active = false;
        if (client.ValidFrom < new Date() && client.ValidTill > new Date()) {
            active = true;
        }
        const dto: ApiClientDto = {
            id         : client.id,
            ClientName : client.ClientName,
            ClientCode : client.ClientCode,
            Phone      : client.Phone,
            Email      : client.Email,
            IsActive   : active
        };
        return dto;
    }

    static toClientSecretsDto = (client: ApiClient): ClientApiKeyDto => {
        if (client == null){
            return null;
        }
        const dto: ClientApiKeyDto = {
            id         : client.id,
            ClientName : client.ClientName,
            ClientCode : client.ClientCode,
            ApiKey     : client.ApiKey,
            ValidFrom  : client.ValidFrom,
            ValidTill  : client.ValidTill,
        };
        return dto;
    }

}
