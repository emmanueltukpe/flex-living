import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from "mongoose";
import { DatabaseError, NotFoundError } from "../types/validation";

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model as any;
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      return await this.model.find(filter, null, options).exec();
    } catch (error) {
      throw new DatabaseError("Failed to fetch documents", error as Error);
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch document with id ${id}`,
        error as Error
      );
    }
  }

  async findByExternalIds(externalId: string): Promise<T | null> {
    try {
      return await this.model.findOne({ externalId }).exec();
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch document with externalId ${externalId}`,
        error as Error
      );
    }
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOne(filter).exec();
    } catch (error) {
      throw new DatabaseError("Failed to fetch document", error as Error);
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new DatabaseError("Failed to create document", error as Error);
    }
  }

  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true, runValidators: true }
  ): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, update, options).exec();
    } catch (error) {
      throw new DatabaseError(
        `Failed to update document with id ${id}`,
        error as Error
      );
    }
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true, runValidators: true }
  ): Promise<T | null> {
    try {
      return await this.model.findOneAndUpdate(filter, update, options).exec();
    } catch (error) {
      throw new DatabaseError("Failed to update document", error as Error);
    }
  }

  async deleteById(id: string): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id).exec();
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete document with id ${id}`,
        error as Error
      );
    }
  }

  async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOneAndDelete(filter).exec();
    } catch (error) {
      throw new DatabaseError("Failed to delete document", error as Error);
    }
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw new DatabaseError("Failed to count documents", error as Error);
    }
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const count = await this.model.countDocuments(filter).limit(1).exec();
      return count > 0;
    } catch (error) {
      throw new DatabaseError(
        "Failed to check document existence",
        error as Error
      );
    }
  }

  async findWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 20,
    sort: Record<string, 1 | -1> = {}
  ): Promise<{
    documents: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [documents, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
        this.model.countDocuments(filter).exec(),
      ]);

      return {
        documents,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new DatabaseError(
        "Failed to fetch paginated documents",
        error as Error
      );
    }
  }

  async aggregate<R = unknown>(pipeline: any[]): Promise<R[]> {
    try {
      return await this.model.aggregate(pipeline).exec();
    } catch (error) {
      throw new DatabaseError("Failed to execute aggregation", error as Error);
    }
  }

  async upsert(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { upsert: true, new: true }
  ): Promise<T> {
    try {
      const result = await this.model
        .findOneAndUpdate(filter, update, options)
        .exec();
      if (!result) {
        throw new DatabaseError("Upsert operation failed");
      }
      return result;
    } catch (error) {
      throw new DatabaseError("Failed to upsert document", error as Error);
    }
  }

  protected async findByIdOrThrow(
    id: string,
    resourceName: string = "Document"
  ): Promise<T> {
    const document = await this.findById(id);
    if (!document) {
      throw new NotFoundError(resourceName, id);
    }
    return document;
  }

  protected async findOneOrThrow(
    filter: FilterQuery<T>,
    resourceName: string = "Document"
  ): Promise<T> {
    const document = await this.findOne(filter);
    if (!document) {
      throw new NotFoundError(resourceName);
    }
    return document;
  }
}
