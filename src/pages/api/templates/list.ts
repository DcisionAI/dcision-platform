import { NextApiRequest, NextApiResponse } from 'next';
import { templateLoader } from '@/templates/optimization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      domain, 
      complexity, 
      problemType, 
      tags, 
      intent,
      templateId 
    } = req.query;

    // If specific template ID is requested
    if (templateId && typeof templateId === 'string') {
      const template = templateLoader.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.status(200).json({ template });
    }

    // Search criteria
    const criteria: any = {};
    if (domain) criteria.domain = domain;
    if (complexity) criteria.complexity = complexity;
    if (problemType) criteria.problemType = problemType;
    if (tags) criteria.tags = Array.isArray(tags) ? tags : [tags];
    if (intent) criteria.intent = intent;

    let templates;
    let recommendations;

    if (intent) {
      // Get recommendations based on intent
      recommendations = templateLoader.getTemplateRecommendations(
        intent as string, 
        domain as string
      );
      templates = recommendations.map(r => r.template);
    } else if (Object.keys(criteria).length > 0) {
      // Search with criteria
      templates = templateLoader.searchTemplates(criteria);
    } else {
      // Get all templates
      templates = templateLoader.getAllTemplates();
    }

    return res.status(200).json({
      templates,
      recommendations,
      total: templates.length,
      criteria: Object.keys(criteria).length > 0 ? criteria : undefined
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 