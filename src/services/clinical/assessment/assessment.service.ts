import { inject, injectable } from 'tsyringe';
import { ApiError } from '../../../common/api.error';
import { IAssessmentHelperRepo } from '../../../database/repository.interfaces/clinical/assessment/assessment.helper.repo.interface';
import { IAssessmentRepo } from '../../../database/repository.interfaces/clinical/assessment/assessment.repo.interface';
import { IAssessmentTemplateRepo } from '../../../database/repository.interfaces/clinical/assessment/assessment.template.repo.interface';
import { AssessmentHelperMapper } from '../../../database/sql/sequelize/mappers/clinical/assessment/assessment.helper.mapper';
import { AssessmentAnswerDomainModel } from '../../../domain.types/clinical/assessment/assessment.answer.domain.model';
import { AssessmentDomainModel } from '../../../domain.types/clinical/assessment/assessment.domain.model';
import { AssessmentDto } from '../../../domain.types/clinical/assessment/assessment.dto';
import { AssessmentQueryDto } from '../../../domain.types/clinical/assessment/assessment.query.dto';
import { AssessmentQuestionResponseDto } from '../../../domain.types/clinical/assessment/assessment.question.response.dto';
import {
    AssessmentSearchFilters,
    AssessmentSearchResults
} from '../../../domain.types/clinical/assessment/assessment.search.types';
import {
    AssessmentNodeType, BiometricQueryAnswer,
    FloatQueryAnswer,
    IntegerQueryAnswer,
    MessageAnswer,
    MultipleChoiceQueryAnswer, QueryResponseType,
    CAssessmentMessageNode,
    CAssessmentNode,
    CAssessmentNodePath,
    CAssessmentQueryOption,
    CAssessmentQuestionNode, SingleChoiceQueryAnswer, TextQueryAnswer
} from '../../../domain.types/clinical/assessment/assessment.types';
import { ProgressStatus, uuid } from '../../../domain.types/miscellaneous/system.types';
import { Loader } from '../../../startup/loader';
import { AssessmentBiometricsHelper } from './assessment.biometrics.helper';
import { ConditionProcessor } from './condition.processor';

////////////////////////////////////////////////////////////////////////////////////////////////////////

@injectable()
export class AssessmentService {
    
    _conditionProcessor: ConditionProcessor = null;

    constructor(
        @inject('IAssessmentRepo') private _assessmentRepo: IAssessmentRepo,
        @inject('IAssessmentHelperRepo') private _assessmentHelperRepo: IAssessmentHelperRepo,
        @inject('IAssessmentTemplateRepo') private _assessmentTemplateRepo: IAssessmentTemplateRepo,
    ) {
        this._conditionProcessor = Loader.container.resolve(ConditionProcessor);
    }

    public create = async (model: AssessmentDomainModel): Promise<AssessmentDto> => {
        if (model.AssessmentTemplateId == null) {
            throw new Error('Invalid template id');
        }
        const template = await this._assessmentTemplateRepo.getById(model.AssessmentTemplateId);

        var code = template.DisplayCode ? template.DisplayCode.split('#')[1] : '';
        var datestr = (new Date()).toISOString()
            .split('T')[0];
        const displayCode = 'Assessment#' + code + ':' + datestr;
        model.DisplayCode = displayCode;
        model.Description = template.Description;
        model.Provider = template.Provider;
        model.ProviderAssessmentCode = template.ProviderAssessmentCode;
        model.Title = model.Title ?? template.Title;
        model.Type = template.Type;
        model.ScheduledDateString = model.ScheduledDateString ?? new Date().toISOString()
            .split('T')[0];

        return await this._assessmentRepo.create(model);
    };

    public getById = async (id: string): Promise<AssessmentDto> => {
        return await this._assessmentRepo.getById(id);
    };

    public search = async (filters: AssessmentSearchFilters): Promise<AssessmentSearchResults> => {
        return await this._assessmentRepo.search(filters);
    };

    public update = async (id: string, assessmentDomainModel: AssessmentDomainModel): Promise<AssessmentDto> => {
        return await this._assessmentRepo.update(id, assessmentDomainModel);
    };

    public delete = async (id: string): Promise<boolean> => {
        return await this._assessmentRepo.delete(id);
    };

    public startAssessment = async (id: uuid): Promise<AssessmentQueryDto> => {
        var assessment = await this._assessmentRepo.getById(id);
        if (assessment.Status === ProgressStatus.InProgress && assessment.StartedAt !== null) {
            throw new Error('Assessment is already in progress.');
        }
        if (assessment.Status === ProgressStatus.Cancelled) {
            throw new Error('Assessment has been cancelled.');
        }
        if (assessment.Status === ProgressStatus.Completed) {
            throw new Error('Assessment has already been completed.');
        }
        assessment = await this._assessmentRepo.startAssessment(id);

        const template = await this._assessmentTemplateRepo.getById(assessment.AssessmentTemplateId);
        if (!template) {
            throw new Error(`Error while starting assessment. Cannot find template.`);
        }

        const rootNodeId = template.RootNodeId;
        if (!rootNodeId) {
            throw new Error(`Error while starting assessment. Cannot find template root node.`);
        }

        var nextQuestion: AssessmentQueryDto = await this.traverse(assessment, rootNodeId);

        return nextQuestion;
    };

    public answerQuestion = async (answerModel: AssessmentAnswerDomainModel)
        : Promise<AssessmentQuestionResponseDto> => {

        const nodeId = answerModel.QuestionNodeId;
        const assessmentId = answerModel.AssessmentId;

        //Check if the this question node is from same template as assessment
        const node = (await this._assessmentHelperRepo.getNodeById(nodeId));
        if (!node) {
            throw new ApiError(404, `Question with id ${nodeId} cannot be found!`);
        }
        const assessment = await this._assessmentRepo.getById(assessmentId);
        if (!assessment) {
            throw new ApiError(404, `Assessment with id ${assessmentId} cannot be found!`);
        }
        if (node.TemplateId !== assessment.AssessmentTemplateId) {
            throw new ApiError(400, `Template associated with assessment dows not match with the question!`);
        }

        var isAnswered = await this.isAnswered(assessmentId, nodeId);
        if (isAnswered) {
            return null;
        }

        const incomingResponseType = answerModel.ResponseType;
        const nodeType = node.NodeType;

        //Convert the answer to the format which we can persist

        if (nodeType === AssessmentNodeType.Question) {
            return await this.handleAnswersToQuestion(answerModel, assessment, node, incomingResponseType);
        }
        else if (nodeType === AssessmentNodeType.Message && incomingResponseType === QueryResponseType.Ok) {
            const messageNode = node as CAssessmentMessageNode;
            return await this.handleAcknowledgement(assessment, messageNode);
        }

        return null;
    };

    public getQuestionById = async (assessmentId: uuid, questionId: uuid): Promise<AssessmentQueryDto | string> => {
        const questionNode = await this._assessmentHelperRepo.getNodeById(questionId);
        if (
            questionNode.NodeType !== AssessmentNodeType.Question &&
            questionNode.NodeType !== AssessmentNodeType.Message
        ) {
            return `The node with id ${questionId} is not a question!`;
        }
        const assessment = await this._assessmentRepo.getById(assessmentId);
        if (questionNode.NodeType === AssessmentNodeType.Question) {
            return this.questionNodeAsQueryDto(questionNode, assessment);
        } else {
            return this.messageNodeAsQueryDto(questionNode, assessment);
        }
    };

    public getNextQuestion = async (assessmentId: uuid): Promise<AssessmentQueryDto> => {
        const assessment = await this._assessmentRepo.getById(assessmentId);
        const currentNodeId = assessment.CurrentNodeId;
        return await this.traverse(assessment, currentNodeId);
    };

    public getAssessmentStatus = async (assessmentId: uuid): Promise<ProgressStatus> => {
        const assessment = await this._assessmentRepo.getById(assessmentId);
        return assessment.Status as ProgressStatus;
    };

    public completeAssessment = async (assessmentId: uuid): Promise<AssessmentDto> => {
        var assessment = await this._assessmentRepo.completeAssessment(assessmentId);
        var responses = await this._assessmentHelperRepo.getUserResponses(assessmentId);
        assessment.UserResponses = responses;
        return assessment;
    };

    public isAnswered = async (assessmentId: uuid, currentNodeId: uuid) => {
        const response = await this._assessmentHelperRepo.getQueryResponse(assessmentId, currentNodeId);
        return response !== null;
    };

    //#region Privates

    private async traverseUpstream(currentNode: CAssessmentNode): Promise<CAssessmentNode> {
        const parentNode = await this._assessmentHelperRepo.getNodeById(currentNode.ParentNodeId);
        if (parentNode === null) {
            //We have reached the root node of the assessment
            return null; //Check for this null which means the assessment is over...
        }
        var siblingNodes = await this._assessmentHelperRepo.getNodeListChildren(currentNode.ParentNodeId);
        if (siblingNodes.length === 0) {
            //The parent node is either a question node or message node
            //In this case, check the siblings of its parent.
            return this.traverseUpstream(parentNode);
        }
        const currentSequence = currentNode.Sequence;
        for await (var sibling of siblingNodes) {
            if (sibling.Sequence === currentSequence + 1) {
                return sibling;
            }
        }
        //Since we no longer can find the next sibling, retract tracing by one step, move onto the parent
        return this.traverseUpstream(parentNode);
    }

    private async iterateListNodeChildren(assessment: AssessmentDto, currentNodeId: uuid)
        : Promise<AssessmentQueryDto> {
        var childrenNodes = await this._assessmentHelperRepo.getNodeListChildren(currentNodeId);
        for await (var childNode of childrenNodes) {
            if ((childNode.NodeType as AssessmentNodeType) === AssessmentNodeType.NodeList) {
                const nextNode = await this.traverse(assessment, childNode.id);
                if (nextNode != null) {
                    return nextNode;
                } else {
                    continue;
                }
            } else {
                return await this.traverse(assessment, childNode.id);
            }
        }
        return null;
    }

    private async traverseQuestionNode(assessment: AssessmentDto, currentNode: CAssessmentNode)
        : Promise<AssessmentQueryDto> {
        var isAnswered = await this.isAnswered(assessment.id, currentNode.id);
        if (!isAnswered) {
            return await this.returnAsCurrentQuestionNode(assessment, currentNode as CAssessmentQuestionNode);
        } else {
            const nextSiblingNode = await this.traverseUpstream(currentNode);
            if (nextSiblingNode === null) {
                //Assessment has finished
                return null;
            }
            return await this.traverse(assessment, nextSiblingNode.id);
        }
    }

    private async traverseMessageNode(assessment: AssessmentDto, currentNode: CAssessmentNode)
        : Promise<AssessmentQueryDto> {
        var isAnswered = await this.isAnswered(assessment.id, currentNode.id);
        if (!isAnswered) {
            return await this.returnAsCurrentMessageNode(assessment, currentNode as CAssessmentMessageNode);
        } else {
            const nextSiblingNode = await this.traverseUpstream(currentNode);
            if (nextSiblingNode === null) {
            //Assessment has finished
                return null;
            }
            return await this.traverse(assessment, nextSiblingNode.id);
        }
    }

    private async traverse(assessment: AssessmentDto, currentNodeId: uuid): Promise<AssessmentQueryDto> {
        const currentNode = await this._assessmentHelperRepo.getNodeById(currentNodeId);
        if (!currentNode) {
            throw new Error(`Error while executing assessment. Cannot find the node!`);
        }

        if (currentNode.NodeType === AssessmentNodeType.NodeList) {
            return await this.iterateListNodeChildren(assessment, currentNodeId);
        }
        else {
            if (currentNode.NodeType === AssessmentNodeType.Question) {
                return await this.traverseQuestionNode(assessment, currentNode);
            }
            else if (currentNode.NodeType === AssessmentNodeType.Message) {
                return await this.traverseMessageNode(assessment, currentNode);
            }
        }
    }

    private async returnAsCurrentMessageNode(
        assessment: AssessmentDto,
        currentNode: CAssessmentMessageNode
    ): Promise<AssessmentQueryDto> {
        //Set as current node if not already
        await this._assessmentRepo.setCurrentNode(assessment.id, currentNode.id);
        return this.messageNodeAsQueryDto(currentNode, assessment);
    }

    private async returnAsCurrentQuestionNode(
        assessment: AssessmentDto,
        currentNode: CAssessmentQuestionNode
    ): Promise<AssessmentQueryDto> {
        //Set as current node if not already
        await this._assessmentRepo.setCurrentNode(assessment.id, currentNode.id);
        return this.questionNodeAsQueryDto(currentNode, assessment);
    }

    private async processPathConditions(
        assessment: AssessmentDto,
        nodeId: uuid,
        currentQueryDto: AssessmentQueryDto,
        paths: CAssessmentNodePath[],
        answerDto: | SingleChoiceQueryAnswer
        | MultipleChoiceQueryAnswer
        | MessageAnswer
        | TextQueryAnswer
        | IntegerQueryAnswer
        | FloatQueryAnswer
        | BiometricQueryAnswer,
        chosenOptions: any) {

        //Persist the answer
        await this._assessmentHelperRepo.createQueryResponse(answerDto);

        if (paths.length === 0) {
            //In case there are no paths...
            //This question node is a leaf node and should use traverseUp to find the next stop...
            return await this.respondToUserAnswer(assessment, nodeId, currentQueryDto, answerDto);
        }
        else {
            var chosenPath: CAssessmentNodePath = null;
            for await (var path of paths) {
                const pathId = path.id;
                const conditionId = path.ConditionId;
                const condition = await this._assessmentHelperRepo.getPathCondition(conditionId, nodeId, pathId);
                if (!condition) {
                    continue;
                }
                const resolved = await this._conditionProcessor.processCondition(condition, chosenOptions);
                if (resolved === true) {
                    chosenPath = path;
                    break;
                }
            }
            if (chosenPath !== null) {
                return await this.respondToUserAnswer(assessment, chosenPath.NextNodeId, currentQueryDto, answerDto);
            } else {
                return await this.respondToUserAnswer(assessment, nodeId, currentQueryDto, answerDto);
            }
        }
    }

    private async handleSingleChoiceSelectionAnswer(
        assessment: AssessmentDto,
        questionNode: CAssessmentQuestionNode,
        answerModel: AssessmentAnswerDomainModel
    ): Promise<AssessmentQuestionResponseDto> {

        const { minSequenceValue, maxSequenceValue, options, paths, nodeId } = await this.getChoiceSelectionParams(
            questionNode
        );

        const currentQueryDto = this.questionNodeAsQueryDto(questionNode, assessment);

        const chosenOptionSequence = answerModel.IntegerValue;
        if (
            !chosenOptionSequence ||
            chosenOptionSequence < minSequenceValue ||
            chosenOptionSequence > maxSequenceValue
        ) {
            throw new Error(`Invalid option index! Cannot process the condition!`);
        }
        const answer = options.find((x) => x.Sequence === chosenOptionSequence);
        const answerDto = AssessmentHelperMapper.toSingleChoiceAnswerDto(
            assessment.id,
            questionNode,
            chosenOptionSequence,
            answer
        );

        return await this.processPathConditions(
            assessment, nodeId, currentQueryDto, paths, answerDto, chosenOptionSequence);

    }

    private async handleMultipleChoiceSelectionAnswer(
        assessment: AssessmentDto,
        questionNode: CAssessmentQuestionNode,
        answerModel: AssessmentAnswerDomainModel
    ): Promise<AssessmentQuestionResponseDto> {

        const { minSequenceValue, maxSequenceValue, options, paths, nodeId } = await this.getChoiceSelectionParams(
            questionNode
        );

        const currentQueryDto = this.questionNodeAsQueryDto(questionNode, assessment);

        const chosenOptionSequences = answerModel.IntegerArray;
        const selectedOptions: CAssessmentQueryOption[] = [];
        for (var choice of chosenOptionSequences) {
            if (!choice || choice < minSequenceValue || choice > maxSequenceValue) {
                throw new Error(`Invalid option index! Cannot process the condition!`);
            }
            const answer = options.find((x) => x.Sequence === choice);
            selectedOptions.push(answer);
        }

        const answerDto = AssessmentHelperMapper.toMultiChoiceAnswerDto(
            assessment.id,
            questionNode,
            chosenOptionSequences,
            selectedOptions
        );

        return await this.processPathConditions(
            assessment, nodeId, currentQueryDto, paths, answerDto, chosenOptionSequences);

    }

    private async handleBiometricsAnswer(
        assessment: AssessmentDto,
        questionNode: CAssessmentQuestionNode,
        answerModel: AssessmentAnswerDomainModel
    ): Promise<AssessmentQuestionResponseDto> {

        const currentQueryDto = this.questionNodeAsQueryDto(questionNode, assessment);
        const answerDto = AssessmentHelperMapper.toBiometricsAnswerDto(
            assessment.id,
            questionNode,
            answerModel.Biometrics
        );

        await this._assessmentHelperRepo.createQueryResponse(answerDto);
        if (answerDto.ResponseType === QueryResponseType.Biometrics) {
            const biometricsHelper = Loader.container.resolve(AssessmentBiometricsHelper);
            await biometricsHelper.persistBiometrics(assessment.PatientUserId, answerDto);
        }
        return await this.respondToUserAnswer(assessment, questionNode.id, currentQueryDto, answerDto);
    }

    private async handleTextAnswer(
        assessment: AssessmentDto,
        questionNode: CAssessmentQuestionNode,
        answerModel: AssessmentAnswerDomainModel
    ): Promise<AssessmentQuestionResponseDto> {
        
        const currentQueryDto = this.questionNodeAsQueryDto(questionNode, assessment);
        const answerDto = AssessmentHelperMapper.toTextAnswerDto(
            assessment.id,
            questionNode,
            answerModel.TextValue
        );

        await this._assessmentHelperRepo.createQueryResponse(answerDto);
        return await this.respondToUserAnswer(assessment, questionNode.id, currentQueryDto, answerDto);
    }

    private async handleAcknowledgement(
        assessment: AssessmentDto,
        messageNode: CAssessmentMessageNode
    ): Promise<AssessmentQuestionResponseDto> {

        const currentQueryDto = this.questionNodeAsQueryDto(messageNode, assessment);

        const answerDto = AssessmentHelperMapper.toMessageAnswerDto(
            assessment.id,
            messageNode,
        );

        await this._assessmentHelperRepo.createQueryResponse(answerDto);
        return await this.respondToUserAnswer(assessment, messageNode.id, currentQueryDto, answerDto);
    }

    private async respondToUserAnswer(
        assessment: AssessmentDto,
        nextNodeId: string,
        currentQueryDto: AssessmentQueryDto,
        answerDto:
            | SingleChoiceQueryAnswer
            | MultipleChoiceQueryAnswer
            | MessageAnswer
            | TextQueryAnswer
            | IntegerQueryAnswer
            | FloatQueryAnswer
            | BiometricQueryAnswer
    ) {
        const next = await this.traverse(assessment, nextNodeId);
        if (next === null) {
            return null;
        }
        const response: AssessmentQuestionResponseDto = {
            AssessmentId : assessment.id,
            Parent       : currentQueryDto,
            Answer       : answerDto,
            Next         : next,
        };
        return response;
    }

    private async getChoiceSelectionParams(questionNode: CAssessmentNode) {
        const nodeId = questionNode.id;
        const nodeType = questionNode.NodeType as AssessmentNodeType;
        const paths: CAssessmentNodePath[] = await this._assessmentHelperRepo.getQuestionNodePaths(nodeType, nodeId);
        const options: CAssessmentQueryOption[] = await this._assessmentHelperRepo.getQuestionNodeOptions(
            nodeType,
            nodeId
        );
        if (options.length === 0) {
            throw new Error(`Invalid options found for the question!`);
        }
        const sequenceArray = Array.from(options, (o) => o.Sequence);
        const maxSequenceValue = Math.max(...sequenceArray);
        const minSequenceValue = Math.min(...sequenceArray);
        return { minSequenceValue, maxSequenceValue, options, paths, nodeId };
    }

    private questionNodeAsQueryDto(node: CAssessmentNode, assessment: AssessmentDto) {
        const questionNode = node as CAssessmentQuestionNode;
        const query: AssessmentQueryDto = {
            id                   : questionNode.id,
            DisplayCode          : questionNode.DisplayCode,
            PatientUserId        : assessment.PatientUserId,
            AssessmentTemplateId : assessment.AssessmentTemplateId,
            ParentNodeId         : questionNode.ParentNodeId,
            AssessmentId         : assessment.id,
            Sequence             : questionNode.Sequence,
            NodeType             : questionNode.NodeType as AssessmentNodeType,
            Title                : questionNode.Title,
            Description          : questionNode.Description,
            ExpectedResponseType : questionNode.QueryResponseType as QueryResponseType,
            Options              : questionNode.Options,
            ProviderGivenCode    : questionNode.ProviderGivenCode,
        };
        return query;
    }

    private messageNodeAsQueryDto(node: CAssessmentNode, assessment: AssessmentDto) {
        const messageNode = node as CAssessmentMessageNode;
        const query: AssessmentQueryDto = {
            id                   : messageNode.id,
            DisplayCode          : messageNode.DisplayCode,
            PatientUserId        : assessment.PatientUserId,
            AssessmentTemplateId : assessment.AssessmentTemplateId,
            ParentNodeId         : messageNode.ParentNodeId,
            AssessmentId         : assessment.id,
            Sequence             : messageNode.Sequence,
            NodeType             : messageNode.NodeType as AssessmentNodeType,
            Title                : messageNode.Title,
            Description          : messageNode.Description,
            ExpectedResponseType : QueryResponseType.Ok,
            Options              : [],
            ProviderGivenCode    : messageNode.ProviderGivenCode,
        };
        return query;
    }

    private handleAnswersToQuestion = async (
        answerModel: AssessmentAnswerDomainModel,
        assessment: AssessmentDto,
        node: CAssessmentNode,
        incomingResponseType: QueryResponseType) : Promise<AssessmentQuestionResponseDto>=> {

        const questionNode = node as CAssessmentQuestionNode;
        const expectedResponseType = questionNode.QueryResponseType;

        if (incomingResponseType !== expectedResponseType) {
            throw new Error(`Provided response type is different than expected response type.`);
        }
        
        if (incomingResponseType === QueryResponseType.SingleChoiceSelection) {
            return await this.handleSingleChoiceSelectionAnswer(assessment, questionNode, answerModel);
        }
        if (incomingResponseType === QueryResponseType.MultiChoiceSelection) {
            return await this.handleMultipleChoiceSelectionAnswer(assessment, questionNode, answerModel);
        }
        if (incomingResponseType === QueryResponseType.Biometrics) {
            return await this.handleBiometricsAnswer(assessment, questionNode, answerModel);
        }
        if (incomingResponseType === QueryResponseType.Text) {
            return await this.handleTextAnswer(assessment, questionNode, answerModel);
        }
        return null;
    };

    //#endregion

}
