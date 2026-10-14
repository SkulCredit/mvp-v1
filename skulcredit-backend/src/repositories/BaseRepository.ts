import {
  Model,
  ModelStatic,
  FindOptions,
  CreateOptions,
  WhereOptions,
} from 'sequelize';

export class BaseRepository<TModel extends Model> {
  protected model: ModelStatic<TModel>;

  constructor(model: ModelStatic<TModel>) {
    this.model = model;
  }

  create(data: TModel['_creationAttributes'], options: CreateOptions = {}): Promise<TModel> {
    return this.model.create(data, options);
  }

  findById(id: string, options: FindOptions = {}): Promise<TModel | null> {
    return this.model.findByPk(id, options);
  }

  findOne(where: WhereOptions, options: FindOptions = {}): Promise<TModel | null> {
    return this.model.findOne({ where, ...options });
  }

  find(where: WhereOptions = {}, options: FindOptions = {}): Promise<TModel[]> {
    return this.model.findAll({ where, ...options });
  }

  count(where: WhereOptions = {}): Promise<number> {
    return this.model.count({ where });
  }

  async updateById(id: string, data: Partial<TModel['_attributes']>): Promise<TModel | null> {
    const record = await this.model.findByPk(id);
    if (!record) return null;
    return record.update(data);
  }

  updateWhere(where: WhereOptions, data: Partial<TModel['_attributes']>): Promise<[number, TModel[]]> {
    return this.model.update(data, { where, returning: true }) as Promise<[number, TModel[]]>;
  }

  async deleteById(id: string): Promise<TModel | null> {
    const record = await this.model.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  }
}
