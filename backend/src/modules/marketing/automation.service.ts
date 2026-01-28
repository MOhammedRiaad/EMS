import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule, AutomationTriggerType } from './entities/automation-rule.entity';

@Injectable()
export class AutomationService {
    constructor(
        @InjectRepository(AutomationRule)
        private ruleRepository: Repository<AutomationRule>
    ) { }

    async create(createDto: any): Promise<AutomationRule> {
        const rule = this.ruleRepository.create(createDto);
        return (await this.ruleRepository.save(rule)) as unknown as AutomationRule;
    }

    async findAll(): Promise<AutomationRule[]> {
        return this.ruleRepository.find();
    }

    async update(id: string, updateDto: any): Promise<AutomationRule> {
        await this.ruleRepository.update(id, updateDto);
        const rule = await this.ruleRepository.findOne({ where: { id } });
        if (!rule) {
            throw new Error(`AutomationRule with ID ${id} not found`);
        }
        return rule;
    }

    async delete(id: string): Promise<void> {
        await this.ruleRepository.delete(id);
    }

    // This method would be called by other modules via EventListener
    async triggerEvent(type: AutomationTriggerType, context: any) {
        // Find active rules for this trigger type
        const rules = await this.ruleRepository.find({
            where: { triggerType: type, isActive: true }
        });

        for (const rule of rules) {
            await this.executeAction(rule, context);
        }
    }

    private async executeAction(rule: AutomationRule, context: any) {
        console.log(`[Automation] Executing rule "${rule.name}" for trigger "${rule.triggerType}"`, rule.actionPayload);
        // Implement action logic (email, sms, etc.) here
        // e.g. if (rule.actionType === 'send_email') mailerService.send(...)
    }
}
