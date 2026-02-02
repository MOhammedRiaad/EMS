import {
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { GoalType } from '../entities/client-goal.entity';

export class CreateGoalDto {
  @IsEnum(GoalType)
  goalType: GoalType;

  @IsNumber()
  targetValue: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
