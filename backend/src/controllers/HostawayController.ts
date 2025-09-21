import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { HostawayService } from '../services/HostawayService';

export class HostawayController extends BaseController {
  private hostawayService: HostawayService;

  constructor(hostawayService: HostawayService) {
    super();
    this.hostawayService = hostawayService;
  }

  getReviews = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const useApi = this.parseBooleanParam(req.query.useApi as string) || false;
    
    const result = await this.hostawayService.fetchReviews(true);
    
    res.json(result);
  });

  syncData = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.hostawayService.syncData();
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      this.sendError(res, result.message, 500);
    }
  });

  getApiStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const status = await this.hostawayService.getApiStatus();
    this.sendSuccess(res, status);
  });

  testConnection = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.hostawayService.testApiConnection();
    
    if (result.success) {
      this.sendSuccess(res, result);
    } else {
      this.sendError(res, result.message, 502, result.error);
    }
  });
}
