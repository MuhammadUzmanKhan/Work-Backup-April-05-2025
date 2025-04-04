import { faker } from '@faker-js/faker';
import { Model } from 'sequelize-typescript';
import { createFixture } from './create-fixture';

export class FixtureService {
  public generateFixture<T extends Model>(
    model: { new (): T },
    count: number = 1,
    iteration: number = 1,
  ): Partial<T>[] | Partial<T> {
    const fixtures: Partial<T>[] = [];
    for (let i = 0; i < count; i++) {
      const instance = this.generateRandomValues(model, iteration);
      fixtures.push(instance);
    }
    if (count <= 1) return fixtures[0];
    return fixtures;
  }

  private generateRandomValues<T extends Model>(
    model: {
      new (): T;
    },
    iteration: number = 1,
  ): Partial<T> {
    const values = {};

    const associations = (model as any).associations;

    if (iteration == 1) {
      Object.keys(associations).forEach((associationName) => {
        const association = associations[associationName];

        values[associationName] = createFixture(
          association.target.name,
          ['HasMany', 'BelongsToMany'].includes(association.associationType)
            ? Math.floor(Math.random() * (5 - 2 + 1)) + 2
            : 1,
          2,
        );
      });
    }

    const attributes = (model as any).rawAttributes;

    Object.keys(attributes).forEach((key) => {
      const fieldType = attributes[key].type.key;
      values[key] = this.generateRandomValueBasedOnType(fieldType);
    });

    return values as Partial<T>;
  }

  private generateRandomValueBasedOnType(type: string): any {
    switch (type) {
      case 'STRING':
        return faker.lorem.words();
      case 'INTEGER':
        return faker.number.int();
      case 'BOOLEAN':
        return faker.datatype.boolean();
      case 'DATE':
        return faker.date.recent();
      case 'JSONB':
      case 'JSON':
        return this.generateRandomJson();

      default:
        return null;
    }
  }

  private generateRandomJson(): any {
    return {
      key1: faker.lorem.word(),
      key2: faker.number.int(),
      key3: faker.datatype.boolean(),
      nestedObject: {
        nestedKey1: faker.lorem.word(),
        nestedKey2: faker.datatype.boolean(),
      },
    };
  }
}
