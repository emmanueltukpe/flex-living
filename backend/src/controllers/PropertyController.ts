import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { PropertyService } from '../services/PropertyService';
import { ReviewService } from '../services/ReviewService';
import { PropertyFilters } from '../types';

export class PropertyController extends BaseController {
  private propertyService: PropertyService;
  private reviewService: ReviewService;

  constructor(propertyService: PropertyService, reviewService: ReviewService) {
    super();
    this.propertyService = propertyService;
    this.reviewService = reviewService;
  }

  getAllProperties = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = this.buildPropertyFilters(req.query);
    const result = await this.propertyService.getAllProperties(filters);
    
    res.json(result);
  });

  getPropertyById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    this.validateId(id);
    
    const propertyWithReviews = await this.propertyService.getPropertyWithReviews(id, this.reviewService);
    this.sendSuccess(res, propertyWithReviews);
  });

  updateProperty = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    this.validateId(id);
    
    const updateData = this.sanitizeInput(req.body);
    const updatedProperty = await this.propertyService.updateProperty(id, updateData);
    
    this.sendSuccess(res, updatedProperty);
  });

  getActiveProperties = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sorting = this.extractSortParams(req.query, 'avgRating');
    const properties = await this.propertyService.getActiveProperties(sorting.sortBy, sorting.order);
    
    this.sendSuccess(res, properties);
  });

  getPropertiesByType = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type } = req.query;
    
    if (!type || typeof type !== 'string') {
      this.sendError(res, 'Property type is required', 400);
      return;
    }
    
    const properties = await this.propertyService.getPropertiesByType(type);
    this.sendSuccess(res, properties);
  });

  getPropertiesByCapacity = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const minGuests = this.parseNumericParam(req.query.minGuests as string);
    const maxGuests = this.parseNumericParam(req.query.maxGuests as string);
    
    if (!minGuests) {
      this.sendError(res, 'minGuests parameter is required', 400);
      return;
    }
    
    const properties = await this.propertyService.getPropertiesByCapacity(minGuests, maxGuests);
    this.sendSuccess(res, properties);
  });

  getHighRatedProperties = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const minRating = this.parseNumericParam(req.query.minRating as string, 8);
    const properties = await this.propertyService.getPropertiesWithHighRating(minRating);
    
    this.sendSuccess(res, properties);
  });

  getLowRatedProperties = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const maxRating = this.parseNumericParam(req.query.maxRating as string, 6);
    const properties = await this.propertyService.getPropertiesWithLowRating(maxRating);
    
    this.sendSuccess(res, properties);
  });

  getPropertyStatistics = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const statistics = await this.propertyService.getPropertyStatistics();
    this.sendSuccess(res, statistics);
  });

  activateProperty = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { externalId } = req.params;
    this.validateRequiredParam(externalId, 'externalId');
    
    const property = await this.propertyService.activateProperty(externalId);
    this.sendSuccess(res, property);
  });

  deactivateProperty = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { externalId } = req.params;
    this.validateRequiredParam(externalId, 'externalId');
    
    const property = await this.propertyService.deactivateProperty(externalId);
    this.sendSuccess(res, property);
  });

  private buildPropertyFilters(query: any): PropertyFilters {
    const sorting = this.extractSortParams(query, 'avgRating');
    
    return {
      isActive: this.parseBooleanParam(query.isActive),
      sortBy: sorting.sortBy,
      order: sorting.order
    };
  }
}
