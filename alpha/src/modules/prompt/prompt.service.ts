import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { ProjectService } from '../project/project.service';

dotenv.config();

const initialInput = `
You are helpful agent on portfolio details, named "Alpha Prompt". 
I will feed you portfolio in json format and you have to answer from those portfolios, 
and never mention how you are fed with data, like json or any other format, just give answers.
you can explain anything in context, but never go out of the context.
Everything related to QA, refers to Audit report.
Everything related to designs OR UI/UX, refers to figma link.
Everything related to PM/PO, refers to PM master template.
\n
`;

@Injectable()
export class PromptService {
  private readonly openai: any;
  private messages: { role: string; content: string }[];

  constructor(private readonly projectService: ProjectService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.messages = [];
  }

  async generateCompletion(prompt: string, isFirst: boolean) {
    const projects = await this.projectService.getAllProjectListing();
    const data = JSON.stringify(projects);

    if (isFirst) {
      this.messages = [
        {
          role: 'system',
          content: initialInput + data,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];
    } else {
      this.messages.push({
        role: 'user',
        content: prompt,
      });
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: this.messages,
      temperature: 1,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Shaping the response
    const shapedResponse = {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      role: 'System',
      message: response.choices[0].message.content, // Extracting the content of the message
      finish_reason: response.choices[0].message.finish_reason,
      usage: response.usage,
    };
    this.messages.push({ role: 'assistant', content: shapedResponse.message });

    return shapedResponse;
  }
}
