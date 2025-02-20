import {
    AssessmentNodeType,
    CAssessmentNode,
    CAssessmentNodePath,
    CAssessmentPathCondition,
    CAssessmentQueryOption,
    CAssessmentQueryResponse,
    CAssessmentTemplate,
    BiometricQueryAnswer,
    FloatQueryAnswer,
    IntegerQueryAnswer,
    MessageAnswer,
    MultipleChoiceQueryAnswer,
    SingleChoiceQueryAnswer,
    TextQueryAnswer,
} from '../../../../domain.types/clinical/assessment/assessment.types';
import { AssessmentTemplateDto } from '../../../../domain.types/clinical/assessment/assessment.template.dto';
import { uuid } from '../../../../domain.types/miscellaneous/system.types';

////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface IAssessmentHelperRepo {
    getChildrenConditions(id: string): CAssessmentPathCondition[] | PromiseLike<CAssessmentPathCondition[]>;
    
    getNodeListChildren(nodeId: string): Promise<CAssessmentNode[]>;

    addTemplate(template: CAssessmentTemplate): Promise<AssessmentTemplateDto>;

    getNodeById(nodeId: uuid): Promise<CAssessmentNode>;

    getQueryResponse(assessmentId: uuid, nodeId: uuid): Promise<CAssessmentQueryResponse>;

    getUserResponses(assessmentId: uuid): Promise<CAssessmentQueryResponse[]>;

    getQuestionNodeOptions(nodeType: AssessmentNodeType, nodeId: uuid): Promise<CAssessmentQueryOption[]>;

    getQuestionNodePaths(nodeType: AssessmentNodeType, nodeId: uuid): Promise<CAssessmentNodePath[]>;

    getPathCondition(conditionId: string, nodeId: string, pathId: string): Promise<CAssessmentPathCondition>;

    createQueryResponse(answer: | SingleChoiceQueryAnswer
        | MultipleChoiceQueryAnswer
        | MessageAnswer
        | TextQueryAnswer
        | IntegerQueryAnswer
        | FloatQueryAnswer
        | BiometricQueryAnswer): Promise<CAssessmentQueryResponse>;

}
