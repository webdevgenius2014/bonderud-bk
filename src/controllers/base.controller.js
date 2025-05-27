import { ApiResponse, ApiError, Pagination } from '../utils/index.js';
import logger from '../config/logger.js';

export class BaseController {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  async getAll(req, res) {
    try {
      const options = Pagination.getOptions(req.query);
      const skip = Pagination.getSkip(options.page, options.limit);
      const sortOptions = Pagination.getSortOptions(options.sort || 'createdAt', options.order || 'desc');

      const [items, total] = await Promise.all([
        this.model
          .find()
          .sort(sortOptions)
          .skip(skip)
          .limit(options.limit)
          .lean(),
        this.model.countDocuments(),
      ]);

      const result = Pagination.createResult(items, total, options.page, options.limit);
      
      res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      logger.error(`Error fetching ${this.modelName}s:`, error);
      throw ApiError.internalServer(`Failed to fetch ${this.modelName}s`);
    }
  }

  async getById(req, res) {
    try {
      const item = await this.model.findById(req.params.id).lean();
      
      if (!item) {
        throw ApiError.notFound(`${this.modelName} not found`);
      }

      res.status(200).json(ApiResponse.success(item));
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Error fetching ${this.modelName}:`, error);
      throw ApiError.internalServer(`Failed to fetch ${this.modelName}`);
    }
  }

  async create(req, res) {
    try {
      const item = await this.model.create(req.body);
      res.status(201).json(ApiResponse.created(item));
    } catch (error) {
      logger.error(`Error creating ${this.modelName}:`, error);
      throw ApiError.internalServer(`Failed to create ${this.modelName}`);
    }
  }

  async update(req, res) {
    try {
      const item = await this.model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).lean();

      if (!item) {
        throw ApiError.notFound(`${this.modelName} not found`);
      }

      res.status(200).json(ApiResponse.updated(item));
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Error updating ${this.modelName}:`, error);
      throw ApiError.internalServer(`Failed to update ${this.modelName}`);
    }
  }

  async delete(req, res) {
    try {
      const item = await this.model.findByIdAndDelete(req.params.id);

      if (!item) {
        throw ApiError.notFound(`${this.modelName} not found`);
      }

      res.status(200).json(ApiResponse.deleted());
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Error deleting ${this.modelName}:`, error);
      throw ApiError.internalServer(`Failed to delete ${this.modelName}`);
    }
  }
}