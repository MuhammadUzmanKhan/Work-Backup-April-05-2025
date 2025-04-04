import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { SkillDto } from "./dto/skill.dto";
import { Skills } from "src/common/models/skills.model";
import { skillsMessages } from "src/common/constants/messages";

@Injectable()
export class SkillService {

  public async createSkills(skillDtos: SkillDto[]): Promise<{ message: string, skills: Skills[] }> {
    const skillNames = [...new Set(skillDtos.map(({ name }) => name))];
    try {
      const existingSkills = await Skills.findAll({
        where: { name: skillNames }
      });

      const existingSkillNames = new Set(existingSkills.map(({ name }) => name));

      const newSkillsData = skillDtos
        .filter(({ name }) => !existingSkillNames.has(name))
        .map(({ name }) => ({ name }));

      let createdSkills: Skills[] = [];

      if (newSkillsData.length > 0) {
        createdSkills = await Skills.bulkCreate(newSkillsData);
      }

      const allSkills = [...existingSkills, ...createdSkills];

      return {
        message: skillsMessages.skillCreated,
        skills: allSkills,
      };
    } catch (err) {
      console.error(skillsMessages.skillCreateError, err);
      throw new InternalServerErrorException(err);
    }
  }

}
