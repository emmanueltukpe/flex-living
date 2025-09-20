import { BaseService } from "./BaseService";

export interface Template {
  _id: string;
  name: string;
  content: string;
  category: 'positive' | 'negative' | 'neutral' | 'general';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateService extends BaseService {
  private templates: Template[] = [
    {
      _id: '1',
      name: 'Thank You - Positive Review',
      content: 'Thank you so much for your wonderful review! We\'re delighted to hear that you enjoyed your stay at {propertyName}. Your feedback about {specificAspect} means a lot to us. We look forward to welcoming you back soon!',
      category: 'positive',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: 'Apology - Negative Review',
      content: 'Thank you for taking the time to share your feedback. We sincerely apologize that your experience at {propertyName} did not meet your expectations. We take all feedback seriously and are working to address the issues you mentioned. Please feel free to contact us directly so we can make this right.',
      category: 'negative',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '3',
      name: 'General Response',
      content: 'Thank you for choosing {propertyName} and for sharing your review. We appreciate your feedback and are always working to improve our guests\' experience. We hope to have the opportunity to welcome you back in the future.',
      category: 'general',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  async getAll(): Promise<Template[]> {
    return this.templates.filter(t => t.isActive);
  }

  async getById(id: string): Promise<Template | null> {
    return this.templates.find(t => t._id === id) || null;
  }

  async create(templateData: any): Promise<Template> {
    const template: Template = {
      _id: Date.now().toString(),
      name: this.sanitizeString(templateData.name),
      content: this.sanitizeString(templateData.content),
      category: templateData.category || 'general',
      isActive: templateData.isActive !== undefined ? templateData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(template);
    return template;
  }

  async update(id: string, updateData: any): Promise<Template | null> {
    const templateIndex = this.templates.findIndex(t => t._id === id);
    
    if (templateIndex === -1) {
      return null;
    }

    const template = this.templates[templateIndex];
    
    if (updateData.name) template.name = this.sanitizeString(updateData.name);
    if (updateData.content) template.content = this.sanitizeString(updateData.content);
    if (updateData.category) template.category = updateData.category;
    if (updateData.isActive !== undefined) template.isActive = updateData.isActive;
    template.updatedAt = new Date();

    this.templates[templateIndex] = template;
    return template;
  }

  async delete(id: string): Promise<boolean> {
    const templateIndex = this.templates.findIndex(t => t._id === id);
    
    if (templateIndex === -1) {
      return false;
    }

    this.templates.splice(templateIndex, 1);
    return true;
  }

  async getByCategory(category: string): Promise<Template[]> {
    return this.templates.filter(t => t.category === category && t.isActive);
  }

  processTemplate(templateContent: string, variables: Record<string, string>): string {
    let processed = templateContent;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    }

    return processed;
  }
}
